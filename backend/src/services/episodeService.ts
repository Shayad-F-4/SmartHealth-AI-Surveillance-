import prisma from '../config/prisma';

export interface EpisodeClassificationResult {
  episodeId: string;
  episodeCode: string;
  suggestedClassification: 'NEW_CONDITION' | 'FOLLOW_UP' | 'IMPROVING' | 'WORSENING' | 'RESOLVED' | 'RELATED_CONDITION';
  confidenceReason: string;
  isNewEpisode: boolean;
}

const SEVERITY_RANK: Record<string, number> = {
  MILD: 1,
  MODERATE: 2,
  SEVERE: 3,
  CRITICAL: 4,
};

export async function processVisitEpisode(
  patientId: string,
  disease: string,
  currentSeverity: string,
  explicitEpisodeId?: string,
  explicitClassification?: string
): Promise<EpisodeClassificationResult> {
  const normalizedDisease = disease.trim();
  const currentRank = SEVERITY_RANK[currentSeverity.toUpperCase()] || 2;

  // 1. If doctor explicitly chose an existing episode
  if (explicitEpisodeId) {
    const existing = await prisma.diseaseEpisode.findUnique({
      where: { id: explicitEpisodeId },
      include: { visits: { orderBy: { visitDate: 'desc' }, take: 1 } },
    });

    if (existing) {
      let suggested: any = explicitClassification || 'FOLLOW_UP';
      let reason = 'Explicitly linked to existing active episode.';

      if (!explicitClassification && existing.visits.length > 0) {
        const lastVisit = existing.visits[0];
        const lastRank = SEVERITY_RANK[lastVisit.severity.toUpperCase()] || 2;
        if (currentRank < lastRank) {
          suggested = 'IMPROVING';
          reason = `Severity decreased from ${lastVisit.severity} to ${currentSeverity}.`;
        } else if (currentRank > lastRank) {
          suggested = 'WORSENING';
          reason = `Severity escalated from ${lastVisit.severity} to ${currentSeverity}.`;
        } else {
          suggested = 'FOLLOW_UP';
          reason = 'Same severity level observed; follow-up encounter.';
        }
      }

      return {
        episodeId: existing.id,
        episodeCode: existing.episodeCode,
        suggestedClassification: suggested,
        confidenceReason: reason,
        isNewEpisode: false,
      };
    }
  }

  // 2. Search for open/active episode for this patient & disease
  const activeEpisode = await prisma.diseaseEpisode.findFirst({
    where: {
      patientId,
      disease: { equals: normalizedDisease, mode: 'insensitive' },
      status: 'ACTIVE',
    },
    include: {
      visits: { orderBy: { visitDate: 'desc' }, take: 1 },
    },
    orderBy: { startDate: 'desc' },
  });

  if (activeEpisode) {
    let suggested: any = explicitClassification || 'FOLLOW_UP';
    let reason = `Patient has active episode ${activeEpisode.episodeCode} recorded for ${normalizedDisease}.`;

    if (!explicitClassification && activeEpisode.visits.length > 0) {
      const lastVisit = activeEpisode.visits[0];
      const lastRank = SEVERITY_RANK[lastVisit.severity.toUpperCase()] || 2;

      if (currentRank < lastRank) {
        suggested = 'IMPROVING';
        reason = `Condition improving: previous severity was ${lastVisit.severity}, current is ${currentSeverity}.`;
      } else if (currentRank > lastRank) {
        suggested = 'WORSENING';
        reason = `Condition worsening: previous severity was ${lastVisit.severity}, current is ${currentSeverity}.`;
      } else {
        suggested = 'FOLLOW_UP';
        reason = `Routine follow-up for active condition (${currentSeverity}).`;
      }
    }

    return {
      episodeId: activeEpisode.id,
      episodeCode: activeEpisode.episodeCode,
      suggestedClassification: suggested,
      confidenceReason: reason,
      isNewEpisode: false,
    };
  }

  // 3. Create new Disease Episode
  const prefix = normalizedDisease.substring(0, 3).toUpperCase();
  const episodeCount = await prisma.diseaseEpisode.count({
    where: { patientId },
  });
  const episodeCode = `${prefix}-EP-${String(episodeCount + 1).padStart(3, '0')}`;

  const newEpisode = await prisma.diseaseEpisode.create({
    data: {
      patientId,
      disease: normalizedDisease,
      episodeCode,
      status: 'ACTIVE',
      severity: currentSeverity,
      startDate: new Date(),
    },
  });

  return {
    episodeId: newEpisode.id,
    episodeCode: newEpisode.episodeCode,
    suggestedClassification: (explicitClassification as any) || 'NEW_CONDITION',
    confidenceReason: `First recorded encounter for ${normalizedDisease}; initialized episode ${episodeCode}.`,
    isNewEpisode: true,
  };
}
