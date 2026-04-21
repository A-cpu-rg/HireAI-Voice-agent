import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "hireai_session";
const SESSION_SECRET = process.env.AUTH_SECRET || "dev-hireai-session-secret";
const PUBLIC_PATHS = ["/login"];

async function hashValue(value: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hasValidSession(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [userId, nonce, signature] = parts;
  if (!userId || !nonce || !signature) return false;

  const expectedSignature = await hashValue(`${userId}.${nonce}`);
  return signature === expectedSignature;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const hasSession = await hasValidSession(req);

  if (PUBLIC_PATHS.includes(pathname)) {
    if (pathname === "/login" && hasSession) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const res = NextResponse.next();
    if (req.cookies.get(SESSION_COOKIE)?.value && !hasSession) {
      res.cookies.delete(SESSION_COOKIE);
    }
    return res;
  }

  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
