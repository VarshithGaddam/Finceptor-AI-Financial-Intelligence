// backend/pages/api/fetch-by-ticker.js

import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.Index(process.env.PINECONE_INDEX);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Only GET requests allowed' });
  }

  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: 'Ticker parameter is required' });
  }

  try {
    const namespace = ticker.toUpperCase();

    // Use .describeIndexStats() to get total vector count for the namespace (optional)
    const describe = await index.describeIndexStats();
    const vectorCount = describe.namespaces?.[namespace]?.vectorCount || 0;

    if (vectorCount === 0) {
      return res.status(404).json({ message: `No data found for ticker ${ticker}` });
    }

    // Use fetch() in batches or assume you know the vector IDs if you stored them
    const result = await index.query({
      topK: 100, // adjust as needed
      vector: new Array(1536).fill(0), // dummy vector for retrieval
      namespace,
      includeMetadata: true,
    });

    return res.status(200).json({
      ticker: namespace,
      count: result.matches.length,
      data: result.matches.map(match => ({
        id: match.id,
        score: match.score,
        metadata: match.metadata,
      })),
    });

  } catch (error) {
    console.error('Fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
