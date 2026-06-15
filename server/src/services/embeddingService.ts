import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';

const EMBED_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`;
const BATCH_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:batchEmbedContents?key=${GEMINI_API_KEY}`;

// Gemini batchEmbedContents caps requests per call; keep well under to be safe
const MAX_BATCH_SIZE = 90;

/**
 * Generates a single embedding vector for a piece of text using Gemini.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing Gemini API Key. Please configure process.env.GEMINI_API_KEY.');
  }

  const cleaned = (text || '').trim();
  if (!cleaned) {
    throw new Error('Cannot generate an embedding for empty text.');
  }

  let attempts = 0;
  const maxAttempts = 4;
  let delay = 2000;

  while (attempts < maxAttempts) {
    try {
      attempts++;
      const response = await fetch(EMBED_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `models/${EMBEDDING_MODEL}`,
          content: { parts: [{ text: cleaned }] }
        })
      });

      if (response.status === 429) {
        console.warn(`Embedding API returned 429 (attempt ${attempts}/${maxAttempts}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2.5;
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Embedding API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const resData = await response.json();
      const values: number[] | undefined = resData?.embedding?.values;

      if (!Array.isArray(values) || values.length === 0) {
        throw new Error('Embedding API returned an empty vector.');
      }

      return values;
    } catch (err: any) {
      console.error(`Attempt ${attempts} failed in generateEmbedding:`, err.message);
      if (attempts >= maxAttempts) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2.5;
    }
  }
  throw new Error('Embedding generation failed after multiple retries due to rate limits.');
}

/**
 * Generates embeddings for many texts. Splits into batches to respect API limits.
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing Gemini API Key. Please configure process.env.GEMINI_API_KEY.');
  }

  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  const results: number[][] = [];

  for (let start = 0; start < texts.length; start += MAX_BATCH_SIZE) {
    const slice = texts.slice(start, start + MAX_BATCH_SIZE);
    const batchVectors = await embedBatchSlice(slice);
    results.push(...batchVectors);
  }

  return results;
}

/**
 * Sends a single batch slice to the batchEmbedContents endpoint with retry/backoff.
 */
async function embedBatchSlice(slice: string[]): Promise<number[][]> {
  let attempts = 0;
  const maxAttempts = 4;
  let delay = 2000;

  const requests = slice.map(text => ({
    model: `models/${EMBEDDING_MODEL}`,
    content: { parts: [{ text: (text || '').trim() || ' ' }] }
  }));

  while (attempts < maxAttempts) {
    try {
      attempts++;
      const response = await fetch(BATCH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests })
      });

      if (response.status === 429) {
        console.warn(`Batch embedding API returned 429 (attempt ${attempts}/${maxAttempts}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2.5;
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Batch embedding API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const resData = await response.json();
      const embeddings: { values: number[] }[] | undefined = resData?.embeddings;

      if (!Array.isArray(embeddings) || embeddings.length !== slice.length) {
        throw new Error(`Batch embedding returned ${embeddings?.length ?? 0} vectors for ${slice.length} inputs.`);
      }

      return embeddings.map(e => e.values);
    } catch (err: any) {
      console.error(`Attempt ${attempts} failed in embedBatchSlice:`, err.message);
      if (attempts >= maxAttempts) {
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2.5;
    }
  }
  throw new Error('Batch embedding generation failed after multiple retries due to rate limits.');
}

/**
 * Computes cosine similarity between two equal-length vectors. Returns 0 for degenerate inputs.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  if (magA === 0 || magB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}
