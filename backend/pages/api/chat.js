const fetch = require('node-fetch');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Pinecone } = require('@pinecone-database/pinecone');

// Initialize clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

// Helper function to retrieve relevant context from Pinecone
async function getRelevantContext(query, ticker = null, topK = 3) {
  try {
    console.log(`Retrieving context for query: "${query}", ticker: ${ticker || 'any'}`);
    
    // Generate embedding for the user query
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const embeddingResponse = await model.embedContent(query);
    const queryVector = embeddingResponse.embedding.values;
    
    // Query Pinecone
    const index = pinecone.Index('sec-filings');
    const filter = ticker ? { ticker: ticker.toUpperCase() } : {};
    
    const queryResponse = await index.namespace('var').query({
      vector: queryVector,
      topK: topK,
      includeMetadata: true,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });
    
    if (!queryResponse.matches || queryResponse.matches.length === 0) {
      console.log('No relevant context found in Pinecone');
      return null;
    }
    
    // Extract and format context
    const contexts = queryResponse.matches
      .filter(match => match.score > 0.5) // Only use high-confidence matches
      .map(match => ({
        text: match.metadata?.text || '',
        ticker: match.metadata?.ticker || 'Unknown',
        section: match.metadata?.section || 'Unknown',
        score: match.score,
        year: match.metadata?.year || 'Unknown'
      }));
    
    console.log(`Found ${contexts.length} relevant contexts with scores:`, contexts.map(c => c.score));
    
    return contexts;
  } catch (error) {
    console.error('Error retrieving context from Pinecone:', error.message);
    return null;
  }
}

// Helper function to extract ticker symbols from user message
function extractTickers(message) {
  // Match common ticker patterns (2-5 uppercase letters)
  const tickerPattern = /\b([A-Z]{2,5})\b/g;
  const matches = message.match(tickerPattern);
  
  if (!matches) return [];
  
  // Filter out common words that might match the pattern
  const commonWords = ['AI', 'CEO', 'IPO', 'ETF', 'ESG', 'USA', 'USD', 'SEC', 'FAQ'];
  return matches.filter(match => !commonWords.includes(match));
}

export default async function handler(req, res) {
  // Set CORS headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request for /api/chat');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    console.error(`Method ${req.method} not allowed`);
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const { message, persona, ticker } = req.body;
  console.log('POST /api/chat received:', { message, persona, ticker });

  if (!message) {
    console.error('Validation failed: Missing message');
    return res.status(400).json({ error: 'Missing message' });
  }

  if (!persona) {
    console.error('Validation failed: Missing persona');
    return res.status(400).json({ error: 'Missing persona' });
  }

  try {
    // Extract ticker from message if not provided
    const detectedTickers = ticker ? [ticker] : extractTickers(message);
    const targetTicker = detectedTickers.length > 0 ? detectedTickers[0] : null;
    
    // Retrieve relevant context from Pinecone
    const contexts = await getRelevantContext(message, targetTicker, 3);
    
    // Build enhanced system prompt with context
    let systemPrompt = `You are a financial assistant tailored to the ${persona} persona. Provide concise, relevant financial advice.`;
    
    if (contexts && contexts.length > 0) {
      systemPrompt += `\n\nYou have access to the following relevant information from SEC filings:\n\n`;
      contexts.forEach((ctx, idx) => {
        systemPrompt += `Context ${idx + 1} (${ctx.ticker} - ${ctx.year}, Section: ${ctx.section}, Relevance: ${(ctx.score * 100).toFixed(1)}%):\n${ctx.text}\n\n`;
      });
      systemPrompt += `Use this information to provide accurate, data-driven advice. Always cite the company and year when referencing this data.`;
    }
    
    // Directly integrate the OpenRouter API key
    const apiKey = process.env.OPENROUTER_API_KEY || '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';
    
    console.log('Sending request to OpenRouter with context...');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          { role: 'user', content: message },
        ],
      }),
    });
    
    console.log(`OpenRouter response status: ${response.status}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenRouter error:', JSON.stringify(data, null, 2));
      throw new Error(data.error?.message || 'Failed to fetch response from OpenRouter');
    }

    const reply = data.choices[0].message.content;
    console.log('Chat response from OpenRouter:', reply.substring(0, 200) + '...');
    
    return res.status(200).json({ 
      success: true, 
      reply,
      contextUsed: contexts ? contexts.length : 0,
      sources: contexts ? contexts.map(c => ({ ticker: c.ticker, year: c.year, section: c.section })) : []
    });
  } catch (error) {
    console.error('Error during chat request:', error.message);
    console.log('Using fallback response');
    
    // Provide a fallback response with example financial advice
    const fallbackResponses = {
      'Innovator': "Look into emerging technologies like AI, blockchain, and quantum computing. Consider allocating 10-15% of your portfolio to innovation-focused ETFs.",
      'Traditionalist': "A balanced portfolio with 60% in index funds, 30% in bonds, and 10% in cash reserves would be prudent for long-term stability.",
      'Adventurer': "Consider emerging markets in Southeast Asia where there's high growth potential. A barbell strategy with both safe assets and high-risk ventures could work well.",
      'Athlete': "Think of your investment strategy like training: consistent contributions to your accounts, regular portfolio reviews, and a disciplined approach to meeting goals.",
      'Artist': "ESG investments that align with your values can provide both financial returns and social impact. Consider sustainable funds that support creative industries."
    };
    
    const fallbackResponse = fallbackResponses[persona] || "I recommend a diversified portfolio based on your financial goals and risk tolerance.";
    
    return res.status(200).json({ 
      success: true, 
      reply: fallbackResponse,
      contextUsed: 0,
      note: "This is a fallback response since the AI service couldn't be reached."
    });
  }
}