/**
 * Riot API HTTP client with:
 * - Concurrency + minTime rate control (ESM-native)
 * - 429 Retry-After handling
 * - Exponential backoff with jitter
 * - Timeout via AbortController
 */
import { RiotApiError, RiotErrorCode } from "./errors";

/* ── Simple ESM-native rate limiter ──────────────────── */
const MAX_CONCURRENT = 5;
const MIN_TIME_MS = 100;
let _running = 0;
let _lastRun = 0;
const _queue: Array<() => void> = [];

function drain() {
  while (_queue.length > 0 && _running < MAX_CONCURRENT) {
    const next = _queue.shift()!;
    next();
  }
}

function schedule<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      const now = Date.now();
      const wait = Math.max(0, MIN_TIME_MS - (now - _lastRun));
      setTimeout(async () => {
        _running++;
        _lastRun = Date.now();
        try {
          resolve(await fn());
        } catch (e) {
          reject(e);
        } finally {
          _running--;
          drain();
        }
      }, wait);
    };
    if (_running < MAX_CONCURRENT) {
      run();
    } else {
      _queue.push(run);
    }
  });
}

/* ── Helpers ──────────────────────────────────────────── */
function getApiKey(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (import.meta as any).env?.RIOT_API_KEY ?? process.env.RIOT_API_KEY ?? "";
  } catch {
    return "";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function jitter(base: number): number {
  return base + Math.random() * base * 0.5;
}

async function fetchWithTimeout(
  url: string,
  apiKey: string,
  timeout: number,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    return await fetch(url, {
      headers: { "X-Riot-Token": apiKey },
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/* ── Public fetch ────────────────────────────────────── */
export interface RiotFetchOptions {
  maxRetries?: number;
  timeout?: number;
}

export async function riotFetch<T>(
  url: string,
  options: RiotFetchOptions = {},
): Promise<T> {
  const { maxRetries = 3, timeout = 10_000 } = options;
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new RiotApiError(
      401,
      url,
      RiotErrorCode.KEY_INVALID,
      "RIOT_API_KEY is not configured",
    );
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await schedule(() =>
        fetchWithTimeout(url, apiKey, timeout),
      );

      if (res.ok) {
        return (await res.json()) as T;
      }

      /* 429 — Rate limited */
      if (res.status === 429) {
        const ra = parseInt(res.headers.get("Retry-After") ?? "5", 10);
        if (attempt < maxRetries) {
          await sleep(jitter(ra * 1000));
          continue;
        }
        throw new RiotApiError(
          429,
          url,
          RiotErrorCode.RATE_LIMITED,
          `Rate limited — retry after ${ra}s`,
        );
      }

      /* 404 */
      if (res.status === 404) {
        throw new RiotApiError(
          404,
          url,
          RiotErrorCode.NOT_FOUND,
          "Resource not found",
        );
      }

      /* 401 / 403 — retry once in case of spurious error */
      if (res.status === 401 || res.status === 403) {
        if (attempt < maxRetries) {
          await sleep(jitter(1000));
          continue;
        }
        throw new RiotApiError(
          res.status,
          url,
          RiotErrorCode.KEY_INVALID,
          "API key invalid or unauthorized",
        );
      }

      throw new RiotApiError(
        res.status,
        url,
        RiotErrorCode.UNKNOWN,
        `Unexpected status ${res.status}`,
      );
    } catch (e) {
      if (e instanceof RiotApiError) throw e;
      lastError = e as Error;
      if (attempt < maxRetries) {
        await sleep(jitter(1000 * 2 ** attempt));
        continue;
      }
    }
  }

  throw new RiotApiError(
    0,
    url,
    RiotErrorCode.NETWORK_ERROR,
    lastError?.message ?? "Network error",
  );
}
