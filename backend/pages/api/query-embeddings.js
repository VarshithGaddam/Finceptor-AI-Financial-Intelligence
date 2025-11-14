const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Pinecone } = require('@pinecone-database/pinecone');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { query, ticker, section, topK = 10, namespace = 'default' } = req.body;
        if (!query) return res.status(400).json({ error: 'Missing query' });

        console.log(`Querying Pinecone: ticker=${ticker}, namespace=${namespace}, topK=${topK}`);

        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const response = await model.embedContent(query);
        const queryVector = response.embedding.values;

        const index = pinecone.Index('sec-filings');
        await index.describeIndexStats(); // Test connection

        const queryResponse = await index.namespace(namespace).query({
            topK: Math.min(topK, 10),
            vector: queryVector,
            includeMetadata: true,
            filter: {
                ...(ticker && { ticker }),
                ...(section && { section }),
            },
        });

        res.status(200).json({ matches: queryResponse.matches, namespace });
    } catch (error) {
        console.error('Error querying embeddings:', error.message);
        res.status(500).json({ error: 'Failed to query embeddings', details: error.message });
    }
}