import { generateJson, isGeminiConfigured } from "@/lib/gemini";
import { logger } from "@/lib/logger";

/** Curated skill dictionary used for deterministic extraction + match scoring. */
export const KNOWN_SKILLS = [
  "React",
  "Next.js",
  "Node.js",
  "TypeScript",
  "JavaScript",
  "Python",
  "Java",
  "Go",
  "Rust",
  "Ruby",
  "PHP",
  "C++",
  "C#",
  "Swift",
  "Kotlin",
  "SQL",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "DynamoDB",
  "GraphQL",
  "REST",
  "AWS",
  "GCP",
  "Azure",
  "Docker",
  "Kubernetes",
  "Terraform",
  "Express",
  "FastAPI",
  "Django",
  "Flask",
  "Spring",
  "Prisma",
  "Tailwind",
  "CSS",
  "HTML",
  "Git",
  "CI/CD",
  "Kafka",
  "RabbitMQ",
];

function matchSkillsInText(text: string): string[] {
  return KNOWN_SKILLS.filter((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
  });
}

// ---------------------------------------------------------------------------
// Job description parsing
// ---------------------------------------------------------------------------
export interface ParsedJobDescription {
  title: string;
  company: string;
  location: string;
  salary: string;
  skills: string[];
  type: string;
  smartPrompt: string;
  source: "ai" | "heuristic";
}

function heuristicJobDescription(text: string): ParsedJobDescription {
  const title = (
    text.match(/designation[:\s]+([^\n]+)/i)?.[1] ??
    text.match(/(?:^|\n)role[:\s]+([^\n]+)/i)?.[1] ??
    text.match(/(?:position|title)[:\s]+([^\n]+)/i)?.[1] ??
    "New Role"
  ).trim();

  const location = text.match(/(?:work location|location|city)[:\s]+([^\n]+)/i)?.[1]?.trim() ?? "";
  const salary =
    text
      .match(
        /(?:ctc(?: range)?|salary|stipend|compensation)\s*[:\-]?\s*((?:INR|₹|USD|Rs\.?)?\s*[\d,]+(?:\s*[-–]\s*[\d,]+)?\s*(?:LPA|per month|\/month|k|L|lpa)?)/i
      )?.[1]
      ?.trim() ?? "";
  const company = text.match(/company(?:\s+name)?[:\s]+([^\n]+)/i)?.[1]?.trim() ?? "";
  const skills = matchSkillsInText(text);
  const type = /intern/i.test(text) ? "Internship" : "Full-time";

  const smartPrompt = buildSmartPrompt(title, company, skills);

  return { title, company, location, salary, skills, type, smartPrompt, source: "heuristic" };
}

function buildSmartPrompt(title: string, company: string, skills: string[]): string {
  return `You are interviewing a candidate for the role of "${title}"${
    company ? ` at ${company}` : ""
  }. Focus on: ${
    skills.length ? skills.join(", ") : "their general technical skills"
  }. Ask them to walk through a real project, debug a hypothetical issue relevant to this stack, and assess their problem-solving process. Probe for depth. Be conversational but rigorous.`;
}

export async function parseJobDescription(text: string): Promise<ParsedJobDescription> {
  if (isGeminiConfigured()) {
    try {
      const prompt = `Extract structured data from this Job Description. Also provide a "smartPrompt": a precise instruction to an AI voice interviewer on which technical, domain, and situational questions to ask this candidate based on the JD.

Return ONLY raw JSON in exactly this shape:
{"title":"","company":"","location":"","salary":"","skills":[],"type":"","smartPrompt":""}

JD:
${text.slice(0, 6000)}`;

      const ai = await generateJson<Partial<ParsedJobDescription>>(prompt);
      return {
        title: ai.title || "New Role",
        company: ai.company || "",
        location: ai.location || "",
        salary: ai.salary || "",
        skills: Array.isArray(ai.skills) ? ai.skills.map(String) : [],
        type: ai.type || "Full-time",
        smartPrompt:
          ai.smartPrompt ||
          buildSmartPrompt(ai.title || "New Role", ai.company || "", ai.skills ?? []),
        source: "ai",
      };
    } catch (error) {
      logger.warn("JD AI parse failed; using heuristic extraction", { error });
    }
  }
  return heuristicJobDescription(text);
}

// ---------------------------------------------------------------------------
// Resume parsing + intelligence
// ---------------------------------------------------------------------------
export interface ResumeIntelligence {
  name: string;
  email: string;
  phone: string;
  experience: number;
  skills: string[];
  /** 0–100 deterministic match against the job's required skills. */
  matchScore: number;
  /** 0–100 heuristic confidence that extraction captured real data. */
  confidence: number;
  strengths: string[];
  weaknesses: string[];
  summary: string;
  source: "ai" | "heuristic";
}

interface BaseExtraction {
  name: string;
  email: string;
  phone: string;
  experience: number;
  skills: string[];
}

