const { Pinecone } = require('@pinecone-database/pinecone');

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { ticker, section, source, namespace = 'default', topK = 100 } = req.body;

        // Ensure at least one filter criterion is provided
        if (!ticker && !section && !source) {
            return res.status(400).json({ error: 'At least one filter criterion (ticker, section, or source) is required' });
        }

        console.log(`Searching chunks with ticker: ${ticker}, section: ${section}, source: ${source}, namespace: ${namespace}, topK: ${topK}`);

        const index = pinecone.Index('sec-filings');
        await index.describeIndexStats(); // Test connection

        // Build the metadata filter
        const filter = {};
        if (ticker) filter.ticker = ticker;
        if (section) filter.section = section;
        if (source) filter.source = source;

        // Use a dummy vector for querying (Pinecone requires a vector for metadata-only queries)
        const dummyVector = new Array(768).fill(0); // Matches dimension of text-embedding-004

        const queryResponse = await index.namespace(namespace).query({
            topK: Math.min(topK, 100),
            vector: dummyVector,
            includeMetadata: true,
            includeValues: false, // We only need metadata
            filter: filter
        });

        const chunks = queryResponse.matches.map(match => ({
            id: match.id,
            ticker: match.metadata?.ticker || 'N/A',
            section: match.metadata?.section || 'N/A',
            source: match.metadata?.source || 'N/A',
            tokens: match.metadata?.tokens || 0,
            text: match.metadata?.text || 'N/A'
        }));

        res.status(200).json({ chunks, namespace, total: chunks.length });
    } catch (error) {
        console.error('Error searching chunks:', error.message);
        res.status(500).json({ error: 'Failed to search chunks', details: error.message });
    }
}