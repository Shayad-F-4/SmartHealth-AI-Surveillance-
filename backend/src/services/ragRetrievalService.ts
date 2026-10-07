import prisma from '../config/prisma';
import { EmbeddingService } from './embeddingService';
import { KnowledgeIngestionService } from './knowledgeIngestionService';

export interface RetrievedKnowledgeChunk {
  chunkId: string;
  documentId: string;
  title: string;
  source: string;
  section: string;
  topic: string;
  sourceUrl?: string;
  content: string;
  relevanceScore: number;
}

export const RagRetrievalService = {
  /**
   * Retrieves top-K semantically and keyword-relevant medical knowledge chunks for a query.
   * Considers only TRUSTED active documents.
   */
  async retrieveRelevantKnowledge(
    query: string,
    options: { topK?: number; minScore?: number } = {}
  ): Promise<RetrievedKnowledgeChunk[]> {
    const topK = options.topK || 3;
    const minScore = options.minScore || 0.20;

    // Ensure initial knowledge corpus is available
    await KnowledgeIngestionService.ensureCorpusSeeded();

    const queryEmbedding = await EmbeddingService.generateEmbedding(query);

    // Retrieve all chunks from TRUSTED documents
    const chunks = await prisma.knowledgeChunk.findMany({
      where: {
        document: {
          status: 'TRUSTED',
        },
      },
      include: {
        document: true,
      },
    });

    if (chunks.length === 0) {
      return [];
    }

    const scoredChunks: RetrievedKnowledgeChunk[] = [];

    for (const chunk of chunks) {
      let similarity = 0;
      if (chunk.embedding) {
        try {
          const vec: number[] = JSON.parse(chunk.embedding);
          similarity = EmbeddingService.cosineSimilarity(queryEmbedding, vec);
        } catch (e) {
          similarity = 0;
        }
      }

      const keywordScore = EmbeddingService.keywordMatchScore(
        query,
        chunk.content,
        chunk.topic,
        chunk.document.title
      );

      // Hybrid score: semantic embedding + keyword term frequency
      const hybridScore = parseFloat((similarity * 0.5 + keywordScore * 0.5).toFixed(3));

      if (hybridScore >= minScore) {
        scoredChunks.push({
          chunkId: chunk.id,
          documentId: chunk.documentId,
          title: chunk.document.title,
          source: chunk.document.source,
          section: chunk.section || 'General',
          topic: chunk.topic || chunk.document.title,
          sourceUrl: chunk.document.sourceUrl || undefined,
          content: chunk.content,
          relevanceScore: hybridScore,
        });
      }
    }

    // Sort descending by score
    scoredChunks.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Return top-K most relevant chunks
    return scoredChunks.slice(0, topK);
  },
};