function heuristicExtraction(text: string): BaseExtraction {
  const email = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/)?.[1] ?? "";
  const phone =
    text.match(/(\+?\d{1,3}[-.\s]?\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{3,4})/)?.[1]?.trim() ?? "";
  const experience = Number(text.match(/(\d+)\+?\s*(years?|yrs?)/i)?.[1] ?? 0);

  const nameLine = text
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 2 && !l.startsWith("http") && !l.includes("@"));

  return {
    name: (nameLine ?? "").substring(0, 100),
    email,
    phone,
    experience: Number.isFinite(experience) ? experience : 0,
    skills: matchSkillsInText(text),
  };
}

/** Deterministic 0–100 match of resume skills against required job skills. */
export function computeSkillMatch(resumeSkills: string[], jobSkills: string[]): number {
  if (jobSkills.length === 0) {
    // No job context: score on breadth of demonstrated skills (cap at 10).
    return Math.min(100, Math.round((resumeSkills.length / 10) * 100));
  }
  const normalized = new Set(resumeSkills.map((s) => s.toLowerCase()));
  const matched = jobSkills.filter((s) => normalized.has(s.toLowerCase()));
  return Math.round((matched.length / jobSkills.length) * 100);
}

function computeConfidence(base: BaseExtraction): number {
  let score = 0;
  if (/@/.test(base.email)) score += 25;
  if (base.phone) score += 15;
  if (base.experience > 0) score += 15;
  if (base.name && base.name !== "Extracted Candidate") score += 15;
  if (base.skills.length >= 3) score += 30;
  else if (base.skills.length > 0) score += 15;
  return Math.min(100, score);
}

function deterministicNarrative(base: BaseExtraction, jobSkills: string[]) {
  const normalized = new Set(base.skills.map((s) => s.toLowerCase()));
  const matched = jobSkills.filter((s) => normalized.has(s.toLowerCase()));
  const missing = jobSkills.filter((s) => !normalized.has(s.toLowerCase()));

  const strengths = (matched.length ? matched : base.skills).slice(0, 5);
  const weaknesses = missing.slice(0, 5);

  const summaryParts = [
    base.name ? `${base.name} presents` : "Candidate presents",
    base.experience > 0 ? `${base.experience} years of experience` : "an early-career profile",
    base.skills.length ? `with skills in ${base.skills.slice(0, 5).join(", ")}.` : ".",
  ];
  if (jobSkills.length) {
    summaryParts.push(`Matches ${matched.length}/${jobSkills.length} required skills.`);
  }

  return { strengths, weaknesses, summary: summaryParts.join(" ") };
}

export async function parseResume(params: {
  text: string;
  jobSkills?: string[];
  jobTitle?: string;
}): Promise<ResumeIntelligence> {
  const jobSkills = params.jobSkills ?? [];

  let base: BaseExtraction = heuristicExtraction(params.text);
  let narrative = deterministicNarrative(base, jobSkills);
  let source: "ai" | "heuristic" = "heuristic";

  if (isGeminiConfigured()) {
    try {
      const jobContext = params.jobTitle
        ? `Target role: ${params.jobTitle}. Required skills: ${jobSkills.join(", ")}.`
        : "";
      const prompt = `Extract candidate information from this resume and assess it${
        params.jobTitle ? " for the target role" : ""
      }. Return ONLY raw JSON in this shape:
{"name":"","email":"","phone":"","experience":0,"skills":[],"strengths":[],"weaknesses":[],"summary":""}
${jobContext}

Resume:
${params.text.slice(0, 4000)}`;

      const ai = await generateJson<Partial<ResumeIntelligence>>(prompt);
      base = {
        name: (ai.name || base.name || "").toString().substring(0, 100).trim(),
        email: (ai.email || base.email || "").toString().trim(),
        phone: (ai.phone || base.phone || "").toString().trim(),
        experience: Math.max(0, Number(ai.experience) || base.experience),
        skills:
          Array.isArray(ai.skills) && ai.skills.length
            ? ai.skills.slice(0, 15).map(String)
            : base.skills,
      };
      narrative = {
        strengths:
          Array.isArray(ai.strengths) && ai.strengths.length
            ? ai.strengths.map(String).slice(0, 6)
            : narrative.strengths,
        weaknesses:
          Array.isArray(ai.weaknesses) && ai.weaknesses.length
            ? ai.weaknesses.map(String).slice(0, 6)
            : narrative.weaknesses,
        summary:
          typeof ai.summary === "string" && ai.summary.trim() ? ai.summary : narrative.summary,
      };
      source = "ai";
    } catch (error) {
      logger.warn("Resume AI parse failed; using heuristic extraction", { error });
    }
  }

  return {
    ...base,
    // matchScore + confidence stay deterministic (verifiable, not model-guessed).
    matchScore: computeSkillMatch(base.skills, jobSkills),
    confidence: computeConfidence(base),
    ...narrative,
    source,
  };
}
