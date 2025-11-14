import { storeEmbeddings } from '../../utils/pinecone_store';
import express from 'express';

const router = express.Router();

router.use(express.json({ limit: '10mb' }));

// Helper function to extract year and doc_type from source string like "ALX_10-K_2023"
function parseSource(source) {
  if (typeof source !== 'string') return { year: '0000', doc_type: 'unknown' };

  // Extract year: find 4-digit number at the end
  const yearMatch = source.match(/(\d{4})(?!.*\d{4})/); // last 4-digit number
  const year = yearMatch ? yearMatch[1] : '0000';

  // Extract doc_type: string between ticker and year
  // e.g. ALX_10-K_2023 -> '10-K'
  // remove ticker prefix (assumed all uppercase letters + underscore)
  // Then remove _year at end
  const withoutYear = source.replace(`_${year}`, '');
  const docTypeMatch = withoutYear.match(/^[A-Z]+_(.+)$/);
  const doc_type = docTypeMatch ? docTypeMatch[1] : 'unknown';

  return { year, doc_type };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const { chunks, metadata } = req.body;

    if (!chunks || !Array.isArray(chunks)) {
      return res.status(400).json({ error: 'Missing or invalid "chunks" in request body.' });
    }

    if (!metadata || typeof metadata !== 'object') {
      return res.status(400).json({ error: 'Missing or invalid "metadata" in request body.' });
    }

    console.log(`Received ${chunks.length} chunks with metadata:`, metadata);

    // Parse year and doc_type from source string in metadata or chunk
    const sourceStr = metadata.source || (chunks.length > 0 && chunks[0].source) || '';
    const { year: extractedYear, doc_type: extractedDocType } = parseSource(sourceStr);

    const version = metadata.version || '1';

    const enrichedChunks = chunks.map((chunk, idx) => {
      const ticker = chunk.ticker || metadata.ticker || 'unknown';

      // Use extracted year and doc_type or fallback to metadata or chunk values
      const year = chunk.year || metadata.year || extractedYear || '0000';
      const doc_type = chunk.doc_type || metadata.doc_type || extractedDocType || 'unknown';

      const section = chunk.section || metadata.section || 'general';

      // Parse chunk_id as number if possible, else fallback to index
      let chunk_id_num = idx;
      if (chunk.chunk_id !== undefined) {
        if (typeof chunk.chunk_id === 'number') {
          chunk_id_num = chunk.chunk_id;
        } else if (typeof chunk.chunk_id === 'string') {
          // Extract the numeric part from chunk_id (e.g., "chunk235" or "ALX_2018_10-K_item_15_chunk235_v1")
          const numericMatch = chunk.chunk_id.match(/\d+/); // Find the first sequence of digits
          chunk_id_num = numericMatch ? parseInt(numericMatch[0], 10) : idx;
        }
        // If chunk.chunk_id is not a string or number, or no numeric part is found, fallback to idx
      }

      // Construct base ID without version suffix
      const baseId = `${ticker}_${year}_${doc_type}_${section}_chunk${chunk_id_num}`;

      // Ensure only one version suffix by removing any existing _vX suffix
      const cleanId = baseId.replace(/_v\d+$/, '');

      // Append the version suffix exactly once
      const id = `${cleanId}_v${version}`;

      return {
        ...chunk,
        ticker,
        year,
        doc_type,
        section,
        source: chunk.source || metadata.source || 'manual',
        version,
        id,
      };
    });

    console.log('Sample enriched chunk:', enrichedChunks[0]);

    const result = await storeEmbeddings(enrichedChunks);

    return res.status(200).json({
      message: `Stored ${result.upsertedCount} embeddings. Skipped ${result.skippedCount} chunks.`,
      upsertedCount: result.upsertedCount,
      skippedCount: result.skippedCount,
    });
  } catch (error) {
    console.error('Error in embedding storage handler:', error);
    return res.status(500).json({
      error: 'Internal server error while storing embeddings.',
      details: error.message,
    });
  }
}