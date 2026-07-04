import { describe, it, expect } from "vitest";
import { tokenize, countPhrases, lexicalDiversity, clamp } from "./text-metrics";

describe("tokenize", () => {
  it("lowercases and splits on non-word characters", () => {
    expect(tokenize("React, Node.js & SQL!")).toEqual(["react", "node", "js", "sql"]);
  });
});

describe("countPhrases", () => {
  it("counts whole-word phrase occurrences", () => {
    expect(countPhrases("um well um okay", ["um"])).toBe(2);
    expect(countPhrases("you know what i mean", ["you know", "i mean"])).toBe(2);
  });

  it("does not match substrings", () => {
    expect(countPhrases("summary", ["um"])).toBe(0);
  });
});

describe("lexicalDiversity", () => {
  it("is 1 for all-unique tokens and lower for repeats", () => {
    expect(lexicalDiversity(["a", "b", "c"])).toBe(1);
    expect(lexicalDiversity(["a", "a", "b", "b"])).toBe(0.5);
    expect(lexicalDiversity([])).toBe(0);
  });
});

describe("clamp", () => {
  it("bounds values to the range", () => {
    expect(clamp(-5)).toBe(0);
    expect(clamp(150)).toBe(100);
    expect(clamp(42)).toBe(42);
  });
});
