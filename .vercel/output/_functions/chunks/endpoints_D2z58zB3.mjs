import { g as getCached, s as setCached, T as TTL } from './cache_DWePg6Dm.mjs';

var RiotErrorCode = /* @__PURE__ */ ((RiotErrorCode2) => {
  RiotErrorCode2["NOT_FOUND"] = "NOT_FOUND";
  RiotErrorCode2["NOT_IN_GAME"] = "NOT_IN_GAME";
  RiotErrorCode2["KEY_INVALID"] = "KEY_INVALID";
  RiotErrorCode2["UNAUTHORIZED"] = "UNAUTHORIZED";
  RiotErrorCode2["RATE_LIMITED"] = "RATE_LIMITED";
  RiotErrorCode2["SPECTATOR_UNAVAILABLE"] = "SPECTATOR_UNAVAILABLE";
  RiotErrorCode2["NETWORK_ERROR"] = "NETWORK_ERROR";
  RiotErrorCode2["UNKNOWN"] = "UNKNOWN";
  return RiotErrorCode2;
})(RiotErrorCode || {});
class RiotApiError extends Error {
  constructor(status, endpoint, code, detail) {
    super(`[${code}] ${detail} (${status} ${endpoint})`);
    this.status = status;
    this.endpoint = endpoint;
    this.code = code;
    this.detail = detail;
    this.name = "RiotApiError";
  }
}

const MAX_CONCURRENT = 5;
const MIN_TIME_MS = 100;
let _running = 0;
let _lastRun = 0;
const _queue = [];
function drain() {
  while (_queue.length > 0 && _running < MAX_CONCURRENT) {
    const next = _queue.shift();
    next();
  }
}
function schedule(fn) {
  return new Promise((resolve, reject) => {
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
function getApiKey() {
  try {
    return "RGAPI-1eaac8de-09e1-4a96-946e-4558be7ba4f9";
  } catch {
    return "";
  }
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function jitter(base) {
  return base + Math.random() * base * 0.5;
}
async function fetchWithTimeout(url, apiKey, timeout) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    return await fetch(url, {
      headers: { "X-Riot-Token": apiKey },
      signal: ctrl.signal
    });
  } finally {
    clearTimeout(timer);
  }
}
async function riotFetch(url, options = {}) {
  const { maxRetries = 3, timeout = 1e4 } = options;
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new RiotApiError(
      401,
      url,
      RiotErrorCode.KEY_INVALID,
      "RIOT_API_KEY is not configured"
    );
  }
  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await schedule(
        () => fetchWithTimeout(url, apiKey, timeout)
      );
      if (res.ok) {
        return await res.json();
      }
      if (res.status === 429) {
        const ra = parseInt(res.headers.get("Retry-After") ?? "5", 10);
        if (attempt < maxRetries) {
          await sleep(jitter(ra * 1e3));
          continue;
        }
        throw new RiotApiError(
          429,
          url,
          RiotErrorCode.RATE_LIMITED,
          `Rate limited — retry after ${ra}s`
        );
      }
      if (res.status === 404) {
        throw new RiotApiError(
          404,
          url,
          RiotErrorCode.NOT_FOUND,
          "Resource not found"
        );
      }
      if (res.status === 401 || res.status === 403) {
        if (attempt < maxRetries) {
          await sleep(jitter(1e3));
          continue;
        }
        throw new RiotApiError(
          res.status,
          url,
          RiotErrorCode.KEY_INVALID,
          "API key invalid or unauthorized"
        );
      }
      throw new RiotApiError(
        res.status,
        url,
        RiotErrorCode.UNKNOWN,
        `Unexpected status ${res.status}`
      );
    } catch (e) {
      if (e instanceof RiotApiError) throw e;
      lastError = e;
      if (attempt < maxRetries) {
        await sleep(jitter(1e3 * 2 ** attempt));
        continue;
      }
    }
  }
  throw new RiotApiError(
    0,
    url,
    RiotErrorCode.NETWORK_ERROR,
    lastError?.message ?? "Network error"
  );
}

const DEFAULT_PLATFORM = "la2";
function platformUrl(platform) {
  const p = (platform ?? DEFAULT_PLATFORM).toLowerCase();
  return `https://${p}.api.riotgames.com`;
}
function regionalUrl(platform) {
  const p = (platform ?? DEFAULT_PLATFORM).toLowerCase();
  if (["kr", "jp1"].includes(p)) return "https://asia.api.riotgames.com";
  if (["euw1", "eun1", "tr1", "ru", "me1"].includes(p)) return "https://europe.api.riotgames.com";
  if (["oc1", "ph2", "sg2", "th2", "tw2", "vn2"].includes(p)) return "https://sea.api.riotgames.com";
  return "https://americas.api.riotgames.com";
}
async function getAccountByRiotId(gameName, tagLine, platform) {
  const cacheKey = `${gameName}#${tagLine}`.toLowerCase();
  const hit = getCached("riotId", cacheKey, TTL.RIOT_ID);
  if (hit) return hit;
  const base = regionalUrl(platform);
  const url = `${base}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  const data = await riotFetch(url);
  setCached("riotId", cacheKey, data, TTL.RIOT_ID);
  return data;
}
async function getSummonerByPuuid(puuid, platform) {
  const hit = getCached("summoner", puuid, TTL.SUMMONER);
  if (hit) return hit;
  const url = `${platformUrl(platform)}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  const data = await riotFetch(url);
  setCached("summoner", puuid, data, TTL.SUMMONER);
  return data;
}
async function getLeagueEntries(encryptedSummonerId, platform) {
  const hit = getCached(
    "league",
    encryptedSummonerId,
    TTL.LEAGUE
  );
  if (hit) return hit;
  const url = `${platformUrl(platform)}/lol/league/v4/entries/by-summoner/${encryptedSummonerId}`;
  const data = await riotFetch(url);
  setCached("league", encryptedSummonerId, data, TTL.LEAGUE);
  return data;
}
async function getChampionMasteries(encryptedSummonerId, platform) {
  const hit = getCached(
    "mastery",
    encryptedSummonerId,
    TTL.MASTERY
  );
  if (hit) return hit;
  const url = `${platformUrl(platform)}/lol/champion-mastery/v4/champion-masteries/by-summoner/${encryptedSummonerId}`;
  const data = await riotFetch(url);
  setCached("mastery", encryptedSummonerId, data, TTL.MASTERY);
  return data;
}
async function getActiveGame(puuid, platform) {
  const hit = getCached("liveGame", puuid, TTL.LIVE_GAME);
  if (hit) return hit;
  const url = `${platformUrl(platform)}/lol/spectator/v5/active-games/by-summoner/${puuid}`;
  const data = await riotFetch(url);
  setCached("liveGame", puuid, data, TTL.LIVE_GAME);
  return data;
}

export { RiotApiError as R, getSummonerByPuuid as a, getLeagueEntries as b, getChampionMasteries as c, getActiveGame as d, RiotErrorCode as e, getAccountByRiotId as g };
