export type CallStatus = "pending" | "calling" | "processing" | "completed" | "failed";

export type DecisionStatus = "undecided" | "shortlisted" | "rejected";

export type JobRole =
  | "Full-Stack Engineer"
  | "Frontend Engineer"
  | "Backend Engineer"
  | "DevOps Engineer"
  | "Data Scientist"
  | "Product Manager"
  | "UI/UX Designer";

export type AppMode = "demo" | "live";

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: JobRole | string;
  experience: number;
  callStatus: CallStatus;
  decisionStatus: DecisionStatus;
  score?: number | null;
  callId?: string | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  resumeUrl?: string | null;
  location: string;
  appliedAt: string;
  transcript?: TranscriptMessage[];
  screeningResult?: ScreeningResult;
  tags?: string[];
  avatarColor: string;
  jobId?: string | null;
  job?: Job | null;
}

export interface TranscriptMessage {
  role: "agent" | "candidate";
  text: string;
  timestamp: string;
}

export interface ScreeningResult {
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  cultureFitScore: number;
  overallScore: number;
  strengths: string[];
  concerns: string[];
  recommendation: "Shortlist" | "Reject" | "Hold";
  summary: string;
  keySkills: string[];
  availability: string;
  salaryExpectation: string;
}

export interface Job {
  id: string;
  title: JobRole | string;
  department: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract" | string;
  openings: number;
  applicants: number;
  screened: number;
  shortlisted: number;
  status: "active" | "paused" | "closed" | string;
  createdAt: string;
  description: string;
  skills: string[];
  salaryRange: string;
}

export interface CallLog {
  id: string;
  candidateId: string;
  candidateName: string;
  role: JobRole | string;
  duration: string;
  status: CallStatus;
  startedAt: string;
  score?: number | null;
  agentId: string;
}

export interface BolnaConfig {
  apiKey: string;
  agentId: string;
  webhookUrl: string;
}

export interface DashboardStats {
  totalCandidates: number;
  completedInterviews: number;
  shortlisted: number;
  avgScore: number;
  activeCalls: number;
}
