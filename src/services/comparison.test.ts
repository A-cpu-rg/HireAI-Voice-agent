import { describe, it, expect } from "vitest";
import { compareCandidates, type ComparisonCandidate } from "./comparison.service";

const candidates: ComparisonCandidate[] = [
  {
    id: "a",
    name: "Ada",
    overallScore: 88,
    skillMatch: 90,
    experience: 6,
    technicalScore: 85,
    communicationScore: 80,
    fraudScore: 0,
  },
  {
    id: "b",
    name: "Bob",
    overallScore: 60,
    skillMatch: 55,
    experience: 2,
    technicalScore: 50,
    communicationScore: 52,
    fraudScore: 30,
  },
];

describe("compareCandidates", () => {
  it("picks the strongest candidate as best fit", () => {
    const result = compareCandidates(candidates);
    expect(result.bestFitId).toBe("a");
    expect(result.recommendation).toContain("Ada");
  });

  it("assigns higher hiring risk to weaker, flagged candidates", () => {
    const result = compareCandidates(candidates);
    const bob = result.candidates.find((c) => c.id === "b")!;
    const ada = result.candidates.find((c) => c.id === "a")!;
    expect(ada.hiringRisk).toBe("low");
    expect(bob.hiringRisk).not.toBe("low");
    expect(bob.cons.length).toBeGreaterThan(0);
    expect(ada.pros.length).toBeGreaterThan(0);
  });

  it("handles an empty input", () => {
    const result = compareCandidates([]);
    expect(result.bestFitId).toBeNull();
  });
});
