import { describe, it, expect } from "vitest";
import { analyzeTranscript, type TranscriptTurn } from "./interview-intelligence";

describe("analyzeTranscript", () => {
  it("reports unavailable when there is too little candidate speech", () => {
    const result = analyzeTranscript([
      { role: "agent", text: "Tell me about yourself." },
      { role: "candidate", text: "Sure." },
    ]);
    expect(result.available).toBe(false);
    expect(result.recommendation).toBeNull();
  });

  it("scores a substantive, fluent answer highly", () => {
    const strong: TranscriptTurn[] = [
      { role: "agent", text: "Walk me through a project you are proud of." },
      {
        role: "candidate",
        text: "I architected a distributed payments system handling thousands of transactions per second. I designed the idempotency layer, introduced circuit breakers, and reduced latency by forty percent through careful caching and query optimisation across the service boundary.",
      },
      {
        role: "candidate",
        text: "We validated correctness with property-based tests and rolled it out gradually behind feature flags, monitoring error budgets throughout the migration.",
      },
    ];
    const result = analyzeTranscript(strong);
    expect(result.available).toBe(true);
    expect(result.communicationScore).toBeGreaterThan(50);
    expect(result.confidenceScore).toBeGreaterThan(60);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.recommendation).not.toBeNull();
  });

  it("penalises heavy filler and hedging", () => {
    const weak: TranscriptTurn[] = [
      { role: "agent", text: "How did you handle it?" },
      {
        role: "candidate",
        text: "um like i think maybe i sort of um you know kind of not sure basically um like i guess we possibly did something um you know like maybe sort of",
      },
    ];
    const result = analyzeTranscript(weak);
    expect(result.available).toBe(true);
    expect(result.confidenceScore).toBeLessThan(50);
  });
});
