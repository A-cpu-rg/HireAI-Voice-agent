import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "hireai_session";
const SESSION_SECRET = process.env.AUTH_SECRET;
const PUBLIC_PATHS = ["/login", "/verify-email"];

// Static assets that live under /public and should bypass the auth gate.
const STATIC_ASSET = /\.(?:png|jpe?g|gif|svg|ico|webp|avif|css|js|map|txt|woff2?|ttf)$/i;

if (!SESSION_SECRET) {
  // Fail closed: without a secret every signature check is meaningless.
  throw new Error("AUTH_SECRET is not set. Refusing to run the auth middleware.");
}

async function sign(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  const parts = token.split(".");
  if (parts.length !== 4) return false;

  const [userId, expiresAtRaw, nonce, signature] = parts;
  if (!userId || !expiresAtRaw || !nonce || !signature) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt * 1000 < Date.now()) return false;

  const expected = await sign(`${userId}.${expiresAtRaw}.${nonce}`);
  return constantTimeEqual(signature, expected);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/_next") || pathname === "/favicon.ico" || STATIC_ASSET.test(pathname)) {
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
