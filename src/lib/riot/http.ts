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
}

/** Core lane — search, summoner, league, live-game (high priority) */
const _core: RateLane = { maxConcurrent: 5, minTimeMs: 100, running: 0, lastRun: 0, queue: [] };
/** Bulk lane — match IDs + match details (low priority, yields to core) */
const _bulk: RateLane = { maxConcurrent: 2, minTimeMs: 200, running: 0, lastRun: 0, queue: [] };

/** GLOBAL concurrent cap across both lanes (Riot dev key: 20/s) */
const GLOBAL_MAX = 8;
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

export async function riotFetch<T>(
  url: string,
  options: RiotFetchOptions = {},
): Promise<T> {
  const { maxRetries = 3, timeout = 10_000, priority = "core" } = options;
  const lane = priority === "bulk" ? _bulk : _core;
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
      lane);

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
