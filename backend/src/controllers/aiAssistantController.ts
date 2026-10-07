import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { PatientContextService, RetrievedPatientContext } from '../services/patientContextService';
import { AIProviderService } from '../services/aiProviderService';
import { RagRetrievalService, RetrievedKnowledgeChunk } from '../services/ragRetrievalService';
import { logAudit } from '../middleware/audit';

export async function askContextualAssistant(req: AuthRequest, res: Response) {
  try {
    const { question, targetPatientId } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Question text is required.' });
    }

    const cleanQuestion = question.trim();

    // 1. Classify intent
    const intent = PatientContextService.detectIntent(cleanQuestion);

    // 2. Resolve patient context when needed (Patient EHR or Hybrid)
    let patientId: string | undefined;
    let context: RetrievedPatientContext | null = null;

    if (req.user?.role === 'PATIENT') {
      const p = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (p) {
        patientId = p.id;
      } else if (intent !== 'GENERAL_MEDICAL') {
        return res.status(404).json({ error: 'Patient profile not found.' });
      }
    } else if (req.user?.role === 'DOCTOR' || req.user?.role === 'ADMIN') {
      if (targetPatientId) {
        const p = await prisma.patient.findUnique({ where: { id: targetPatientId } });
        if (!p) {
          return res.status(404).json({ error: 'Target patient profile not found.' });
        }
        patientId = p.id;
      } else if (intent !== 'GENERAL_MEDICAL') {
        return res.status(400).json({
          error: 'targetPatientId is required for patient-specific queries by healthcare providers.',
        });
      }
    } else {
      return res.status(403).json({ error: 'Unauthorized user role.' });
    }

    // If patient ID resolved and intent warrants EHR context, retrieve it
    if (patientId && intent !== 'GENERAL_MEDICAL') {
      context = await PatientContextService.retrieveContext(patientId, intent);
    }

    // 3. For general medical or hybrid queries, perform RAG retrieval from medical corpus
    let retrievedKnowledge: RetrievedKnowledgeChunk[] = [];
    if (intent === 'GENERAL_MEDICAL' || intent === 'HYBRID_MEDICAL') {
      retrievedKnowledge = await RagRetrievalService.retrieveRelevantKnowledge(cleanQuestion, {
        topK: 3,
        minScore: 0.32,
      });
    }

    // 4. Process with AIProviderService (integrating EHR + RAG + Guardrails)
    const responsePayload = await AIProviderService.processQuestion(
      cleanQuestion,
      intent,
      context,
      retrievedKnowledge
    );

    await logAudit(
      req,
      'ASK_AI_ASSISTANT',
      patientId ? 'PATIENT' : 'SYSTEM',
      patientId,
      `Asked AI assistant intent=${intent}, type=${responsePayload.answerType}, retrieved=${retrievedKnowledge.length} chunks`
    );

    return res.json(responsePayload);
  } catch (err: any) {
    console.error('Contextual AI Assistant error:', err);
    return res.status(500).json({
      error: 'Failed to process AI assistant request.',
      details: err.message,
    });
  }
}
