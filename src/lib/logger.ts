/**
 * Minimal structured logger.
 *
 * Emits single-line JSON in production (parseable by log drains) and a compact
 * human-readable line in development. Use this instead of raw `console.*` so
 * that log output is consistent and greppable, and so PII/secret redaction can
 * be centralised here later.
 */
type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const isProd = process.env.NODE_ENV === "production";
const minLevel: LogLevel = isProd ? "info" : "debug";

function serializeError(value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  return value;
}

function write(level: LogLevel, message: string, context?: LogContext) {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[minLevel]) return;

  const normalizedContext = context
    ? Object.fromEntries(
        Object.entries(context).map(([key, value]) => [key, serializeError(value)])
      )
    : undefined;

  if (isProd) {
    const payload = {
      level,
      time: new Date().toISOString(),
      message,
      ...normalizedContext,
    };
    const line = JSON.stringify(payload);
    if (level === "error" || level === "warn") console.error(line);
    else console.log(line);
    return;
  }

  const prefix = `[${level.toUpperCase()}]`;
  if (level === "error" || level === "warn") {
    console.error(prefix, message, normalizedContext ?? "");
  } else {
    console.log(prefix, message, normalizedContext ?? "");
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => write("debug", message, context),
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  error: (message: string, context?: LogContext) => write("error", message, context),
};
