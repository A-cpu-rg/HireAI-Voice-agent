import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login"];
const PUBLIC_API_PATHS = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
];

export function middleware(req: NextRequest) {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;
  const session = req.cookies.get("hireai_session")?.value;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.includes(pathname) || PUBLIC_API_PATHS.includes(pathname)) {
    if (pathname === "/login" && session) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
