import { LRUCache } from "lru-cache";

/* eslint-disable @typescript-eslint/no-empty-object-type */
const caches = new Map<string, LRUCache<string, {}>>();

function getOrCreateCache(
  namespace: string,
  ttl: number,
): LRUCache<string, {}> {
  const existing = caches.get(namespace);
  if (existing) return existing;
  const cache = new LRUCache<string, {}>({ max: 500, ttl });
  caches.set(namespace, cache);
  return cache;
}

/* ── TTL constants (ms) ─────────────────────────────── */
export const TTL = {
  RIOT_ID: 24 * 60 * 60 * 1000, // 24 h
  SUMMONER: 24 * 60 * 60 * 1000, // 24 h
  LEAGUE: 30 * 60 * 1000, // 30 min
  MASTERY: 30 * 60 * 1000, // 30 min
  LIVE_GAME: 10 * 1000, // 10 s
  DDRAGON: 24 * 60 * 60 * 1000, // 24 h
  MATCHES: 15 * 60 * 1000, // 15 min
} as const;

/* ── Public helpers ──────────────────────────────────── */
export function getCached<T>(
  namespace: string,
  key: string,
  ttl: number,
): T | undefined {
  const cache = getOrCreateCache(namespace, ttl);
  return cache.get(key) as T | undefined;
}

export function setCached<T>(
  namespace: string,
  key: string,
  value: T,
  ttl: number,
): void {
  const cache = getOrCreateCache(namespace, ttl);
  cache.set(key, value as {}, { ttl });
}

export function clearNamespace(namespace: string): void {
  const cache = caches.get(namespace);
  if (cache) cache.clear();
}
