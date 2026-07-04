import { describe, it, expect } from "vitest";
import { computeSkillMatch, parseResume } from "./parsing.service";

describe("computeSkillMatch", () => {
  it("scores the fraction of required skills owned", () => {
    expect(computeSkillMatch(["React", "SQL"], ["React", "SQL", "AWS", "Go"])).toBe(50);
  });

  it("returns 0 when none of the required skills are present", () => {
    expect(computeSkillMatch(["PHP"], ["React", "SQL"])).toBe(0);
  });
});

describe("parseResume (heuristic path, no Gemini key in tests)", () => {
  const resume = `Grace Hopper
grace@example.com
+1 555 123 4567

Senior Engineer with 8 years of experience.
Skills: React, Node.js, PostgreSQL, AWS, Docker`;

  it("extracts core contact fields deterministically", async () => {
    const result = await parseResume({ text: resume, jobSkills: ["React", "AWS", "Kubernetes"] });
    expect(result.source).toBe("heuristic");
    expect(result.email).toBe("grace@example.com");
    expect(result.experience).toBe(8);
    expect(result.skills).toContain("React");
    // 2 of 3 required skills (React, AWS) present.
    expect(result.matchScore).toBe(67);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("computes a match score of 0 when the resume text is thin", async () => {
    const result = await parseResume({ text: "n/a n/a n/a n/a", jobSkills: ["React"] });
    expect(result.matchScore).toBe(0);
  });
});
