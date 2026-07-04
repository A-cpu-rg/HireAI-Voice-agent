import { assertSameOrigin, json, parseBody, requireUser, withRoute } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { saveConfigSchema } from "@/lib/schemas";

export const GET = withRoute(async () => {
  const user = await requireUser();

  return json({
    hasKey: Boolean(user.apiKey),
    hasAgent: Boolean(user.agentId),
    mode: "live",
    maskedApiKey: user.apiKey ? `${user.apiKey.slice(0, 6)}••••${user.apiKey.slice(-4)}` : "",
    agentId: user.agentId ?? "",
  });
});

export const POST = withRoute(async (req) => {
  assertSameOrigin(req);
  const user = await requireUser();
  const { apiKey, agentId } = await parseBody(req, saveConfigSchema);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      // Preserve the existing key when the field is blank (so the masked value
      // in the UI does not need to round-trip the real secret).
      apiKey: apiKey?.trim() ? apiKey.trim() : user.apiKey,
      agentId: agentId?.trim() ? agentId.trim() : user.agentId,
    },
  });

  return json({ ok: true });
});
