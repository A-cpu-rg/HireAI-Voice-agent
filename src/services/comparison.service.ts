export interface ComparisonCandidate {
  id: string;
  name: string;
  overallScore: number;
  skillMatch: number;
  experience: number;
  technicalScore?: number | null;
  communicationScore?: number | null;
  fraudScore?: number | null;
}

export interface ComparedCandidate {
  id: string;
  name: string;
  overallScore: number;
  pros: string[];
  cons: string[];
  hiringRisk: "low" | "medium" | "high";
}

export interface ComparisonResult {
  candidates: ComparedCandidate[];
  bestFitId: string | null;
  recommendation: string;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Compare candidates on shared dimensions and surface relative pros/cons, a
 * hiring-risk band, and a best-fit pick. Purely a function of the metrics passed
 * in — no AI guesswork — so results are explainable and reproducible.
 */
export function compareCandidates(input: ComparisonCandidate[]): ComparisonResult {
  if (input.length === 0) {
    return { candidates: [], bestFitId: null, recommendation: "No candidates to compare." };
  }

  const avgOverall = average(input.map((c) => c.overallScore));
  const avgSkill = average(input.map((c) => c.skillMatch));
  const avgExp = average(input.map((c) => c.experience));

  const candidates: ComparedCandidate[] = input.map((c) => {
    const pros: string[] = [];
    const cons: string[] = [];

    if (c.skillMatch >= avgSkill && c.skillMatch >= 60) pros.push("Strong skill match");
    else if (c.skillMatch < avgSkill) cons.push("Below-average skill match");

    if (c.experience >= avgExp && c.experience > 0)
      pros.push(`Solid experience (${c.experience}y)`);
    else if (c.experience < avgExp) cons.push("Less experience than peers");

    if (typeof c.technicalScore === "number") {
      if (c.technicalScore >= 75) pros.push("High technical interview score");
      else if (c.technicalScore < 55) cons.push("Weak technical interview");
    }
    if (typeof c.communicationScore === "number") {
      if (c.communicationScore >= 75) pros.push("Excellent communication");
      else if (c.communicationScore < 55) cons.push("Communication needs work");
    }

    const fraud = c.fraudScore ?? 0;
    const hiringRisk: ComparedCandidate["hiringRisk"] =
      fraud >= 60 || c.overallScore < 45
        ? "high"
        : fraud >= 25 || c.overallScore < 65
          ? "medium"
          : "low";
    if (fraud >= 25) cons.push("Integrity flags detected");

    return { id: c.id, name: c.name, overallScore: c.overallScore, pros, cons, hiringRisk };
  });

  // Best fit: highest overall, breaking ties toward lower fraud then more experience.
  const bestFit = [...input].sort((a, b) => {
    if (b.overallScore !== a.overallScore) return b.overallScore - a.overallScore;
    const fraudA = a.fraudScore ?? 0;
    const fraudB = b.fraudScore ?? 0;
    if (fraudA !== fraudB) return fraudA - fraudB;
    return b.experience - a.experience;
  })[0];

  const best = candidates.find((c) => c.id === bestFit.id)!;
  const recommendation =
    input.length === 1
      ? `${best.name} scores ${best.overallScore}/100 with ${best.hiringRisk} hiring risk.`
      : `${best.name} is the strongest fit (${best.overallScore}/100, ${best.hiringRisk} risk) versus an average of ${Math.round(avgOverall)}/100 across ${input.length} candidates.`;

  return { candidates, bestFitId: bestFit.id, recommendation };
}
