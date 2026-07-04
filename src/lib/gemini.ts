import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/env";
import { logger } from "./logger";

/**
 * Thin wrapper around Google Gemini that returns parsed JSON and transparently
 * falls back across a list of models when one is rate-limited or unavailable.
 * Callers should catch and use their own deterministic fallback so the product
 * degrades gracefully when the AI is unconfigured or exhausted.
 */
const MODELS = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.0-flash-lite"];

export function isGeminiConfigured(): boolean {
  return Boolean(env.GOOGLE_AI_API_KEY);
}

function extractJson(raw: string): unknown {
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : cleaned);
}

function isRetryable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const status = (error as { status?: number })?.status;
  return status === 429 || status === 404 || /429|404|quota|not found|unavailable/i.test(message);
}

/**
 * Run a prompt and parse the model's JSON response. Throws if Gemini is not
 * configured or every model fails.
 */
export async function generateJson<T = unknown>(prompt: string): Promise<T> {
  if (!env.GOOGLE_AI_API_KEY) {
    throw new Error("Gemini is not configured (GOOGLE_AI_API_KEY unset).");
  }

  const client = new GoogleGenerativeAI(env.GOOGLE_AI_API_KEY);

  for (const modelName of MODELS) {
    try {
      const model = client.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return extractJson(result.response.text()) as T;
    } catch (error) {
      if (isRetryable(error)) {
        logger.warn("Gemini model unavailable, trying next", { model: modelName });
        continue;
      }
      throw error;
    }
  }

  throw new Error("All Gemini models were exhausted.");
}
