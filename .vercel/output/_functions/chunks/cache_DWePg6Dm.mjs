import { LRUCache } from 'lru-cache';

const caches = /* @__PURE__ */ new Map();
function getOrCreateCache(namespace, ttl) {
  const existing = caches.get(namespace);
  if (existing) return existing;
  const cache = new LRUCache({ max: 500, ttl });
  caches.set(namespace, cache);
  return cache;
}
const TTL = {
  RIOT_ID: 24 * 60 * 60 * 1e3,
  // 24 h
  SUMMONER: 24 * 60 * 60 * 1e3,
  // 24 h
  LEAGUE: 30 * 60 * 1e3,
  // 30 min
  MASTERY: 30 * 60 * 1e3,
  // 30 min
  LIVE_GAME: 10 * 1e3,
  // 10 s
  DDRAGON: 24 * 60 * 60 * 1e3};
function getCached(namespace, key, ttl) {
  const cache = getOrCreateCache(namespace, ttl);
  return cache.get(key);
}
function setCached(namespace, key, value, ttl) {
  const cache = getOrCreateCache(namespace, ttl);
  cache.set(key, value, { ttl });
}

export { TTL as T, getCached as g, setCached as s };
