/**
 * Riot API endpoint wrappers — every call is cached server-side.
 *
 * Routing:
 *   • Account-V1 / Match-V5 → regional  https://americas.api.riotgames.com
 *   • Summoner / League / Mastery / Spectator → platform  https://la2.api.riotgames.com
 */
import { riotFetch } from "./http";
import { getCached, setCached, TTL } from "../cache";
import type {
  RiotAccount,
  Summoner,
  LeagueEntry,
  ChampionMastery,
  SpectatorGame,
} from "./types";

const DEFAULT_PLATFORM = "la2";

/** Build a platform base URL from a platform code like "la2", "na1", "euw1" etc. */
function platformUrl(platform?: string): string {
  const p = (platform ?? DEFAULT_PLATFORM).toLowerCase();
  return `https://${p}.api.riotgames.com`;
}

/** Map platform code to regional routing for Account-V1 / Match-V5 */
function regionalUrl(platform?: string): string {
  const p = (platform ?? DEFAULT_PLATFORM).toLowerCase();
  // KR and JP route through Asia, OC/PH/SG/TH/TW/VN through SEA, rest through Americas/Europe
  if (["kr", "jp1"].includes(p)) return "https://asia.api.riotgames.com";
  if (["euw1", "eun1", "tr1", "ru", "me1"].includes(p)) return "https://europe.api.riotgames.com";
  if (["oc1", "ph2", "sg2", "th2", "tw2", "vn2"].includes(p)) return "https://sea.api.riotgames.com";
  return "https://americas.api.riotgames.com"; // NA, BR, LA1, LA2
}

/* ─── Account-V1 (regional) ─────────────────────────── */
export async function getAccountByRiotId(
  gameName: string,
  tagLine: string,
  platform?: string,
): Promise<RiotAccount> {
  const cacheKey = `${gameName}#${tagLine}`.toLowerCase();
  const hit = getCached<RiotAccount>("riotId", cacheKey, TTL.RIOT_ID);
  if (hit) return hit;

  const base = regionalUrl(platform);
  const url = `${base}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  const data = await riotFetch<RiotAccount>(url);
  setCached("riotId", cacheKey, data, TTL.RIOT_ID);
  /* Also cache by puuid for reverse lookup */
  setCached("accountByPuuid", data.puuid, data, TTL.ACCOUNT_BY_PUUID);
  return data;
}

export async function getAccountByPuuid(
  puuid: string,
  platform?: string,
): Promise<RiotAccount> {
  const hit = getCached<RiotAccount>("accountByPuuid", puuid, TTL.ACCOUNT_BY_PUUID);
  if (hit) return hit;

  const base = regionalUrl(platform);
  const url = `${base}/riot/account/v1/accounts/by-puuid/${puuid}`;
  const data = await riotFetch<RiotAccount>(url);
  setCached("accountByPuuid", puuid, data, TTL.ACCOUNT_BY_PUUID);
  /* Also cache by riotId */
  const riotIdKey = `${data.gameName}#${data.tagLine}`.toLowerCase();
  setCached("riotId", riotIdKey, data, TTL.RIOT_ID);
  return data;
}

/* ─── Summoner-V4 (platform) ────────────────────────── */
export async function getSummonerByPuuid(puuid: string, platform?: string): Promise<Summoner> {
  const hit = getCached<Summoner>("summoner", puuid, TTL.SUMMONER);
  if (hit) return hit;

  const url = `${platformUrl(platform)}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  const data = await riotFetch<Summoner>(url);
  setCached("summoner", puuid, data, TTL.SUMMONER);
  return data;
}

/* ─── League-V4 (platform) ──────────────────────────── */
export async function getLeagueEntries(
  puuid: string,
  platform?: string,
): Promise<LeagueEntry[]> {
  const hit = getCached<LeagueEntry[]>("league", puuid, TTL.LEAGUE);
  if (hit) return hit;

  const url = `${platformUrl(platform)}/lol/league/v4/entries/by-puuid/${puuid}`;
  const data = await riotFetch<LeagueEntry[]>(url);
  setCached("league", puuid, data, TTL.LEAGUE);
  return data;
}

/* ─── Champion-Mastery-V4 (platform) ────────────────── */
export async function getChampionMasteries(
  puuid: string,
  platform?: string,
): Promise<ChampionMastery[]> {
  const hit = getCached<ChampionMastery[]>("mastery", puuid, TTL.MASTERY);
  if (hit) return hit;

  const url = `${platformUrl(platform)}/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`;
  const data = await riotFetch<ChampionMastery[]>(url);
  setCached("mastery", puuid, data, TTL.MASTERY);
  return data;
}

/* ─── Spectator-V5 (platform) ───────────────────────── */
export async function getActiveGame(puuid: string, platform?: string): Promise<SpectatorGame> {
  const hit = getCached<SpectatorGame>("liveGame", puuid, TTL.LIVE_GAME);
  if (hit) return hit;

  const url = `${platformUrl(platform)}/lol/spectator/v5/active-games/by-summoner/${puuid}`;
  const data = await riotFetch<SpectatorGame>(url);
  setCached("liveGame", puuid, data, TTL.LIVE_GAME);
  return data;
}

/* ─── Match-V5 (regional) — FEATURE FLAG ────────────── */
export async function getMatchIds(
  puuid: string,
  count = 10,
  platform?: string,
): Promise<string[]> {
  const cacheKey = `${puuid}:${count}`;
  const hit = getCached<string[]>("matchIds", cacheKey, TTL.MATCHES);
  if (hit) return hit;

  const base = regionalUrl(platform);
  const url = `${base}/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`;
  const data = await riotFetch<string[]>(url);
  setCached("matchIds", cacheKey, data, TTL.MATCHES);
  return data;
}

export async function getMatch(matchId: string, platform?: string): Promise<unknown> {
  const hit = getCached<unknown>("match", matchId, TTL.MATCH_DETAIL);
  if (hit) return hit;

  const base = regionalUrl(platform);
  const url = `${base}/lol/match/v5/matches/${matchId}`;
  const data = await riotFetch<unknown>(url);
  setCached("match", matchId, data, TTL.MATCH_DETAIL);
  return data;
}
