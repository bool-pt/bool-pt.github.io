import { ApiError } from './errors';

export interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 1_000;

// 5xx is deliberately not retryable: the Lambdas validate the single-use
// Turnstile token before anything else, so replaying the same body after a
// 5xx (which the token already paid for) can only produce a 403.
function isRetryable(status: number): boolean {
  return status === 429;
}

export async function apiFetch<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const {
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    ...rest
  } = options;

  const init: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...rest.headers,
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  };

  let lastError!: ApiError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      let res: Response;
      try {
        res = await fetch(url, { ...init, signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!res.ok) {
        const errorBody: unknown = await res.json().catch(() => null);
        throw new ApiError(res.status, errorBody);
      }

      return res.json() as Promise<T>;
    } catch (err) {
      if (err instanceof ApiError) {
        lastError = err;
        if (isRetryable(err.status) && attempt < retries) {
          await new Promise((r) => setTimeout(r, retryDelayMs * 2 ** attempt));
          continue;
        }
        throw err;
      }

      // Network error or timeout
      const isTimeout = err instanceof DOMException && err.name === 'AbortError';
      lastError = new ApiError(
        0,
        null,
        isTimeout ? `Request timed out after ${timeoutMs}ms` : 'Network error'
      );

      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, retryDelayMs * 2 ** attempt));
        continue;
      }
    }
  }

  throw lastError;
}
