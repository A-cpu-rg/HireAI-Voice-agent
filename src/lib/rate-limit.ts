import { ApiError } from "./api";

/**
 * In-memory sliding-window rate limiter.
 *
 * Suitable for a single instance / low-to-moderate scale. For a horizontally
 * scaled deployment, back this with Redis (e.g. Upstash) — the call sites and
 * `enforceRateLimit` signature stay identical, only the store changes.
 */
type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export interface RateLimitConfig {
  /** Max requests allowed within the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: config.limit - 1, resetAt };
  }

  if (existing.count >= config.limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { success: true, remaining: config.limit - existing.count, resetAt: existing.resetAt };
}

/** Throw a 429 `ApiError` when the caller is over the limit. */
export function enforceRateLimit(key: string, config: RateLimitConfig) {
  const result = rateLimit(key, config);
  if (!result.success) {
    const retryAfter = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
    throw new ApiError(429, `Too many requests. Try again in ${retryAfter}s.`, "RATE_LIMITED", {
      retryAfter,
    });
  }
  return result;
}

// Common presets.
export const RATE_LIMITS = {
  auth: { limit: 10, windowMs: 60_000 }, // 10/min — login, signup
  email: { limit: 3, windowMs: 60_000 }, // 3/min — resend verification
  parsing: { limit: 20, windowMs: 60_000 }, // 20/min — resume/JD parsing
  calls: { limit: 30, windowMs: 60_000 }, // 30/min — outbound calls
} as const;

// Periodically drop expired buckets so the map does not grow unbounded.
if (typeof setInterval !== "undefined") {
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of store.entries()) {
      if (bucket.resetAt <= now) store.delete(key);
    }
  }, 60_000);
  // Do not keep the process alive solely for cleanup.
  if (typeof interval === "object" && "unref" in interval) interval.unref();
}
