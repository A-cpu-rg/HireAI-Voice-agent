import {
  clamp,
  countPhrases,
  FILLER_PHRASES,
  HEDGE_PHRASES,
  lexicalDiversity,
  round,
  tokenize,
} from "@/lib/text-metrics";
import type { Recommendation } from "@/lib/constants";

export interface TranscriptTurn {
  role: string; // "agent" | "candidate"
  text: string;
  timestamp?: string;
}

export interface InterviewIntelligence {
  available: boolean;
  communicationScore: number;
  confidenceScore: number;
  speakingQuality: number;
  overallScore: number;
  metrics: {
    candidateTurns: number;
    totalWords: number;
    avgWordsPerTurn: number;
    fillerRatio: number;
    hedgeRatio: number;
    lexicalDiversity: number;
    questionsAsked: number;
  };
  strengths: string[];
  weaknesses: string[];
  summary: string;
  recommendation: Recommendation | null;
}

const IDEAL_WORDS_PER_TURN = 35;

function recommendationFor(overall: number): Recommendation {
  if (overall >= 80) return "Shortlist";
  if (overall >= 65) return "Hold";
  return "Reject";
}

/**
 * Derive interview-quality signals from a transcript using deterministic,
 * explainable metrics (verbosity, filler/hedge usage, vocabulary richness,
 * engagement). No fabricated numbers — when there is nothing meaningful to
 * measure, `available` is false.
 */
export function analyzeTranscript(transcript: TranscriptTurn[]): InterviewIntelligence {
  const candidateTurns = transcript.filter((t) => t.role.toLowerCase().includes("candidate"));
  const candidateText = candidateTurns.map((t) => t.text).join(" ");
  const tokens = tokenize(candidateText);

  const empty: InterviewIntelligence = {
    available: false,
    communicationScore: 0,
    confidenceScore: 0,
    speakingQuality: 0,
    overallScore: 0,
    metrics: {
      candidateTurns: candidateTurns.length,
      totalWords: 0,
      avgWordsPerTurn: 0,
      fillerRatio: 0,
      hedgeRatio: 0,
      lexicalDiversity: 0,
      questionsAsked: 0,
    },
    strengths: [],
    weaknesses: [],
    summary: "Not enough candidate speech was captured to assess this interview.",
    recommendation: null,
  };

  if (tokens.length < 15) return empty;

  const totalWords = tokens.length;
  const avgWordsPerTurn = totalWords / Math.max(1, candidateTurns.length);
  const fillerRatio = countPhrases(candidateText, FILLER_PHRASES) / totalWords;
  const hedgeRatio = countPhrases(candidateText, HEDGE_PHRASES) / totalWords;
  const diversity = lexicalDiversity(tokens);
  const questionsAsked = (candidateText.match(/\?/g) ?? []).length;

  // Communication: rewards substantive answers and engagement, penalises fillers.
  const verbosityScore = clamp(
    100 - (Math.abs(avgWordsPerTurn - IDEAL_WORDS_PER_TURN) / IDEAL_WORDS_PER_TURN) * 60
  );
  const communicationScore = round(
    clamp(verbosityScore * 0.7 - fillerRatio * 400 + Math.min(questionsAsked, 3) * 4 + 20)
  );

  // Confidence: penalises hedging and fillers, rewards assertive, fluent speech.
  const confidenceScore = round(clamp(85 - hedgeRatio * 500 - fillerRatio * 300));

  // Speaking quality: vocabulary richness within a realistic band.
  const speakingQuality = round(clamp(40 + diversity * 90));

  const overallScore = round(
    communicationScore * 0.45 + confidenceScore * 0.35 + speakingQuality * 0.2
  );

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (fillerRatio < 0.02) strengths.push("Clear, low-filler delivery");
  else if (fillerRatio > 0.05) weaknesses.push("Frequent filler words");
  if (hedgeRatio < 0.02) strengths.push("Confident, assertive phrasing");
  else if (hedgeRatio > 0.05) weaknesses.push("Hedges often (low certainty)");
  if (avgWordsPerTurn >= 25) strengths.push("Detailed, elaborated answers");
  else if (avgWordsPerTurn < 12) weaknesses.push("Very short answers");
  if (diversity > 0.55) strengths.push("Rich vocabulary");
  if (questionsAsked >= 2) strengths.push("Engaged (asked questions)");

  const summary = `Candidate spoke across ${candidateTurns.length} turns (${totalWords} words, ~${round(
    avgWordsPerTurn
  )}/turn). Communication ${communicationScore}, confidence ${confidenceScore}, speaking quality ${speakingQuality}.`;

  return {
    available: true,
    communicationScore,
    confidenceScore,
    speakingQuality,
    overallScore,
    metrics: {
      candidateTurns: candidateTurns.length,
      totalWords,
      avgWordsPerTurn: round(avgWordsPerTurn),
      fillerRatio: Math.round(fillerRatio * 1000) / 1000,
      hedgeRatio: Math.round(hedgeRatio * 1000) / 1000,
      lexicalDiversity: Math.round(diversity * 100) / 100,
      questionsAsked,
    },
    strengths,
    weaknesses,
    summary,
    recommendation: recommendationFor(overallScore),
  };
}
