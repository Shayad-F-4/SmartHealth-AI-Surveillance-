import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { ClinicalDecisionSupportService } from '../services/clinicalDecisionSupportService';
import { logAudit } from '../middleware/audit';

export async function getDoctorCDS(req: AuthRequest, res: Response) {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({ error: 'patientId parameter is required.' });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, healthId: true },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient record not found.' });
    }

    const cdsOutput = await ClinicalDecisionSupportService.generateCDS(patient.id, true);

    await logAudit(
      req,
      'VIEW_CLINICAL_DECISION_SUPPORT',
      'PATIENT',
      patient.id,
      `Doctor accessed Clinical Decision Support & Care Pathway for patient ${patient.healthId} (Severity: ${cdsOutput.overallSeverity})`
    );

    return res.json(cdsOutput);
  } catch (err: any) {
    console.error('[CDS Controller] Doctor CDS error:', err);
    return res.status(500).json({ error: 'Failed to generate clinical decision support.', details: err.message });
  }
}

export async function getPatientCDS(req: AuthRequest, res: Response) {
  try {
    let patientId: string | undefined = req.params.id;

    if (!patientId && req.user?.role === 'PATIENT') {
      const p = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      patientId = p?.id;
    }

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required.' });
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, healthId: true },
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient record not found.' });
    }

    // Generate educational patient-friendly view
    const cdsOutput = await ClinicalDecisionSupportService.generateCDS(patient.id, false);

    await logAudit(
      req,
      'VIEW_PATIENT_CDS',
      'PATIENT',
      patient.id,
      `Patient viewed personal care pathway educational overview for ${patient.healthId}`
    );

    return res.json(cdsOutput);
  } catch (err: any) {
    console.error('[CDS Controller] Patient CDS error:', err);
    return res.status(500).json({ error: 'Failed to generate patient care overview.', details: err.message });
  }
}

export async function recordReviewStatus(req: AuthRequest, res: Response) {
  try {
    const { patientId } = req.params;
    const { reviewStatus, clinicianNotes } = req.body;

    if (!['REVIEWED', 'ACTIONED', 'DISMISSED', 'PENDING'].includes(reviewStatus)) {
      return res.status(400).json({ error: 'reviewStatus must be one of: REVIEWED, ACTIONED, DISMISSED, PENDING' });
    }

    await logAudit(
      req,
      'REVIEW_CLINICAL_DECISION_SUPPORT',
      'PATIENT',
      patientId,
      `Clinician updated CDS review status to ${reviewStatus}. Notes: ${clinicianNotes || 'None'}`
    );

    return res.json({
      message: 'Clinical decision support review recorded successfully.',
      patientId,
      reviewStatus,
      reviewedAt: new Date().toISOString(),
      reviewedBy: req.user?.name || 'Attending Physician',
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to record review status.', details: err.message });
  }
}
