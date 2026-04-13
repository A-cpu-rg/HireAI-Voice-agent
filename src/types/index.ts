export type CandidateStatus =
  | "pending"
  | "scheduled"
  | "calling"
  | "completed"
  | "failed"
  | "shortlisted"
  | "rejected";

export type JobRole =
  | "Full-Stack Engineer"
  | "Frontend Engineer"
  | "Backend Engineer"
  | "DevOps Engineer"
  | "Data Scientist"
  | "Product Manager"
  | "UI/UX Designer";

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: JobRole;
  experience: number;
  status: CandidateStatus;
  score?: number;
  callId?: string;
  scheduledAt?: string;
  completedAt?: string;
  resumeUrl?: string;
  location: string;
  appliedAt: string;
  transcript?: TranscriptMessage[];
  screeningResult?: ScreeningResult;
  tags?: string[];
  avatarColor: string;
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
  title: JobRole;
  department: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract";
  openings: number;
  applicants: number;
  screened: number;
  shortlisted: number;
  status: "active" | "paused" | "closed";
  createdAt: string;
  description: string;
  skills: string[];
  salaryRange: string;
}

export interface CallLog {
  id: string;
  candidateId: string;
  candidateName: string;
  role: JobRole;
  duration: string;
  status: "success" | "failed" | "no-answer" | "in-progress";
  startedAt: string;
  score?: number;
  agentId: string;
}

export interface BolnaConfig {
  apiKey: string;
  agentId: string;
  webhookUrl: string;
}

export interface DashboardStats {
  totalCandidates: number;
  screened: number;
  shortlisted: number;
  rejected: number;
  avgScore: number;
  callsToday: number;
  successRate: number;
  timeSaved: number;
}
