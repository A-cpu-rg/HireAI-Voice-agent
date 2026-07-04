import { describe, it, expect } from "vitest";
import { computeRanking, skillMatch } from "./ranking";

describe("skillMatch", () => {
  it("scores the fraction of required skills present", () => {
    expect(skillMatch(["React", "Node.js"], ["react", "node.js", "sql", "aws"])).toBe(50);
  });

  it("is case-insensitive", () => {
    expect(skillMatch(["REACT"], ["react"])).toBe(100);
  });

  it("falls back to breadth when there is no job requirement", () => {
    expect(skillMatch(["a", "b", "c", "d", "e"], [])).toBe(50);
  });
});

describe("computeRanking", () => {
  it("redistributes weight across available dimensions when data is missing", () => {
    const result = computeRanking({
      resumeSkills: ["React", "SQL"],
      jobSkills: ["React", "SQL"],
      experience: 4,
      screening: null,
      resumeConfidence: null,
    });
    // No interview/education/confidence signals → those are null.
    expect(result.technicalMatch).toBeNull();
    expect(result.communication).toBeNull();
    expect(result.skillMatch).toBe(100);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes interview scores when present", () => {
    const result = computeRanking({
      resumeSkills: ["React"],
      jobSkills: ["React", "SQL"],
      experience: 6,
      requiredExperience: 5,
      screening: { technicalScore: 80, communicationScore: 70 },
      resumeConfidence: 90,
    });
    expect(result.technicalMatch).toBe(80);
    expect(result.communication).toBe(70);
    expect(result.experienceMatch).toBe(100);
    expect(result.confidence).toBe(90);
  });
});
