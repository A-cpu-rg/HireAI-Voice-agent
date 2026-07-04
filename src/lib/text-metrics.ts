/**
 * Small, dependency-free text utilities shared by the interview-intelligence
 * and fraud-detection services. Kept pure so they are trivially unit-testable.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export const FILLER_PHRASES = [
  "um",
  "uh",
  "er",
  "ah",
  "like",
  "you know",
  "sort of",
  "kind of",
  "basically",
  "actually",
  "literally",
  "i mean",
];

export const HEDGE_PHRASES = [
  "maybe",
  "i think",
  "i guess",
  "not sure",
  "possibly",
  "probably",
  "perhaps",
  "i suppose",
  "kind of",
  "sort of",
];

/** Count non-overlapping occurrences of each phrase within the text. */
export function countPhrases(text: string, phrases: string[]): number {
  const haystack = ` ${text.toLowerCase()} `;
  return phrases.reduce((total, phrase) => {
    const needle = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
    const matches = haystack.match(needle);
    return total + (matches ? matches.length : 0);
  }, 0);
}

/** Ratio of unique tokens to total tokens (0–1). */
export function lexicalDiversity(tokens: string[]): number {
  if (tokens.length === 0) return 0;
  return new Set(tokens).size / tokens.length;
}

export function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function round(value: number): number {
  return Math.round(value);
}
