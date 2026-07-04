import type {
  Candidate,
  Job,
  ResumeAnalysis,
  ScreeningResult,
  TranscriptMessage,
} from "@prisma/client";
import { logger } from "./logger";

/**
 * Several columns store JSON-encoded arrays as strings (a legacy of the initial
 * schema). These helpers parse them defensively so one malformed row can never
 * throw and 500 an entire list endpoint. All API responses are built through
 * these serializers so the client always receives real arrays.
 */
export function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    logger.warn("Failed to parse JSON array column; defaulting to []", { raw });
    return [];
  }
}

export type SerializedJob = Omit<Job, "skills"> & { skills: string[] };

export function serializeJob(job: Job): SerializedJob {
  return { ...job, skills: parseJsonArray(job.skills) };
}

export type SerializedScreeningResult = Omit<
  ScreeningResult,
  "strengths" | "concerns" | "keySkills"
> & {
  strengths: string[];
  concerns: string[];
  keySkills: string[];
};

export function serializeScreeningResult(result: ScreeningResult): SerializedScreeningResult {
  return {
    ...result,
    strengths: parseJsonArray(result.strengths),
    concerns: parseJsonArray(result.concerns),
    keySkills: parseJsonArray(result.keySkills),
  };
}

export type SerializedResumeAnalysis = Omit<
  ResumeAnalysis,
  "skills" | "strengths" | "weaknesses"
> & {
  skills: string[];
  strengths: string[];
  weaknesses: string[];
};

export function serializeResumeAnalysis(analysis: ResumeAnalysis): SerializedResumeAnalysis {
  return {
    ...analysis,
    skills: parseJsonArray(analysis.skills),
    strengths: parseJsonArray(analysis.strengths),
    weaknesses: parseJsonArray(analysis.weaknesses),
  };
}

export type CandidateWithRelations = Candidate & {
  job?: Job | null;
  screeningResult?: ScreeningResult | null;
  resumeAnalysis?: ResumeAnalysis | null;
  transcript?: TranscriptMessage[];
};

export type SerializedCandidate = Omit<Candidate, "tags" | "fraudFlags"> & {
  tags: string[];
  fraudFlags: string[];
  job: SerializedJob | null;
  screeningResult: SerializedScreeningResult | null;
  resumeAnalysis: SerializedResumeAnalysis | null;
  transcript?: TranscriptMessage[];
};

export function serializeCandidate(candidate: CandidateWithRelations): SerializedCandidate {
  const { job, screeningResult, resumeAnalysis, transcript, ...rest } = candidate;
  return {
    ...rest,
    tags: parseJsonArray(candidate.tags),
    fraudFlags: parseJsonArray(candidate.fraudFlags),
    job: job ? serializeJob(job) : null,
    screeningResult: screeningResult ? serializeScreeningResult(screeningResult) : null,
    resumeAnalysis: resumeAnalysis ? serializeResumeAnalysis(resumeAnalysis) : null,
    ...(transcript ? { transcript } : {}),
  };
}
