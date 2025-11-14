const { GoogleGenerativeAI } = require('@google/generative-ai');
const { batchArray } = require('./batch_utils');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateEmbeddings = async (chunks) => {
  if (!Array.isArray(chunks)) {
    throw new Error('Expected chunks to be an array');
  }

  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const embeddings = [];

  const BATCH_SIZE = 5; // Gemini API performs best in small batches
  const chunkBatches = batchArray(chunks, BATCH_SIZE);

  for (let batchIndex = 0; batchIndex < chunkBatches.length; batchIndex++) {
    const batch = chunkBatches[batchIndex];
    console.log(`Embedding batch ${batchIndex + 1}/${chunkBatches.length} with ${batch.length} chunks`);

    const batchEmbeddings = await Promise.all(
      batch.map(async (chunk) => {
        try {
          if (!chunk.text || typeof chunk.text !== 'string' || chunk.text.trim().length === 0) {
            throw new Error(`Invalid or empty text in chunk ${chunk.chunk_id}`);
          }

          const response = await model.embedContent(chunk.text);
          return {
            vector: response.embedding.values,
            metadata: {
              chunk_id: chunk.chunk_id,
              section: chunk.section || 'N/A',
              ticker: chunk.metadata?.ticker || 'unknown',
              source: chunk.source || 'N/A',
              tokens: chunk.tokens || 0,
              text: chunk.text,
            },
          };
        } catch (error) {
          console.error(`Embedding failed for chunk ${chunk.chunk_id}: ${error.message}`);
          return null;
        }
      })
    );

    embeddings.push(...batchEmbeddings.filter(Boolean));
  }

  console.log(`✅ Successfully generated ${embeddings.length} embeddings`);
  return embeddings;
};

// Helper function to generate a single embedding for queries
const get_gemini_embedding = async (text) => {
  try {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Invalid or empty text for embedding');
    }

    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const response = await model.embedContent(text);
    return response.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error.message);
    throw error;
  }
};

module.exports = { generateEmbeddings, get_gemini_embedding };
