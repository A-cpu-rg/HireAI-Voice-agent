import { assertSameOrigin, json, parseBody, requireUser, withRoute } from "@/lib/api";
import { fetchWithTimeout } from "@/lib/http";
import { logger } from "@/lib/logger";
import { testConfigSchema } from "@/lib/schemas";

export const POST = withRoute(async (req) => {
  assertSameOrigin(req);
  await requireUser();
  const { apiKey, agentId } = await parseBody(req, testConfigSchema);

  // agentId is path-encoded so it cannot break out of the fixed host.
  const res = await fetchWithTimeout(
    `https://api.bolna.ai/v2/agent/${encodeURIComponent(agentId)}`,
    { headers: { Authorization: `Bearer ${apiKey}` }, timeoutMs: 10_000 }
  );

  if (!res.ok) {
    logger.warn("Bolna credential test failed", { status: res.status });
    return json(
      { ok: false, error: "Could not verify these credentials with Bolna." },
      { status: 400 }
    );
  }

  return json({ ok: true });
});
