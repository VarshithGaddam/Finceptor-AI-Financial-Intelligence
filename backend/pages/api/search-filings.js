import { get_gemini_embedding } from '../../utils/embeddings';
const { Pinecone } = require('@pinecone-database/pinecone');

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { query, ticker, year, section, topK = 5, namespace = 'var' } = req.body;

  if (!query) {
    return res.status(400).json({ message: 'Query is required' });
  }

  try {
    // Step 1: Convert user query to vector using text-embedding-004
    console.log('Generating embedding for query:', query);
    const queryEmbedding = await get_gemini_embedding(query);
    if (!queryEmbedding) {
      throw new Error('Failed to generate query embedding');
    }
    console.log('Query embedding generated, dimension:', queryEmbedding.length);

    // Step 2: Build the Pinecone filter
    const filter = {};
    if (ticker) filter.ticker = ticker.toUpperCase();
    if (year) filter.year = year.toString(); // Store as string for consistency
    if (section) filter.section = section;

    // Step 3: Search Pinecone with the query vector and filter
    console.log('Searching Pinecone with filter:', filter, 'namespace:', namespace);
    const index = pinecone.Index('sec-filings');
    const results = await index.namespace(namespace).query({
      vector: queryEmbedding,
      topK: parseInt(topK),
      includeMetadata: true,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });

    console.log('Pinecone search results:', results.matches.length, 'matches found');
    
    // Format results with relevance scores
    const formattedResults = results.matches.map(match => ({
      id: match.id,
      score: match.score,
      relevance: (match.score * 100).toFixed(1) + '%',
      ticker: match.metadata?.ticker || 'Unknown',
      year: match.metadata?.year || 'Unknown',
      section: match.metadata?.section || 'Unknown',
      text: match.metadata?.text || '',
      tokens: match.metadata?.tokens || 0,
    }));

    return res.status(200).json({
      success: true,
      query,
      resultsCount: formattedResults.length,
      results: formattedResults,
      filters: filter,
    });
  } catch (error) {
    console.error('Error searching filings:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error searching filings', 
      error: error.message 
    });
  }
}