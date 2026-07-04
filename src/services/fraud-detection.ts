import { clamp, tokenize } from "@/lib/text-metrics";
import { KNOWN_SKILLS } from "./parsing.service";

export type FraudSeverity = "low" | "medium" | "high";

export interface FraudFlag {
  code: string;
  severity: FraudSeverity;
  detail: string;
}

export interface FraudReport {
  fraudScore: number; // 0-100, higher = more suspicious
  flags: FraudFlag[];
  risk: "low" | "medium" | "high";
}

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "10minutemail.com",
  "throwawaymail.com",
  "yopmail.com",
  "trashmail.com",
  "getnada.com",
  "dispostable.com",
  "sharklasers.com",
  "fakeinbox.com",
  "maildrop.cc",
  "mvrht.com",
]);

const SEVERITY_WEIGHT: Record<FraudSeverity, number> = { low: 10, medium: 25, high: 45 };

/** Jaccard similarity of the token sets of two documents (0–1). */
export function documentSimilarity(a: string, b: string): number {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) if (setB.has(token)) intersection += 1;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function checkEmail(email: string, flags: FraudFlag[]) {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return;
  const domain = trimmed.split("@")[1] ?? "";
  if (!domain || !domain.includes(".")) {
    flags.push({
      code: "invalid_email",
      severity: "medium",
      detail: "Email domain looks malformed.",
    });
    return;
  }
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    flags.push({
      code: "disposable_email",
      severity: "high",
      detail: `Disposable email provider (${domain}).`,
    });
  }
}

function checkKeywordStuffing(text: string, flags: FraudFlag[]) {
  const tokens = tokenize(text);
  if (tokens.length < 20) return;

  // Density of known skill mentions relative to total words.
  const skillMentions = tokens.filter((t) =>
    KNOWN_SKILLS.some((s) => s.toLowerCase() === t)
  ).length;
  const density = skillMentions / tokens.length;
  if (density > 0.18) {
    flags.push({
      code: "keyword_stuffing",
      severity: "medium",
      detail: `Unusually high skill-keyword density (${Math.round(density * 100)}%).`,
    });
  }

  // Any single word repeated excessively (excluding very short stop-ish words).
  const counts = new Map<string, number>();
  for (const token of tokens) {
    if (token.length < 4) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  const maxRepeat = Math.max(0, ...counts.values());
  if (maxRepeat / tokens.length > 0.08) {
    flags.push({
      code: "repetitive_content",
      severity: "low",
      detail: "A single term is repeated abnormally often.",
    });
  }
}

function checkExperience(experience: number, text: string, flags: FraudFlag[]) {
  if (experience > 50) {
    flags.push({
      code: "implausible_experience",
      severity: "high",
      detail: `${experience} years of experience is implausible.`,
    });
  }
  const claimsFresher = /\b(fresher|no experience|entry[- ]level|new grad)\b/i.test(text);
  if (claimsFresher && experience >= 5) {
    flags.push({
      code: "inconsistent_experience",
      severity: "medium",
      detail: `Text mentions being a fresher but ${experience} years are claimed.`,
    });
  }
}

export interface FraudCheckInput {
  resumeText: string;
  email: string;
  experience: number;
  /** Other candidates' resume texts to compare against for duplicates. */
  otherResumeTexts?: { candidateId: string; text: string }[];
}

export function detectFraud(input: FraudCheckInput): FraudReport {
  const flags: FraudFlag[] = [];

  checkEmail(input.email, flags);
  checkKeywordStuffing(input.resumeText, flags);
  checkExperience(input.experience, input.resumeText, flags);

  for (const other of input.otherResumeTexts ?? []) {
    const similarity = documentSimilarity(input.resumeText, other.text);
    if (similarity >= 0.85) {
      flags.push({
        code: "duplicate_resume",
        severity: "high",
        detail: `Near-identical to another candidate's resume (${Math.round(similarity * 100)}% overlap).`,
      });
      break;
    }
  }

  const fraudScore = clamp(
    flags.reduce((total, flag) => total + SEVERITY_WEIGHT[flag.severity], 0)
  );
  const hasHighSeverity = flags.some((flag) => flag.severity === "high");
  const risk = hasHighSeverity || fraudScore >= 60 ? "high" : fraudScore >= 25 ? "medium" : "low";

  return { fraudScore, flags, risk };
}
