import { describe, it, expect } from "vitest";
import { verifyBolnaWebhook, computeHmac } from "./webhook";

// vitest.config sets BOLNA_WEBHOOK_SECRET = "test-webhook-secret".
const SECRET = "test-webhook-secret";
const BODY = JSON.stringify({ call_id: "abc", data: {} });

function headers(init: Record<string, string> = {}) {
  return new Headers(init);
}

describe("verifyBolnaWebhook", () => {
  it("accepts a valid shared-secret token in the URL", () => {
    const result = verifyBolnaWebhook({
      rawBody: BODY,
      headers: headers(),
      url: `https://app.test/api/bolna/webhook?token=${SECRET}`,
    });
    expect(result).toEqual({ ok: true, mode: "token" });
  });

  it("accepts a valid shared-secret token in a header", () => {
    const result = verifyBolnaWebhook({
      rawBody: BODY,
      headers: headers({ "x-webhook-token": SECRET }),
      url: "https://app.test/api/bolna/webhook",
    });
    expect(result.ok).toBe(true);
  });

  it("accepts a valid HMAC signature", () => {
    const signature = computeHmac(BODY, SECRET);
    const result = verifyBolnaWebhook({
      rawBody: BODY,
      headers: headers({ "x-bolna-signature": `sha256=${signature}` }),
      url: "https://app.test/api/bolna/webhook",
    });
    expect(result).toEqual({ ok: true, mode: "signature" });
  });

  it("rejects a forged signature", () => {
    const result = verifyBolnaWebhook({
      rawBody: BODY,
      headers: headers({ "x-bolna-signature": "sha256=deadbeef" }),
      url: "https://app.test/api/bolna/webhook",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a request with no signature or token", () => {
    const result = verifyBolnaWebhook({
      rawBody: BODY,
      headers: headers(),
      url: "https://app.test/api/bolna/webhook",
    });
    expect(result).toEqual({ ok: false, reason: "missing_signature" });
  });

  it("rejects a signature computed over a different body", () => {
    const signature = computeHmac("different body", SECRET);
    const result = verifyBolnaWebhook({
      rawBody: BODY,
      headers: headers({ "webhook-signature": signature }),
      url: "https://app.test/api/bolna/webhook",
    });
    expect(result.ok).toBe(false);
  });
});
