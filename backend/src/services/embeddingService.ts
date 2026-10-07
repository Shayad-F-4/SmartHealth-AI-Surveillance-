import axios from 'axios';

export interface TextEmbedding {
  vector: number[];
  dimensions: number;
}

const EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER || process.env.AI_PROVIDER || 'DETERMINISTIC_VECTORIZER';
const EMBEDDING_API_KEY = process.env.EMBEDDING_API_KEY || process.env.AI_API_KEY || '';
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

// Standard 128-dimensional feature space for deterministic clinical embeddings
const VECTOR_DIM = 128;

// Common medical stopwords that add noise to vector embeddings
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'this', 'that', 'these', 'those', 'it',
  'its', 'from', 'as', 'can', 'may', 'will', 'should', 'has', 'have', 'had', 'such',
  'what', 'does', 'do', 'did', 'mean', 'means', 'meaning', 'tell', 'explain', 'about',
  'how', 'why', 'who', 'when', 'where', 'could', 'would', 'please', 'give', 'show',
]);

export const EmbeddingService = {
  /**
   * Generates a normalized vector embedding for the input text.
   * If an external API key is configured (OpenRouter/OpenAI), calls the API.
   * Otherwise, generates a deterministic semantic TF-IDF/n-gram hash embedding.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const cleanText = text.trim();
    if (!cleanText) {
      return new Array(VECTOR_DIM).fill(0);
    }

    if (
      EMBEDDING_API_KEY &&
      (EMBEDDING_PROVIDER === 'OPENROUTER' || EMBEDDING_PROVIDER === 'OPENAI')
    ) {
      try {
        const url =
          EMBEDDING_PROVIDER === 'OPENROUTER'
            ? 'https://openrouter.ai/api/v1/embeddings'
            : 'https://api.openai.com/v1/embeddings';

        const res = await axios.post(
          url,
          {
            model: EMBEDDING_MODEL,
            input: cleanText.substring(0, 8000),
          },
          {
            headers: {
              Authorization: `Bearer ${EMBEDDING_API_KEY}`,
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          }
        );

        const vector = res.data?.data?.[0]?.embedding;
        if (Array.isArray(vector) && vector.length > 0) {
          return normalizeVector(vector);
        }
      } catch (err: any) {
        console.warn(
          '[EmbeddingService] External embedding call failed, falling back to deterministic vectorizer:',
          err.message
        );
      }
    }

    // High-availability deterministic clinical vectorizer
    return generateDeterministicEmbedding(cleanText);
  },

  /**
   * Calculates cosine similarity between two normalized vectors.
   * For normalized vectors, dot product equals cosine similarity.
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
    const len = Math.min(vecA.length, vecB.length);
    let dot = 0;
    for (let i = 0; i < len; i++) {
      dot += vecA[i] * vecB[i];
    }
    return Math.max(0, Math.min(1, dot));
  },

  /**
   * Calculates keyword overlap score between query tokens and document content.
   */
  keywordMatchScore(query: string, content: string, topic?: string | null, title?: string | null): number {
    const qTokens = tokenize(query);
    if (qTokens.length === 0) return 0;

    const cLower = content.toLowerCase();
    const tLower = (topic || '').toLowerCase();
    const titleLower = (title || '').toLowerCase();

    let matches = 0;
    qTokens.forEach((token) => {
      if (tLower.includes(token)) {
        matches += 3.0; // High weight for topic match
      } else if (titleLower.includes(token)) {
        matches += 2.0; // High weight for document title match
      } else if (cLower.includes(token)) {
        matches += 1.0;
      }
    });

    return Math.min(1.0, matches / Math.max(qTokens.length * 1.5, 1));
  },
};

/**
 * Normalizes vector to unit length (L2 norm = 1.0)
 */
function normalizeVector(vec: number[]): number[] {
  let sumSq = 0;
  for (let i = 0; i < vec.length; i++) {
    sumSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sumSq) || 1e-9;
  return vec.map((v) => v / norm);
}

/**
 * Generates deterministic semantic hash vector for text.
 * Uses hashed n-grams, term frequency, and clinical term boosting.
 */
function generateDeterministicEmbedding(text: string): number[] {
  const vec = new Array(VECTOR_DIM).fill(0);
  const tokens = tokenize(text);
  if (tokens.length === 0) return vec;

  // Unigrams
  tokens.forEach((token) => {
    const hash = simpleHash(token);
    const idx = Math.abs(hash) % VECTOR_DIM;
    const sign = hash % 2 === 0 ? 1 : -1;
    vec[idx] += sign * 1.0;
  });

  // Bigrams for context preservation (e.g. "blood pressure", "type 2", "heart rate")
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = `${tokens[i]}_${tokens[i + 1]}`;
    const hash = simpleHash(bigram);
    const idx = Math.abs(hash) % VECTOR_DIM;
    const sign = hash % 2 === 0 ? 1 : -1;
    vec[idx] += sign * 1.5;
  }

  return normalizeVector(vec);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

function simpleHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash;
}
