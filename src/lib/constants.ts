/**
 * Canonical enum values shared by the database, API validation, and UI. These
 * are the single source of truth for the string unions that used to be duplicated
 * (and drift) across the schema comments, API routes, and frontend.
 */
export const CALL_STATUSES = ["pending", "calling", "processing", "completed", "failed"] as const;
export type CallStatus = (typeof CALL_STATUSES)[number];

export const DECISION_STATUSES = ["undecided", "shortlisted", "rejected"] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export const JOB_STATUSES = ["active", "paused", "closed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const RECOMMENDATIONS = ["Shortlist", "Hold", "Reject"] as const;
export type Recommendation = (typeof RECOMMENDATIONS)[number];

export const INTERVIEW_STATUSES = ["proposed", "scheduled", "completed", "cancelled"] as const;
export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MAX_BULK_CALL_BATCH = 50;
