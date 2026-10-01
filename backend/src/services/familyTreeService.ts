import prisma from '../config/prisma';

export interface FamilyPatternAlert {
  diseaseCategory: string;
  affectedCount: number;
  relatives: string[];
  recommendation: string;
  disclaimer: string;
}

export interface FamilyTreeData {
  patient: {
    id: string;
    name: string;
    healthId: string;
    chronicConditions: string;
  };
  members: any[];
  grouped: {
    grandparents: any[];
    parents: any[];
    siblings: any[];
    children: any[];
    others: any[];
  };
  patterns: FamilyPatternAlert[];
}

export async function getPatientFamilyTree(patientId: string): Promise<FamilyTreeData> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { user: { select: { name: true } } },
  });

  if (!patient) {
    throw new Error('Patient not found');
  }

  const members = await prisma.familyMember.findMany({
    where: { patientId },
    orderBy: { createdAt: 'asc' },
  });

  const grouped = {
    grandparents: [] as any[],
    parents: [] as any[],
    siblings: [] as any[],
    children: [] as any[],
    others: [] as any[],
  };

  members.forEach((m) => {
    const rel = m.relation.toLowerCase();
    if (rel.includes('grand')) {
      grouped.grandparents.push(m);
    } else if (rel.includes('father') || rel.includes('mother') || rel.includes('parent')) {
      grouped.parents.push(m);
    } else if (rel.includes('brother') || rel.includes('sister') || rel.includes('sibling')) {
      grouped.siblings.push(m);
    } else if (rel.includes('son') || rel.includes('daughter') || rel.includes('child')) {
      grouped.children.push(m);
    } else {
      grouped.others.push(m);
    }
  });

  // Pattern detection for hereditary conditions
  const patterns: FamilyPatternAlert[] = [];
  const conditionCount: Record<string, { count: number; relatives: string[] }> = {};

  members.forEach((m) => {
    if (!m.condition || m.condition.toLowerCase() === 'none' || m.condition.toLowerCase() === 'healthy') {
      return;
    }
    const condNorm = m.condition.trim();
    if (!conditionCount[condNorm]) {
      conditionCount[condNorm] = { count: 0, relatives: [] };
    }
    conditionCount[condNorm].count += 1;
    conditionCount[condNorm].relatives.push(`${m.relation} (${m.name})`);
  });

  for (const [cond, data] of Object.entries(conditionCount)) {
    if (data.count >= 2) {
      patterns.push({
        diseaseCategory: cond,
        affectedCount: data.count,
        relatives: data.relatives,
        recommendation: `Family history contains a potentially significant hereditary pattern for "${cond}" (${data.relatives.join(', ')}). Consider discussing appropriate preventive screening and lifestyle guidance with your primary healthcare professional.`,
        disclaimer: 'This observation is for risk awareness and screening guidance only; it does not constitute a clinical diagnosis.',
      });
    }
  }

  return {
    patient: {
      id: patient.id,
      name: patient.user.name,
      healthId: patient.healthId,
      chronicConditions: patient.chronicConditions,
    },
    members,
    grouped,
    patterns,
  };
}
