/**
 * Riot API HTTP client with:
 * - Concurrency + minTime rate control (ESM-native)
 * - Two priority lanes: core (search/summoner/league) vs bulk (match history)
 * - 429 Retry-After handling
 * - Exponential backoff with jitter
 * - Timeout via AbortController
 */
import { RiotApiError, RiotErrorCode } from "./errors";

/* ── Dual-lane ESM-native rate limiter ───────────────── */
interface RateLane {
  maxConcurrent: number;
  minTimeMs: number;
  running: number;
  lastRun: number;
  queue: Array<() => void>;
  /** Max pending items in queue — beyond this, new requests are rejected immediately */
  maxQueueDepth?: number;
}

/** Core lane — search, summoner, league, live-game (high priority) */
const _core: RateLane = { maxConcurrent: 6, minTimeMs: 100, running: 0, lastRun: 0, queue: [] };
/** Bulk lane — match IDs + match details (low priority, yields to core) */
const _bulk: RateLane = { maxConcurrent: 4, minTimeMs: 150, running: 0, lastRun: 0, queue: [], maxQueueDepth: 150 };

/** GLOBAL concurrent cap across both lanes (Riot dev key: 20/s) */
const GLOBAL_MAX = 12;
function globalRunning(): number { return _core.running + _bulk.running; }

function drain(lane: RateLane) {
  while (lane.queue.length > 0 && lane.running < lane.maxConcurrent && globalRunning() < GLOBAL_MAX) {
    const next = lane.queue.shift()!;
    next();
  }
}

function drainAll() {
  drain(_core);  // core first
  drain(_bulk);
}

function schedule<T>(fn: () => Promise<T>, lane: RateLane): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    /* Reject immediately if queue is at capacity (prevents cascading buildup under 429s) */
    if (lane.maxQueueDepth != null && lane.queue.length >= lane.maxQueueDepth) {
      reject(new RiotApiError(429, "queue", RiotErrorCode.RATE_LIMITED, "Rate limiter queue full — back-pressure"));
      return;
    }
    const run = () => {
      const now = Date.now();
      const wait = Math.max(0, lane.minTimeMs - (now - lane.lastRun));
      setTimeout(async () => {
        lane.running++;
        lane.lastRun = Date.now();
        try {
          resolve(await fn());
        } catch (e) {
          reject(e);
        } finally {
          lane.running--;
          drainAll();
        }
      }, wait);
    };
    if (lane.running < lane.maxConcurrent && globalRunning() < GLOBAL_MAX) {
      run();
    } else {
      lane.queue.push(run);
    }
  });
}

/**
 * Flush the bulk lane queue — rejects all queued-but-not-started requests.
 * Call when the enrichment timeout fires to prevent orphaned work.
 */
export function flushBulkQueue(): number {
  const count = _bulk.queue.length;
  _bulk.queue.length = 0;
  return count;
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
  /** "core" for search/summoner/league, "bulk" for match history (default: "core") */
  priority?: "core" | "bulk";
}

/** Map non-OK response to a RiotApiError */
function toApiError(res: Response, url: string): RiotApiError {
  if (res.status === 404) {
    return new RiotApiError(404, url, RiotErrorCode.NOT_FOUND, "Resource not found");
  }
  if (res.status === 401 || res.status === 403) {
    return new RiotApiError(res.status, url, RiotErrorCode.KEY_INVALID, "API key invalid or unauthorized");
  }
  return new RiotApiError(res.status, url, RiotErrorCode.UNKNOWN, `Unexpected status ${res.status}`);
}

/** Attempt a single fetch and handle rate-limit / retryable statuses. Returns the response JSON or throws. */
async function attemptFetch<T>(
  url: string,
  apiKey: string,
  timeout: number,
  lane: RateLane,
): Promise<{ ok: true; data: T } | { ok: false; retryMs: number } | { ok: false; error: RiotApiError }> {
  const res = await schedule(() => fetchWithTimeout(url, apiKey, timeout), lane);

  if (res.ok) return { ok: true, data: (await res.json()) as T };

  if (res.status === 429) {
    const ra = Number.parseInt(res.headers.get("Retry-After") ?? "5", 10);
    return { ok: false, retryMs: jitter(ra * 1000) };
  }

  if (res.status === 401 || res.status === 403) {
    return { ok: false, retryMs: jitter(1000) };
  }

  return { ok: false, error: toApiError(res, url) };
}

function selectLane(priority: "core" | "bulk"): RateLane {
  return priority === "bulk" ? _bulk : _core;
}

/** Re-throw RiotApiErrors, track others as lastError. Returns true if should retry. */
function shouldRetry(e: unknown, attempt: number, maxRetries: number, tracker: { lastError: Error | null }): boolean {
  if (e instanceof RiotApiError) throw e;
  tracker.lastError = e as Error;
  return attempt < maxRetries;
}

export async function riotFetch<T>(
  url: string,
  options: RiotFetchOptions = {},
): Promise<T> {
  const { maxRetries = 3, timeout = 10_000, priority = "core" } = options;
  const lane = selectLane(priority);
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new RiotApiError(401, url, RiotErrorCode.KEY_INVALID, "RIOT_API_KEY is not configured");
  }

  const tracker = { lastError: null as Error | null };

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await attemptFetch<T>(url, apiKey, timeout, lane);

      if (result.ok) return result.data;
      if ("error" in result) throw result.error;

      if (attempt >= maxRetries) {
        throw new RiotApiError(429, url, RiotErrorCode.RATE_LIMITED, "Rate limited — max retries exhausted");
      }
      await sleep(result.retryMs);
    } catch (e) {
      if (!shouldRetry(e, attempt, maxRetries, tracker)) break;
      await sleep(jitter(1000 * 2 ** attempt));
    }
  }

  throw new RiotApiError(0, url, RiotErrorCode.NETWORK_ERROR, tracker.lastError?.message ?? "Network error");
}
