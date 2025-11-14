const { Pinecone } = require('@pinecone-database/pinecone');

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { id, namespace = 'default' } = req.body;
        if (!id) return res.status(400).json({ error: 'Missing id' });

        console.log(`Fetching chunk with id: ${id}, namespace: ${namespace}`);

        const index = pinecone.Index('sec-filings');
        await index.describeIndexStats(); // Test connection

        const fetchResponse = await index.namespace(namespace).fetch([id]);

        if (!fetchResponse.vectors || !fetchResponse.vectors[id]) {
            return res.status(404).json({ error: `Chunk with id ${id} not found in namespace ${namespace}` });
        }

        const vector = fetchResponse.vectors[id];
        const chunkData = {
            id: vector.id,
            ticker: vector.metadata?.ticker || 'N/A',
            section: vector.metadata?.section || 'N/A',
            source: vector.metadata?.source || 'N/A',
            tokens: vector.metadata?.tokens || 0,
            text: vector.metadata?.text || 'N/A'
        };

        res.status(200).json({ chunk: chunkData, namespace });
    } catch (error) {
        console.error('Error fetching chunk:', error.message);
        res.status(500).json({ error: 'Failed to fetch chunk', details: error.message });
    }
}