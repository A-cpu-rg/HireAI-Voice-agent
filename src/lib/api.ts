import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";
import { getSessionUser } from "./auth";
import { logger } from "./logger";
import { isProduction } from "@/env";

/**
 * Typed HTTP error. Throw this from a route (or any helper it calls) and the
 * `withRoute` wrapper turns it into a consistent JSON response. This keeps
 * routes free of repetitive try/catch + status plumbing.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message, "UNAUTHORIZED");
  }
  static forbidden(message = "Forbidden") {
    return new ApiError(403, message, "FORBIDDEN");
  }
  static notFound(message = "Not found") {
    return new ApiError(404, message, "NOT_FOUND");
  }
  static badRequest(message = "Bad request", details?: unknown) {
    return new ApiError(400, message, "BAD_REQUEST", details);
  }
  static conflict(message = "Already exists") {
    return new ApiError(409, message, "CONFLICT");
  }
  static tooManyRequests(message = "Too many requests") {
    return new ApiError(429, message, "RATE_LIMITED");
  }
}

type RouteContext = { params: Promise<Record<string, string>> };
type RouteHandler = (req: Request, ctx: RouteContext) => Promise<Response> | Response;

/**
 * Wrap a route handler so thrown errors become well-formed JSON responses and
 * are logged once, centrally. Unexpected errors never leak internals to the
 * client in production.
 */
export function withRoute(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      return toErrorResponse(error, req);
    }
  };
}

function toErrorResponse(error: unknown, req: Request): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code, details: error.details },
      { status: error.status }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: error.flatten(),
      },
      { status: 400 }
    );
  }

  // Prisma unique-constraint violation → 409.
  if (isPrismaKnownError(error) && error.code === "P2002") {
    return NextResponse.json(
      { error: "A record with these details already exists.", code: "CONFLICT" },
      { status: 409 }
    );
  }

  logger.error("Unhandled route error", {
    error,
    method: req.method,
    url: req.url,
  });

  return NextResponse.json(
    {
      error: isProduction
        ? "An internal error occurred."
        : String((error as Error)?.message ?? error),
      code: "INTERNAL_ERROR",
    },
    { status: 500 }
  );
}

function isPrismaKnownError(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  );
}

/** Resolve the authenticated user or throw 401. */
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) throw ApiError.unauthorized();
  return user;
}

/** Parse + validate a JSON body against a Zod schema. Throws 400 on mismatch. */
export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw ApiError.badRequest("Request body must be valid JSON.");
  }
  return schema.parse(raw);
}

/** Parse + validate URL search params against a Zod schema. */
export function parseQuery<T>(req: Request, schema: ZodSchema<T>): T {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  return schema.parse(params);
}

/**
 * CSRF defence for cookie-authenticated mutations: reject cross-site requests
 * by requiring the Origin (or Referer) to match the request host. Same-origin
 * fetches from our own UI always pass.
 */
export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin") ?? req.headers.get("referer");
  if (!origin) return; // non-browser client (e.g. server-to-server) — allowed
  try {
    const originHost = new URL(origin).host;
    const targetHost = new URL(req.url).host;
    if (originHost !== targetHost) {
      throw ApiError.forbidden("Cross-origin request rejected.");
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.forbidden("Invalid request origin.");
  }
}

/** Best-effort client IP for rate limiting. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}
