const { Pinecone } = require('@pinecone-database/pinecone');

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { vector, ticker, namespace = 'default', topK = 5 } = req.body;
        if (!vector) return res.status(400).json({ error: 'Missing vector' });
        if (!ticker) return res.status(400).json({ error: 'Missing ticker' });
        if (!Array.isArray(vector) || vector.length !== 768) {
            return res.status(400).json({ error: 'Vector must be an array of 768 numbers' });
        }

        console.log(`Searching chunks by vector for ticker: ${ticker}, namespace: ${namespace}, topK: ${topK}`);

        // Query Pinecone for similar chunks with ticker filter
        const index = pinecone.Index('sec-filings');
        await index.describeIndexStats();

        const queryResponse = await index.namespace(namespace).query({
            topK: Math.min(topK, 100),
            vector: vector,
            includeMetadata: true,
            includeValues: false,
            filter: { ticker },
        });

        // Format the results with similarity scores
        const chunks = queryResponse.matches.map(match => ({
            id: match.id,
            ticker: match.metadata?.ticker || 'N/A',
            section: match.metadata?.section || 'N/A',
            source: match.metadata?.source || 'N/A',
            tokens: match.metadata?.tokens || 0,
            text: match.metadata?.text || 'N/A',
            similarity: match.score,
        }));

        res.status(200).json({ chunks, namespace, total: chunks.length });
    } catch (error) {
        console.error('Error searching chunks by vector:', error.message);
        res.status(500).json({ error: 'Failed to search chunks by vector', details: error.message });
    }
}