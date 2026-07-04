import { ApiError, json, withRoute } from "@/lib/api";
import { logger } from "@/lib/logger";
import { verifyBolnaWebhook } from "@/lib/webhook";
import { BolnaService } from "@/services/bolna.service";

/**
 * Public webhook Bolna calls when a screening call finishes.
 *
 * The raw body is read first so its HMAC signature can be verified before we
 * trust anything in it. When `BOLNA_WEBHOOK_SECRET` is configured, an invalid
 * or missing signature is rejected with 401; otherwise the request is processed
 * with a loud warning (see verifyBolnaWebhook).
 */
export const POST = withRoute(async (req) => {
  const rawBody = await req.text();

  const verification = verifyBolnaWebhook({
    rawBody,
    headers: req.headers,
    url: req.url,
  });

  if (!verification.ok) {
    logger.warn("Rejected unverified Bolna webhook", { reason: verification.reason });
    throw ApiError.unauthorized("Invalid webhook signature.");
  }

  if (verification.mode === "unverified") {
    logger.warn(
      "Bolna webhook processed without verification. Set BOLNA_WEBHOOK_SECRET to secure this endpoint."
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw ApiError.badRequest("Webhook body must be valid JSON.");
  }

  // Unexpected errors propagate to withRoute → 500, so Bolna retries and we see
  // the failure. Known no-ops (unknown call id) return 200 to stop retries.
  const result = await BolnaService.processWebhook(payload as never);
  return json({ ok: result.status !== "ignored", ...result });
});
