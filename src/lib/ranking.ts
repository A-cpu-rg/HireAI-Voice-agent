import { clamp, round } from "./text-metrics";

export interface RankingInput {
  resumeSkills: string[];
  jobSkills: string[];
  experience: number;
  requiredExperience?: number;
  screening?: {
    technicalScore: number;
    communicationScore: number;
  } | null;
  resumeConfidence?: number | null;
  /** 0–100 education signal if known (e.g. from parsing). */
  education?: number | null;
}

export interface RankingBreakdown {
  overallScore: number;
  skillMatch: number;
  technicalMatch: number | null;
  experienceMatch: number;
  communication: number | null;
  education: number | null;
  confidence: number | null;
}

const WEIGHTS = {
  skillMatch: 0.25,
  technicalMatch: 0.2,
  experienceMatch: 0.2,
  communication: 0.2,
  education: 0.1,
  confidence: 0.05,
} as const;

export function skillMatch(resumeSkills: string[], jobSkills: string[]): number {
  if (jobSkills.length === 0) return clamp(round((resumeSkills.length / 10) * 100));
  const owned = new Set(resumeSkills.map((s) => s.toLowerCase()));
  const matched = jobSkills.filter((s) => owned.has(s.toLowerCase())).length;
  return round((matched / jobSkills.length) * 100);
}

function experienceMatch(experience: number, required?: number): number {
  if (!required || required <= 0) {
    // No requirement: reward experience up to ~8 years.
    return clamp(round((Math.min(experience, 8) / 8) * 100));
  }
  // Meeting the requirement scores 100; under-experience scales down.
  return clamp(round((Math.min(experience, required) / required) * 100));
}

/**
 * Combine the available signals into a weighted overall score. Dimensions with
 * no data (e.g. no interview yet) are excluded and their weight is redistributed
 * across the dimensions that do have data — the score never assumes a value it
 * cannot support.
 */
export function computeRanking(input: RankingInput): RankingBreakdown {
  const dims = {
    skillMatch: skillMatch(input.resumeSkills, input.jobSkills),
    technicalMatch: input.screening ? clamp(input.screening.technicalScore) : null,
    experienceMatch: experienceMatch(input.experience, input.requiredExperience),
    communication: input.screening ? clamp(input.screening.communicationScore) : null,
    education: input.education ?? null,
    confidence: input.resumeConfidence ?? null,
  };

  let weightedSum = 0;
  let weightTotal = 0;
  for (const [key, value] of Object.entries(dims) as [keyof typeof dims, number | null][]) {
    if (value === null) continue;
    const weight = WEIGHTS[key];
    weightedSum += value * weight;
    weightTotal += weight;
  }

  const overallScore = weightTotal === 0 ? 0 : round(weightedSum / weightTotal);

  return { overallScore, ...dims };
}
