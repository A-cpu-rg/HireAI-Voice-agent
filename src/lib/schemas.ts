import { z } from "zod";
import {
  CALL_STATUSES,
  DECISION_STATUSES,
  JOB_STATUSES,
  INTERVIEW_STATUSES,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MAX_BULK_CALL_BATCH,
} from "./constants";

const INTERVIEW_MODES = ["phone", "video", "onsite"] as const;
const FRAUD_SEVERITIES = ["low", "medium", "high"] as const;

export const resumeIntelligenceSchema = z.object({
  skills: z.array(z.string()).max(30),
  matchScore: z.number().int().min(0).max(100),
  confidence: z.number().int().min(0).max(100),
  strengths: z.array(z.string()).max(10),
  weaknesses: z.array(z.string()).max(10),
  summary: z.string().max(4000),
  source: z.enum(["ai", "heuristic"]),
});

export const fraudReportSchema = z.object({
  fraudScore: z.number().int().min(0).max(100),
  flags: z
    .array(
      z.object({
        code: z.string(),
        severity: z.enum(FRAUD_SEVERITIES),
        detail: z.string(),
      })
    )
    .max(20),
});

/** Coerce `?page=2` style query strings into bounded integers. */
const pageNumber = z.coerce.number().int().min(1).default(1);
const pageSize = z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE);

const sortOrder = z.enum(["asc", "desc"]).default("desc");

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.");
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters.").max(200);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120).optional(),
  email: emailSchema,
  password: passwordSchema,
});

export const resendVerificationSchema = z.object({ email: emailSchema });
export const verifyEmailSchema = z.object({ token: z.string().min(10) });

// ---------------------------------------------------------------------------
// Candidates
// ---------------------------------------------------------------------------
export const createCandidateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(160),
  email: emailSchema,
  phone: z.string().trim().max(40).optional().default(""),
  role: z.string().trim().min(1, "Role is required.").max(120),
  experience: z.coerce.number().int().min(0).max(60).optional().default(0),
  location: z.string().trim().max(120).optional().default("Remote"),
  avatarColor: z.string().trim().max(32).optional(),
  appliedAt: z.string().datetime().optional(),
  tags: z.array(z.string()).max(30).optional(),
  matchScore: z.number().int().min(0).max(100).nullable().optional(),
  callStatus: z.enum(CALL_STATUSES).optional(),
  decisionStatus: z.enum(DECISION_STATUSES).optional(),
  jobId: z.string().uuid().optional(),
  resumeUrl: z.string().url().optional(),
  // Optional resume-intelligence payload produced by /api/parse-resume.
  intelligence: resumeIntelligenceSchema.optional(),
  fraud: fraudReportSchema.optional(),
});
export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;

export const updateCandidateSchema = z
  .object({
    callStatus: z.enum(CALL_STATUSES),
    decisionStatus: z.enum(DECISION_STATUSES),
    score: z.number().int().min(0).max(100).nullable(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update.",
  });

export const listCandidatesSchema = z.object({
  page: pageNumber,
  pageSize,
  callStatus: z.enum(CALL_STATUSES).optional(),
  status: z.enum(CALL_STATUSES).optional(), // legacy alias
  decisionStatus: z.enum(DECISION_STATUSES).optional(),
  jobId: z.string().uuid().optional(),
  search: z.string().trim().max(120).optional(),
  sortBy: z.enum(["appliedAt", "score", "name", "matchScore"]).default("appliedAt"),
  sortOrder,
});
export type ListCandidatesQuery = z.infer<typeof listCandidatesSchema>;

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------
export const createJobSchema = z.object({
  title: z.string().trim().min(1, "Title is required.").max(160),
  department: z.string().trim().max(120).optional().default("General"),
  location: z.string().trim().max(120).optional().default("Remote"),
  type: z.string().trim().max(60).optional().default("Full-time"),
  openings: z.coerce.number().int().min(1).max(1000).optional().default(1),
  status: z.enum(JOB_STATUSES).optional().default("active"),
  description: z.string().trim().max(20_000).optional().default(""),
  skills: z.array(z.string()).max(50).optional().default([]),
  salaryRange: z.string().trim().max(80).optional().default(""),
  smartPrompt: z.string().max(5_000).optional(),
});
export type CreateJobInput = z.infer<typeof createJobSchema>;

export const listJobsSchema = z.object({
  page: pageNumber,
  pageSize,
  status: z.enum(JOB_STATUSES).optional(),
  search: z.string().trim().max(120).optional(),
  sortOrder,
});

// ---------------------------------------------------------------------------
// Calls
// ---------------------------------------------------------------------------
export const listCallsSchema = z.object({
  page: pageNumber,
  pageSize,
  status: z.enum(CALL_STATUSES).optional(),
  sortOrder,
});

export const triggerCallSchema = z.object({
  candidateId: z.string().uuid(),
});

export const bulkCallSchema = z.object({
  candidateIds: z
    .array(z.string().uuid())
    .min(1, "Select at least one candidate.")
    .max(MAX_BULK_CALL_BATCH, `You can call at most ${MAX_BULK_CALL_BATCH} candidates at once.`),
});

// ---------------------------------------------------------------------------
// Config (Bolna credentials)
// ---------------------------------------------------------------------------
export const saveConfigSchema = z.object({
  apiKey: z.string().trim().max(400).optional(),
  agentId: z.string().trim().max(200).optional(),
});

export const testConfigSchema = z.object({
  apiKey: z.string().trim().min(1, "API key is required."),
  agentId: z.string().trim().min(1, "Agent id is required."),
});

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------
export const compareCandidatesSchema = z.object({
  candidateIds: z.array(z.string().uuid()).min(2, "Select at least two candidates.").max(6),
});

// ---------------------------------------------------------------------------
// Interviews (scheduling)
// ---------------------------------------------------------------------------
export const createInterviewSchema = z.object({
  candidateId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  durationMins: z.coerce.number().int().min(5).max(480).optional().default(30),
  mode: z.enum(INTERVIEW_MODES).optional().default("video"),
  interviewer: z.string().trim().max(160).optional(),
  location: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(4000).optional(),
});

export const updateInterviewSchema = z
  .object({
    scheduledAt: z.string().datetime(),
    durationMins: z.coerce.number().int().min(5).max(480),
    mode: z.enum(INTERVIEW_MODES),
    status: z.enum(INTERVIEW_STATUSES),
    interviewer: z.string().trim().max(160),
    location: z.string().trim().max(500),
    notes: z.string().trim().max(4000),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update.",
  });

export const listInterviewsSchema = z.object({
  page: pageNumber,
  pageSize,
  status: z.enum(INTERVIEW_STATUSES).optional(),
  candidateId: z.string().uuid().optional(),
  sortOrder,
});
