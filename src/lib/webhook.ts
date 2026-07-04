import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/env";

function constantTimeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  try {
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export function computeHmac(rawBody: string, secret: string): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

export type WebhookVerification =
  { ok: true; mode: "signature" | "token" | "unverified" } | { ok: false; reason: string };

/**
 * Verify an inbound Bolna webhook.
 *
 * Two mechanisms are accepted so the integration can be secured without
 * depending on Bolna's exact signing implementation:
 *  1. HMAC signature: `sha256=<hex>` in a signature header over the raw body.
 *  2. Shared-secret token: `?token=<secret>` in the webhook URL, or the
 *     `x-webhook-token` header. (Configure the token in Bolna's webhook URL.)
 *
 * When `BOLNA_WEBHOOK_SECRET` is not set, verification is skipped and the caller
 * should log a warning — this keeps existing deployments working, but leaves the
 * endpoint open. Setting the secret is strongly recommended in production.
 */
export function verifyBolnaWebhook(params: {
  rawBody: string;
  headers: Headers;
  url: string;
}): WebhookVerification {
  const secret = env.BOLNA_WEBHOOK_SECRET;
  if (!secret) return { ok: true, mode: "unverified" };

  // 1. Shared-secret token (URL query or header).
  const urlToken = new URL(params.url).searchParams.get("token");
  const headerToken = params.headers.get("x-webhook-token");
  const token = urlToken ?? headerToken;
  if (token && constantTimeEqual(token, secret)) {
    return { ok: true, mode: "token" };
  }

  // 2. HMAC signature.
  const rawSignature =
    params.headers.get("x-bolna-signature") ??
    params.headers.get("webhook-signature") ??
    params.headers.get("x-webhook-signature");
  if (rawSignature) {
    const provided = rawSignature.replace(/^sha256=/i, "").trim();
    const expected = computeHmac(params.rawBody, secret);
    if (constantTimeEqual(provided, expected)) {
      return { ok: true, mode: "signature" };
    }
    return { ok: false, reason: "signature_mismatch" };
  }

  return { ok: false, reason: "missing_signature" };
}
