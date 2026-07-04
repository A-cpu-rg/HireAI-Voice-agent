/**
 * `fetch` wrappers that add timeouts and (optionally) bounded retries with
 * backoff. External calls without a timeout can hang a request indefinitely;
 * every outbound call in this app should go through here.
 */
export interface FetchWithTimeoutOptions extends RequestInit {
  /** Abort the request after this many milliseconds. Default 15s. */
  timeoutMs?: number;
}

export async function fetchWithTimeout(
  url: string,
  { timeoutMs = 15_000, ...init }: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export interface RetryOptions extends FetchWithTimeoutOptions {
  /** Number of attempts (including the first). Default 3. */
  retries?: number;
  /** Base backoff in ms; doubled each attempt. Default 300. */
  backoffMs?: number;
}

/** Retries on network errors and 5xx/429 responses with exponential backoff. */
export async function fetchWithRetry(
  url: string,
  { retries = 3, backoffMs = 300, ...options }: RetryOptions = {}
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);
      if (response.status < 500 && response.status !== 429) return response;
      lastError = new Error(`Upstream responded ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, backoffMs * 2 ** (attempt - 1)));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Request to ${url} failed`);
}
