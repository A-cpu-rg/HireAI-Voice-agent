import { ApiError, getClientIp, json, requireUser, withRoute } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { extractDocumentText, FileTooLargeError } from "@/lib/pdf";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { parseResume } from "@/services/parsing.service";
import { detectFraud } from "@/services/fraud-detection";
import { parseJsonArray } from "@/lib/serializers";

export const POST = withRoute(async (req) => {
  const user = await requireUser();
  enforceRateLimit(`parse-resume:${user.id}:${getClientIp(req)}`, RATE_LIMITS.parsing);

  const formData = await req.formData();
  const file = formData.get("file");
  const jobId = formData.get("jobId");

  if (!(file instanceof File)) {
    throw ApiError.badRequest("No file uploaded.");
  }

  let text = "";
  try {
    text = await extractDocumentText(file);
  } catch (error) {
    if (error instanceof FileTooLargeError) throw ApiError.badRequest(error.message);
    throw error;
  }

  if (text.length < 50) {
    throw ApiError.badRequest("Could not read enough text from this file. Try another export.");
  }

  // Job context is only used when the job belongs to the caller (IDOR guard).
  let jobSkills: string[] = [];
  let jobTitle: string | undefined;
  if (typeof jobId === "string" && jobId) {
    const job = await prisma.job.findFirst({
      where: { id: jobId, userId: user.id },
      select: { title: true, skills: true },
    });
    if (job) {
      jobTitle = job.title;
      jobSkills = parseJsonArray(job.skills);
    }
  }

  const parsed = await parseResume({ text, jobSkills, jobTitle });
  const fraud = detectFraud({
    resumeText: text,
    email: parsed.email,
    experience: parsed.experience,
  });

  return json({ success: true, parsed, fraud });
});
