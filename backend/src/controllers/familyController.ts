import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { getPatientFamilyTree } from '../services/familyTreeService';
import { logAudit } from '../middleware/audit';

export async function getFamilyTree(req: AuthRequest, res: Response) {
  try {
    let patientId: string | undefined = req.params.patientId;
    if (!patientId && req.user?.role === 'PATIENT') {
      const p = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      patientId = p?.id;
    }

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required.' });
    }

    const treeData = await getPatientFamilyTree(patientId);
    return res.json(treeData);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to retrieve family tree.', details: err.message });
  }
}

export async function addFamilyMember(req: AuthRequest, res: Response) {
  try {
    let patientId = req.body.patientId;
    if (!patientId && req.user?.role === 'PATIENT') {
      const p = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      patientId = p?.id;
    }

    if (!patientId) {
      return res.status(400).json({ error: 'Patient ID is required.' });
    }

    const { relation, name, age, condition, ageAtDiagnosis, notes } = req.body;

    if (!relation || !name) {
      return res.status(400).json({ error: 'Relationship and Name are required.' });
    }

    const member = await prisma.familyMember.create({
      data: {
        patientId,
        relation,
        name,
        age: age ? parseInt(age) : null,
        condition: condition || 'None',
        ageAtDiagnosis: ageAtDiagnosis ? parseInt(ageAtDiagnosis) : null,
        notes,
      },
    });

    await logAudit(req, 'ADD_FAMILY_MEMBER', 'FAMILY_MEMBER', member.id, `Added ${relation} (${name}) with condition: ${condition || 'None'}`);

    // Return updated tree
    const tree = await getPatientFamilyTree(patientId);
    return res.status(201).json({ member, tree });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to add family member.' });
  }
}

export async function deleteFamilyMember(req: AuthRequest, res: Response) {
  try {
    const memberId = req.params.id;
    const member = await prisma.familyMember.findUnique({ where: { id: memberId } });
    if (!member) {
      return res.status(404).json({ error: 'Family member not found.' });
    }

    await prisma.familyMember.delete({ where: { id: memberId } });
    await logAudit(req, 'DELETE_FAMILY_MEMBER', 'FAMILY_MEMBER', memberId, 'Removed family member record');

    return res.json({ message: 'Family member removed successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete family member.' });
  }
}
