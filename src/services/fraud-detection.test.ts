import { describe, it, expect } from "vitest";
import { detectFraud, documentSimilarity } from "./fraud-detection";

const CLEAN_RESUME =
  "Ada Lovelace is a backend engineer with 5 years of experience building APIs with Node.js and PostgreSQL. She led migrations and mentored juniors while shipping reliable services.";

describe("documentSimilarity", () => {
  it("returns 1 for identical documents", () => {
    expect(documentSimilarity(CLEAN_RESUME, CLEAN_RESUME)).toBe(1);
  });

  it("returns a low score for unrelated documents", () => {
    expect(documentSimilarity(CLEAN_RESUME, "the quick brown fox jumps")).toBeLessThan(0.2);
  });
});

describe("detectFraud", () => {
  it("passes a clean resume", () => {
    const report = detectFraud({
      resumeText: CLEAN_RESUME,
      email: "ada@example.com",
      experience: 5,
    });
    expect(report.risk).toBe("low");
    expect(report.flags).toHaveLength(0);
  });

  it("flags a disposable email", () => {
    const report = detectFraud({
      resumeText: CLEAN_RESUME,
      email: "ada@mailinator.com",
      experience: 5,
    });
    expect(report.flags.map((f) => f.code)).toContain("disposable_email");
  });

  it("flags implausible experience", () => {
    const report = detectFraud({
      resumeText: CLEAN_RESUME,
      email: "ada@example.com",
      experience: 80,
    });
    expect(report.flags.map((f) => f.code)).toContain("implausible_experience");
  });

  it("flags keyword stuffing", () => {
    const stuffed = Array(8).fill("React Python SQL AWS Docker Java Go").join(" ");
    const report = detectFraud({ resumeText: stuffed, email: "a@b.com", experience: 3 });
    expect(report.flags.map((f) => f.code)).toContain("keyword_stuffing");
  });

  it("flags a near-duplicate resume", () => {
    const report = detectFraud({
      resumeText: CLEAN_RESUME,
      email: "a@b.com",
      experience: 5,
      otherResumeTexts: [{ candidateId: "other", text: CLEAN_RESUME }],
    });
    expect(report.flags.map((f) => f.code)).toContain("duplicate_resume");
    expect(report.risk).toBe("high");
  });
});
