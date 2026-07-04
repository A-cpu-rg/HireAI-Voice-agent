import { ApiError, getClientIp, json, requireUser, withRoute } from "@/lib/api";
import { extractDocumentText, FileTooLargeError } from "@/lib/pdf";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { parseJobDescription } from "@/services/parsing.service";

export const POST = withRoute(async (req) => {
  const user = await requireUser();
  enforceRateLimit(`parse-jd:${user.id}:${getClientIp(req)}`, RATE_LIMITS.parsing);

  const formData = await req.formData();
  const file = formData.get("file");
  const jdTextRaw = formData.get("jd");

  let jdText = "";
  try {
    if (file instanceof File) {
      jdText = await extractDocumentText(file);
    } else if (typeof jdTextRaw === "string") {
      jdText = jdTextRaw.trim();
    }
  } catch (error) {
    if (error instanceof FileTooLargeError) throw ApiError.badRequest(error.message);
    throw error;
  }

  if (!jdText) {
    throw ApiError.badRequest("Provide a job description file or text.");
  }

  const parsed = await parseJobDescription(jdText);
  return json({ data: JSON.stringify(parsed), source: parsed.source });
});
