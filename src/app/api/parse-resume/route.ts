import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function toArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function parseExperience(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  if (typeof value === "string") {
    const match = value.match(/\d+(\.\d+)?/);
    if (match) {
      return Math.max(0, Math.round(Number(match[0])));
    }
  }

  return 0;
}

function normalizeResumeData(payload: any) {
  const source = payload?.parsed || payload?.data || payload?.result || payload || {};
  const contact = source?.contact || {};
  const derived = source?.derived || {};

  const name = firstString(
    source.name,
    source.full_name,
    source.candidate_name,
    source.personal_details?.name
  );

  const email = firstString(
    source.email,
    contact.email,
    source.personal_details?.email,
    source.contact?.email
  );

  const phone = firstString(
    source.phone,
    contact.phone,
    source.mobile,
    source.phone_number,
    source.personal_details?.phone,
    source.contact?.phone
  );

  const location = firstString(
    source.location,
    [contact.location_city, contact.location_state, contact.location_country].filter(Boolean).join(", "),
    contact.location,
    source.city,
    source.personal_details?.location,
    source.contact?.location
  );

  const role = firstString(
    source.role,
    source.title,
    source.job_title,
    source.designation,
    source.current_title,
    source.summary?.title
  );

  const skills = toArray(
    source.skills ||
      source.key_skills ||
      source.technical_skills ||
      source.summary?.skills
  );

  const experience = parseExperience(
    derived.years_of_experience ||
    source.experience ||
      source.total_experience ||
      source.years_of_experience ||
      source.summary?.experience
  );

  return {
    name,
    email,
    phone,
    location,
    role,
    skills,
    experience,
    raw: payload,
  };
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.RESUME_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "RESUME_API_KEY is not configured." }, { status: 500 });
    }

    const incomingFormData = await req.formData();
    const file = incomingFormData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    const outgoingFormData = new FormData();
    outgoingFormData.append("file", file, file.name);

    const apiRes = await fetch("https://resumeparser.app/resume/parse", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: outgoingFormData,
    });

    const responseText = await apiRes.text();
    let parsedResponse: any;

    try {
      parsedResponse = responseText ? JSON.parse(responseText) : {};
    } catch {
      parsedResponse = { raw: responseText };
    }

    if (!apiRes.ok) {
      return NextResponse.json(
        { error: parsedResponse?.error || parsedResponse?.message || "Resume parsing failed." },
        { status: apiRes.status }
      );
    }

    return NextResponse.json({
      ok: true,
      parsed: normalizeResumeData(parsedResponse),
    });
  } catch (error: any) {
    console.error("Parse resume error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse resume." }, { status: 500 });
  }
}
