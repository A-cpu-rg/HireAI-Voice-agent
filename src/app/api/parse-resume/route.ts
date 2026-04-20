import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';

// Fallback pure regex parser for cost-saving mode and Gemini failures
function regexFallback(text: string) {
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  const email = emailMatch ? emailMatch[1] : "";

  const phoneMatch = text.match(/(\+?\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,4})/);
  const phone = phoneMatch ? phoneMatch[1].trim() : "+1234567890"; 

  const expMatch = text.match(/(\d+)\+?\s*(years?|yrs?)/i);
  const experience = expMatch ? parseInt(expMatch[1], 10) : 0;

  // Extract first substantial line as name
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2 && !l.startsWith('http') && !l.includes('@'));
  const name = lines.length > 0 ? lines[0] : "Extracted Candidate";

  // Skills detection - improved matching
  const allSkills = ["React", "Node.js", "Python", "AWS", "Docker", "TypeScript", "Next.js", "SQL", "PostgreSQL", "Express", "Prisma", "MySQL", "MongoDB", "HTML", "CSS", "JavaScript", "Git", "GitHub"];
  const extractedSkills = allSkills.filter(skill => {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(text);
  });

  return { 
    name: name.substring(0, 100), 
    email, 
    phone, 
    experience, 
    skills: extractedSkills.length > 0 ? extractedSkills : ["General"], 
    matchScore: 0 
  };
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const jobId = formData.get('jobId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let pdfText = "";

    // Try to extract text from PDF
    if (file.name.toLowerCase().endsWith('.pdf')) {
      try {
        // Use dynamic import for pdf-parse
        const pdfParse = (await import('pdf-parse')).default;
        const parsed = await pdfParse(buffer);
        pdfText = parsed.text || "";
        console.log("PDF parsed successfully, text length:", pdfText.length);
      } catch (parseError: any) {
        console.warn("PDF parsing failed, attempting text extraction:", parseError.message);
        // Fallback: try to extract as text
        pdfText = buffer.toString('utf-8');
        // Clean up PDF binary artifacts
        pdfText = pdfText.replace(/[^\x20-\x7E\n\r]/g, '');
      }
    } else {
      pdfText = buffer.toString('utf-8');
    }

    // Clean and validate text
    pdfText = pdfText.trim();
    if (!pdfText || pdfText.length < 50) {
      console.warn("Insufficient text extracted from file");
      return NextResponse.json({ 
        success: true, 
        parsed: regexFallback(pdfText), 
        usingFallback: true,
        warning: 'Insufficient text extracted from file'
      });
    }

    // Use regex fallback if no API key or text is short
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.log("No API key found, using regex fallback");
      return NextResponse.json({ 
        success: true, 
        parsed: regexFallback(pdfText), 
        usingFallback: true,
        warning: 'No API key configured'
      });
    }

    // Get job context if needed
    let jobContext = "";
    if (jobId) {
      try {
        const job = await prisma.job.findUnique({ where: { id: jobId } });
        if (job) {
          jobContext = `Job: ${job.title}. Requirements: ${job.skills}`;
        }
      } catch (jobError) {
        console.warn("Could not fetch job context");
      }
    }

    // Try Gemini API
    try {
      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `Extract candidate info from this resume. Return ONLY valid JSON (no markdown, no extra text).

${jobContext}

JSON format:
{"name":"","email":"","phone":"","skills":[],"experience":0,"matchScore":0}

Resume:
${pdfText.substring(0, 2000)}`;

      const result = await model.generateContent(prompt);
      let responseText = result.response.text().trim();
      
      // Extract JSON from response
      responseText = responseText.replace(/```json/gi, "").replace(/```/gi, "").trim();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : responseText;

      const parsed = JSON.parse(jsonStr);

      return NextResponse.json({
        success: true,
        parsed: {
          name: (parsed.name || "Unknown").substring(0, 100).trim(),
          email: (parsed.email || "").trim(),
          phone: (parsed.phone || "").trim(),
          experience: Math.max(0, Number(parsed.experience) || 0),
          skills: Array.isArray(parsed.skills) && parsed.skills.length > 0 
            ? parsed.skills.slice(0, 10).map((s: any) => String(s).trim())
            : ["General"],
          matchScore: Number(parsed.matchScore) || 0
        }
      });
    } catch (aiError: any) {
      console.warn("AI parsing failed, using regex fallback:", aiError.message);
      return NextResponse.json({ 
        success: true, 
        parsed: regexFallback(pdfText), 
        usingFallback: true,
        warning: 'Using regex extraction due to AI service unavailable'
      });
    }
  } catch (error: any) {
    console.error("Parse Resume Error:", error.message);
    return NextResponse.json({ 
      success: true,
      parsed: { name: "", email: "", phone: "", experience: 0, skills: ["General"], matchScore: 0 },
      warning: 'Error during parsing, please fill details manually'
    });
  }
}
