import { getSessionUser } from "@/lib/auth";
import { json } from "@/lib/api";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return json({ authenticated: false }, { status: 401 });
  }

  return json({
    authenticated: true,
    user: { id: user.id, email: user.email, name: user.name },
  });
}
