import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { KnowledgeIngestionService } from '../services/knowledgeIngestionService';
import { logAudit } from '../middleware/audit';

export async function getDocuments(req: AuthRequest, res: Response) {
  try {
    await KnowledgeIngestionService.ensureCorpusSeeded();
    const documents = await KnowledgeIngestionService.listDocuments();
    return res.json(documents);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve knowledge documents.', details: err.message });
  }
}

export async function getDocumentById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const document = await KnowledgeIngestionService.getDocument(id);
    if (!document) {
      return res.status(404).json({ error: 'Knowledge document not found.' });
    }
    return res.json(document);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve knowledge document.', details: err.message });
  }
}

export async function createDocument(req: AuthRequest, res: Response) {
  try {
    const { title, source, sourceUrl, category, documentVersion, chunks } = req.body;

    if (!title || !source || !Array.isArray(chunks) || chunks.length === 0) {
      return res.status(400).json({
        error: 'title, source, and a non-empty chunks array are required to ingest a knowledge document.',
      });
    }

    const docId = await KnowledgeIngestionService.ingestDocument({
      title,
      source,
      sourceUrl,
      category,
      documentVersion,
      chunks,
    });

    await logAudit(
      req,
      'CREATE_KNOWLEDGE_DOCUMENT',
      'KNOWLEDGE_DOCUMENT',
      docId,
      `Ingested knowledge document "${title}" from source "${source}" with ${chunks.length} chunks`
    );

    return res.status(201).json({
      message: 'Knowledge document ingested successfully.',
      documentId: docId,
      chunksIngested: chunks.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to ingest knowledge document.', details: err.message });
  }
}

export async function updateDocumentStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['TRUSTED', 'UNVERIFIED', 'DISABLED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be one of: TRUSTED, UNVERIFIED, DISABLED' });
    }

    const updated = await KnowledgeIngestionService.updateDocumentStatus(id, status as any);

    await logAudit(
      req,
      'UPDATE_KNOWLEDGE_DOCUMENT_STATUS',
      'KNOWLEDGE_DOCUMENT',
      id,
      `Updated knowledge document status to ${status}`
    );

    return res.json({ message: 'Document status updated successfully.', document: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update document status.', details: err.message });
  }
}

export async function reindexCorpus(req: AuthRequest, res: Response) {
  try {
    const result = await KnowledgeIngestionService.reindexCorpus();
    await logAudit(
      req,
      'REINDEX_KNOWLEDGE_CORPUS',
      'KNOWLEDGE_CORPUS',
      undefined,
      `Re-indexed ${result.totalReindexed} knowledge chunks`
    );
    return res.json({ message: 'Corpus re-indexed successfully.', ...result });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to re-index knowledge corpus.', details: err.message });
  }
}
