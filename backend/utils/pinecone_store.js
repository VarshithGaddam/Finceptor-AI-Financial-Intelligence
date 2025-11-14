const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { batchArray } = require('./batch_utils');

// Initialize clients
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const EMBEDDING_MODEL_NAME = 'text-embedding-004';
const EMBEDDING_BATCH_SIZE = 10;
const UPSERT_BATCH_SIZE = 100;
const DEFAULT_NAMESPACE = 'var';

/**
 * Store chunks into Pinecone with embeddings
 * @param {Array} chunks - Array of { text, id, ticker, ... }
 * @returns {Object} - { upsertedCount, skippedCount }
 */
async function storeEmbeddings(chunks) {
  if (!Array.isArray(chunks) || chunks.length === 0) {
    throw new Error('Chunks must be a non-empty array');
  }

  const index = pinecone.Index('sec-filings');
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL_NAME });

  const vectors = [];
  let skippedChunks = 0;

  const chunkBatches = batchArray(chunks, EMBEDDING_BATCH_SIZE);

  for (let batchIndex = 0; batchIndex < chunkBatches.length; batchIndex++) {
    const batch = chunkBatches[batchIndex];
    console.log(`🧠 Embedding batch ${batchIndex + 1}/${chunkBatches.length}`);

    const validChunks = batch.filter(chunk =>
      typeof chunk.text === 'string' && chunk.text.trim().length > 0
    );

    if (validChunks.length === 0) {
      console.warn('⚠️ No valid texts found in this batch. Skipping...');
      skippedChunks += batch.length;
      continue;
    }

    try {
      const embeddingResponses = await Promise.all(
        validChunks.map(chunk => model.embedContent(chunk.text))
      );

      const embeddings = embeddingResponses.map(res => res.embedding.values);

      for (let i = 0; i < validChunks.length; i++) {
        const chunk = validChunks[i];
        // Use the chunk.id directly as the vector ID, since it was already constructed
        const vectorId = chunk.id || `unk_${i}`; // Fallback if chunk.id is missing

        vectors.push({
          id: vectorId,
          values: embeddings[i],
          metadata: {
            ticker: chunk.ticker || 'N/A',
            year: chunk.year || '0000',
            section: chunk.section || 'general',
            source: chunk.source || 'manual',
            doc_type: chunk.doc_type || 'unknown',
            version: chunk.version || '1',
            tokens: chunk.tokens || 0,
            text: chunk.text,
          },
          namespace: DEFAULT_NAMESPACE,
        });
      }
    } catch (err) {
      console.error(`❌ Failed embedding batch ${batchIndex + 1}:`, err.message);
      skippedChunks += validChunks.length;
    }
  }

  if (vectors.length === 0) {
    throw new Error('No valid vectors to upsert: all chunks were skipped or failed');
  }

  // Group vectors by namespace
  const vectorsByNamespace = vectors.reduce((acc, vec) => {
    const ns = vec.namespace;
    delete vec.namespace;
    acc[ns] = acc[ns] || [];
    acc[ns].push(vec);
    return acc;
  }, {});

  let totalUpserted = 0;

  for (const namespace in vectorsByNamespace) {
    const nsVectors = vectorsByNamespace[namespace];
    const batches = batchArray(nsVectors, UPSERT_BATCH_SIZE);

    console.log(`📤 Upserting to namespace: ${namespace}`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`🚀 Upserting batch ${i + 1}/${batches.length} (${batch.length} vectors)`);
      await index.namespace(namespace).upsert(batch);
      totalUpserted += batch.length;
    }
  }

  console.log(`✅ Upsert complete: ${totalUpserted} vectors inserted, ${skippedChunks} chunks skipped`);

  return {
    upsertedCount: totalUpserted,
    skippedCount: skippedChunks,
  };
}

module.exports = {
  storeEmbeddings,
};