import { exec } from 'child_process';
import util from 'util';
import fetch from 'node-fetch';

const execPromise = util.promisify(exec);

const LARGE_CAP_TICKERS = [
  'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'GOOG', 'META', 'TSLA', 'BRK.A', 'BRK.B', 
  'JPM', 'V', 'PG', 'UNH', 'HD', 'MA', 'BAC', 'XOM', 'DIS', 'NVDA', 'PYPL',
  'ADBE', 'INTC', 'CMCSA', 'PFE', 'WMT', 'CRM', 'NFLX', 'VZ', 'ABT', 'KO'
];

// Valid SEC form types
const VALID_FORM_TYPES = ['10-K', '10-Q'];

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { ticker, formType, year } = req.body;

  // Validate inputs
  if (!ticker || !formType || !year) {
    return res.status(400).json({ message: 'Missing required parameters: ticker, formType, year' });
  }

  if (!VALID_FORM_TYPES.includes(formType.toUpperCase())) {
    return res.status(400).json({ message: `Invalid form type: ${formType}. Supported types are ${VALID_FORM_TYPES.join(', ')}.` });
  }

  const currentYear = new Date().getFullYear();
  const yearInt = parseInt(year);
  if (isNaN(yearInt) || yearInt > currentYear) {
    return res.status(400).json({ message: `Invalid year ${year}. Must be a number not exceeding the current year (${currentYear}).` });
  }

  const isLargeCapTicker = LARGE_CAP_TICKERS.includes(ticker.toUpperCase());
  const isSpecialTicker = ticker.toUpperCase() === 'TSLA';
  
  if (isLargeCapTicker) {
    console.log(`Using enhanced handling for ${ticker.toUpperCase()} filing (large cap stock)`);
  }
  
  try {
    const pythonArgs = `${ticker} ${formType} ${year}`;
    const pythonCommand = `py "${process.cwd()}/sec_parser.py" ${pythonArgs}`;
    console.log(`Executing command: ${pythonCommand}`);
    
    let maxBuffer = 10 * 1024 * 1024; // 10MB default
    if (isSpecialTicker) {
      maxBuffer = 50 * 1024 * 1024; // 50MB for TSLA
    } else if (isLargeCapTicker) {
      maxBuffer = 30 * 1024 * 1024; // 30MB for large caps
    }
    
    console.log(`Using maxBuffer of ${maxBuffer/(1024*1024)}MB for ${ticker}`);
    
    const { stdout, stderr } = await execPromise(pythonCommand, { maxBuffer });
    
    if (stderr && stderr.trim() !== '') {
      console.log('Python script messages:', stderr);
      const isArtificialSectionMessage = stderr.includes('No sections parsed; sample content:') && 
                                    (stderr.includes('Created artificial sections') || isLargeCapTicker);
      const containsErrors = stderr.includes('ERROR:') && !isArtificialSectionMessage && (!stdout || stdout.trim() === '');
      const containsOnlyWarnings = stderr.includes('WARNING:') && !containsErrors;
      
      if ((isSpecialTicker || isLargeCapTicker) && stderr.includes('table of contents') && containsErrors) {
        return res.status(500).json({ 
          message: `This filing has a complex format. We're using a fallback method to parse it.`,
          details: stderr
        });
      }
      
      if (containsErrors) {
        if (stderr.includes('No filing found')) {
          return res.status(404).json({ message: `No filing found for ${ticker} ${formType} ${year}` });
        }
        return res.status(500).json({ message: `Error processing SEC filing: ${stderr}` });
      }
      
      console.log('Processing continues with warnings:', stderr);
    }
    
    let result;
    try {
      const trimmedOutput = stdout.trim();
      if (!trimmedOutput) {
        return res.status(500).json({ 
          message: 'Empty response from Python script',
          stderr: stderr
        });
      }
      
      result = JSON.parse(trimmedOutput);
    } catch (parseError) {
      console.error('Error parsing Python script output:', parseError);
      console.log('Python script output (first 500 chars):', stdout.substring(0, 500));
      console.log('Python script output (last 500 chars):', stdout.substring(stdout.length - 500));
      
      if (isLargeCapTicker) {
        return res.status(500).json({ 
          message: 'This filing is complex and may require special handling. Please try a smaller company or a different period.',
          error: parseError.message,
          partial_output: stdout.substring(0, 500) + '...[truncated]...'
        });
      }
      
      return res.status(500).json({ 
        message: 'Error parsing Python script output', 
        error: parseError.message,
        partial_output: stdout.substring(0, 1000) + '...[truncated]...' + stdout.substring(stdout.length - 1000)
      });
    }
    
    if (result.error) {
      if (result.error.includes('Filing could not be processed')) {
        return res.status(404).json({ message: `No filing found for ${ticker} ${formType} ${year}` });
      }
      if ((isSpecialTicker || isLargeCapTicker) && result.error.includes('table of contents')) {
        return res.status(500).json({ 
          message: 'This company has complex filings with a special structure. We are using a generic table of contents.'
        });
      }
      return res.status(500).json({ message: result.error });
    }
    
    // Store embeddings
    const embedResponse = await fetch('http://localhost:3001/api/store-embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chunks: result.chunked.chunks,
        metadata: { ticker }
      }),
    });

    let embedData;
    try {
      embedData = await embedResponse.json();
    } catch (error) {
      // Handle non-JSON responses (e.g., 413 Payload Too Large)
      const responseText = await embedResponse.text();
      console.error('Failed to parse store-embeddings response:', responseText);
      return res.status(embedResponse.status).json({ 
        message: 'Failed to store embeddings', 
        details: responseText || 'Invalid response from store-embeddings'
      });
    }

    if (!embedResponse.ok) {
      console.error('Embedding error:', embedData);
      return res.status(embedResponse.status).json({ 
        message: 'Failed to store embeddings', 
        details: embedData.error || 'Unknown error'
      });
    } else {
      console.log('Embedding success:', embedData);
    }

    return res.status(200).json({ 
      ...result, 
      year: year, // Add top-level year field
      embedData: {
        upsertedCount: embedData.upsertedCount,
        skippedCount: embedData.skippedCount
      }
    });
  } catch (error) {
    console.error('Error executing Python script:', error);
    
    if (isLargeCapTicker && error.message.includes('maxBuffer exceeded')) {
      return res.status(500).json({ 
        message: 'This filing is very large and complex. Try using a different year or form type.',
        error: 'Size limit exceeded'
      });
    }
    
    return res.status(500).json({ 
      message: `Error processing SEC filing: ${error.message}`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}