import { z } from "zod";

/**
 * Centralised, validated environment access.
 *
 * Import `env` instead of reading `process.env` directly so that:
 *  - required secrets fail closed at boot with a clear message (no silent
 *    insecure fallbacks),
 *  - values are correctly typed everywhere they are used.
 *
 * Build/CI steps that do not have real secrets can set `SKIP_ENV_VALIDATION=1`
 * to bypass parsing (the values are then typed but not checked).
 *
 * NOTE: this module reads server-only variables and must not be imported from
 * Edge runtime code (e.g. `middleware.ts`). The middleware validates the single
 * variable it needs (`AUTH_SECRET`) inline.
 */
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection URL"),

  /** Secret used to sign session cookies. No fallback — must be set. */
  AUTH_SECRET: z
    .string()
    .min(16, "AUTH_SECRET must be at least 16 characters. Generate one with: openssl rand -hex 48"),

  /** Public base URL used to build links in emails. */
  APP_URL: z.string().url().default("http://localhost:3000"),

  /** Transactional email (Resend). Optional in dev; verification links are logged instead. */
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  /** Google Gemini key for resume/JD parsing. Optional; parsing falls back to heuristics. */
  GOOGLE_AI_API_KEY: z.string().optional(),

  /**
   * Shared secret Bolna signs webhooks with. When set, inbound webhooks must
   * carry a valid signature or they are rejected. Strongly recommended in prod.
   */
  BOLNA_WEBHOOK_SECRET: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

function loadEnv(): ServerEnv {
  if (process.env.SKIP_ENV_VALIDATION) {
    return process.env as unknown as ServerEnv;
  }

  const parsed = serverSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment variables:\n${issues}\n\nSee .env.example for the expected configuration.`
    );
  }

  return parsed.data;
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
