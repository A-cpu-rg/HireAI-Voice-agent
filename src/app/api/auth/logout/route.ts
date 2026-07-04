import { assertSameOrigin, json, withRoute } from "@/lib/api";
import { logoutUser } from "@/lib/auth";

export const POST = withRoute(async (req) => {
  assertSameOrigin(req);
  await logoutUser();
  return json({ ok: true });
});
