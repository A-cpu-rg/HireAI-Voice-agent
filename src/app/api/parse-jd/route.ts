import { NextResponse } from "next/server";
// pdf-parse loaded via require() inside handler to avoid ESM/webpack conflict
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Smart Regex Fallback ────────────────────────────────────────────────────
function regexExtractJD(text: string) {
  // Title / Role — prefer Designation > Role > Position > Title
  const designationMatch = text.match(/designation[:\s]+([^\n]+)/i);
  const roleMatch = text.match(/(?:^|\n)role[:\s]+([^\n]+)/i);
  const positionMatch = text.match(/(?:position|title)[:\s]+([^\n]+)/i);
  const title = (designationMatch?.[1] || roleMatch?.[1] || positionMatch?.[1] || "New Role").trim();

  // Location
  const locationMatch = text.match(/(?:joining location|work location|location|city)[:\s]+([^\n]+)/i);
  const location = locationMatch ? locationMatch[1].trim() : "";

  // Salary / CTC — capture full amount including INR prefix and unit
  const salaryRaw = text.match(
    /(?:ctc(?: range)?|salary|stipend|compensation)\s*[:\-]?\s*((?:INR|₹|USD|Rs\.?)?\s*[\d,]+(?:\s*[-–]\s*[\d,]+)?\s*(?:LPA|per month|\/month|k|L|lpa)?)/i
  );
  const salary = salaryRaw ? salaryRaw[1].trim() : "";

  // Skills — detect common tech keywords directly in text
  const commonSkills = [
    "React", "Python", "SQL", "Node.js", "TypeScript", "JavaScript",
    "PostgreSQL", "MongoDB", "AWS", "Docker", "Next.js", "DynamoDB",
    "GraphQL", "REST", "Git", "Java", "Go", "Kubernetes", "Redis",
    "Express", "FastAPI", "Django", "Flask", "Tailwind", "CSS", "HTML"
  ];
  const skills = commonSkills.filter(s =>
    new RegExp(`\\b${s.replace(".", "\\.")}\\b`, "i").test(text)
  );

  // Company
  const companyMatch = text.match(/company(?:\s+name)?[:\s]+([^\n]+)/i);
  const company = companyMatch ? companyMatch[1].trim() : "";

  // Type — detect internship vs full-time
  const type = /intern/i.test(text) ? "Internship" : "Full-time";

  // Clean description — first 2-3 meaningful lines only (not full dump)
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 30);
  const description = lines.slice(0, 3).join(" ").substring(0, 300);

  // Smart Prompt from JD context
  const smartPrompt = `You are interviewing a candidate for the role: "${title}"${company ? ` at ${company}` : ""}.
Focus on: ${skills.length ? skills.join(", ") : "their general technical skills"}.
Ask them to walk through a real project, debug a hypothetical issue relevant to this stack, and assess their problem-solving process.
Probe for depth. Be conversational but rigorous.`;

  return { title, location, salary, skills, company, type, description, smartPrompt };
}

// ─── Gemini with retry ───────────────────────────────────────────────────────
async function extractWithGemini(text: string): Promise<any> {
  if (!process.env.GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY not set");

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const MODELS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.0-flash-lite"];

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });

      const prompt = `Extract structured data from this Job Description. Provide a highly specific "smartPrompt" which is an instruction to an AI Voice Agent Interviewer on what precise technical, domain, or situational questions to grill the candidate on based on the JD.

Return ONLY raw JSON, NO MARKDOWN TAGS. Exactly this format:
{
  "title": "",
  "company": "",
  "location": "",
  "salary": "",
  "skills": [],
  "type": "",
  "smartPrompt": ""
}

JD:
${text}`;

      const result = await model.generateContent(prompt);
      let responseText = result.response.text();

      // JSON SANITIZER
      responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(responseText);
      return { ...parsed, _model: modelName };
    } catch (err: any) {
      // 429 = rate limit → try next model
      if (err?.status === 429 || err?.message?.includes("429") || err?.message?.includes("quota")) {
        console.warn(`[parse-jd] ${modelName} quota exceeded, trying next...`);
        continue;
      }
      // 404 = model not available → try next
      if (err?.status === 404 || err?.message?.includes("404")) {
        console.warn(`[parse-jd] ${modelName} not found, trying next...`);
        continue;
      }
      throw err; // Other errors: bubble up
    }
  }

  throw new Error("ALL_MODELS_EXHAUSTED");
}

// ─── Route Handler ───────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const jdTextRaw = formData.get('jd') as string | null;

    let jdText = "";

    if (file && file.name.toLowerCase().endsWith('.pdf')) {
      // Dynamic require bypasses webpack ESM bundling issue with pdf-parse
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require('pdf-parse');
      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await pdfParse(buffer);
      jdText = parsed.text;
    } else if (jdTextRaw) {
      jdText = jdTextRaw;
    }

    if (!jdText) {
      return NextResponse.json({ error: "Missing JD text or file" }, { status: 400 });
    }

    try {
      const aiResult = await extractWithGemini(jdText);
      return NextResponse.json({ data: JSON.stringify(aiResult), _source: "gemini" });
    } catch (aiErr: any) {
      // All AI models failed → use regex fallback
      console.warn("[parse-jd] All AI models failed. Using regex fallback.", aiErr.message);
      const fallbackResult = regexExtractJD(jdText);
      return NextResponse.json({
        data: JSON.stringify(fallbackResult),
        _source: "regex_fallback",
        warning: "AI quota exceeded. Used smart regex extraction instead."
      });
    }
  } catch (error: any) {
    console.error("Parse JD Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
