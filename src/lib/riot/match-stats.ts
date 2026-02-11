/**
 * Champion stats derived from Match-V5 history.
 *
 * Fetches ALL ranked matches from the last 30 days (up to 100 per page,
 * paginated automatically) and computes per-champion winrate.
 */
import { getMatchIds, getMatch } from "../riot/endpoints";
import type { MatchIdsOptions } from "../riot/endpoints";
import { getCached, setCached, TTL } from "../cache";
import { FEATURES } from "../../config/features";
import { RiotApiError } from "../riot/errors";

export interface ChampionRecentStats {
  championId: number;
  /** "7d" window label */
  recentWindow: string;
  /** Total ranked games found in the window */
  totalRankedGames: number;
  /** How many of those were on this champion */
  gamesWithChamp: number;
  wins: number;
  losses: number;
  winrateWithChamp: number | null;
  /** Average KDA with this champion: (kills+assists)/deaths. null if no games */
  kdaWithChamp: number | null;
  /** Per-game averages. null if no games with this champion */
  avgKills: number | null;
  avgDeaths: number | null;
  avgAssists: number | null;
  sampleSizeOk: boolean;
  note?: string;
}

/** 7 days in seconds */
const WINDOW_SECONDS = 7 * 24 * 60 * 60;
/** Max IDs per Match-V5 page */
const PAGE_SIZE = 100;
/** Round startTime to 15-min blocks so match-stats & signals share cache keys */
const START_BUCKET = 900;
/**
 * Max match details to fetch for champion counting.
 * Higher than signals' 10 so we get the real champion game count,
 * but capped to avoid overwhelming the rate limiter.
 * The first 10 are usually cached from signals.ts (free).
 */
const MAX_CHAMP_DETAILS = 30;
/** Minimum games with champion to consider the sample reliable */
const MIN_SAMPLE_SIZE = 3;

/**
 * Fetch ranked match IDs for `puuid` in the last 7 days.
 * Single page of 100 is usually enough (most players play <100 ranked/week).
 */
async function fetchRankedMatchIds(
  puuid: string,
  platform?: string,
): Promise<string[]> {
  const startTime = Math.floor((Date.now() / 1000 - WINDOW_SECONDS) / START_BUCKET) * START_BUCKET;
  const opts: MatchIdsOptions = {
    type: "ranked",
    startTime,
    count: PAGE_SIZE,
    start: 0,
  };
  return getMatchIds(puuid, opts, platform);
}

/**
 * Compute recent ranked stats for a specific champion from match history.
 *
 * @param puuid      Player's PUUID
 * @param championId The champion to filter for
 * @param platform   Platform code (for regional routing)
 */
function emptyStats(
  championId: number,
  note: ChampionRecentStats["note"],
): ChampionRecentStats {
  return {
    championId, recentWindow: "7d",
    totalRankedGames: 0, gamesWithChamp: 0, wins: 0, losses: 0,
    winrateWithChamp: null, kdaWithChamp: null,
    avgKills: null, avgDeaths: null, avgAssists: null,
    sampleSizeOk: false, note,
  };
}

/** Batch-fetch match details and count champion games.
 *  Phase 1: scan cached matches (free, instant).
 *  Phase 2: fetch uncached matches in small batches to avoid queue overflow.
 */
async function countChampGames(
  puuid: string,
  championId: number,
  matchIds: string[],
  platform?: string,
): Promise<{ gamesWithChamp: number; wins: number; kills: number; deaths: number; assists: number; detailsFetched: number }> {
  let gamesWithChamp = 0;
  let wins = 0;
  let kills = 0;
  let deaths = 0;
  let assists = 0;
  let detailsFetched = 0;

  const uncachedIds: string[] = [];

  /* Phase 1 — count from cache (matches already fetched by signals.ts) */
  for (const id of matchIds) {
    const cached = getCached<{ info?: { participants?: Array<{ puuid: string; championId: number; win: boolean; kills: number; deaths: number; assists: number }> } }>("match", id, TTL.MATCH_DETAIL);
    if (cached) {
      detailsFetched++;
      const p = cached.info?.participants?.find((x) => x.puuid === puuid && x.championId === championId);
      if (p) {
        gamesWithChamp++;
        if (p.win) wins++;
        kills += p.kills ?? 0;
        deaths += p.deaths ?? 0;
        assists += p.assists ?? 0;
      }
    } else {
      uncachedIds.push(id);
    }
  }

  /* Phase 2 — fetch uncached in small batches (gentle on rate limiter) */
  const BATCH = 2;
  for (let i = 0; i < uncachedIds.length; i += BATCH) {
    const batch = uncachedIds.slice(i, i + BATCH);
    const settled = await Promise.allSettled(
      batch.map((id) => getMatch(id, platform)),
    );
    detailsFetched += batch.length;

    for (const s of settled) {
      if (s.status !== "fulfilled" || !s.value) continue;
      const match = s.value as {
        info?: {
          participants?: Array<{
            puuid: string;
            championId: number;
            win: boolean;
            kills: number;
            deaths: number;
            assists: number;
          }>;
        };
      };
      const participant = match.info?.participants?.find(
        (p) => p.puuid === puuid && p.championId === championId,
      );
      if (participant) {
        gamesWithChamp++;
        if (participant.win) wins++;
        kills += participant.kills ?? 0;
        deaths += participant.deaths ?? 0;
        assists += participant.assists ?? 0;
      }
    }
  }

  return { gamesWithChamp, wins, kills, deaths, assists, detailsFetched };
}

export async function getChampionRecentStats(
  puuid: string,
  championId: number,
  platform?: string,
): Promise<ChampionRecentStats> {
  if (!FEATURES.matchHistory) {
    return emptyStats(championId, "FEATURE_DISABLED");
  }

  const cacheKey = `${puuid}:${championId}:7d:${platform ?? "la2"}`;
  const hit = getCached<ChampionRecentStats>("champStats", cacheKey, TTL.CHAMP_STATS);
  if (hit) return hit;

  try {
    const allMatchIds = await fetchRankedMatchIds(puuid, platform);
    if (allMatchIds.length === 0) {
      const result = emptyStats(championId, "NO_MATCHES");
      setCached("champStats", cacheKey, result, TTL.CHAMP_STATS);
      return result;
    }

    // Fetch details for up to MAX_CHAMP_DETAILS matches to get a real champion count.
    // getMatch() results are cached, so the first ~10 (fetched by signals.ts) are free.
    const matchIds = allMatchIds.slice(0, MAX_CHAMP_DETAILS);
    const { gamesWithChamp, wins, kills, deaths, assists } = await countChampGames(puuid, championId, matchIds, platform);
    const losses = gamesWithChamp - wins;
    const sampleSizeOk = gamesWithChamp >= MIN_SAMPLE_SIZE;
    const winrateWithChamp = gamesWithChamp > 0 ? wins / gamesWithChamp : null;
    let kdaWithChamp: number | null = null;
    let avgKills: number | null = null;
    let avgDeaths: number | null = null;
    let avgAssists: number | null = null;
    if (gamesWithChamp > 0) {
      kdaWithChamp = deaths > 0 ? (kills + assists) / deaths : kills + assists;
      avgKills = kills / gamesWithChamp;
      avgDeaths = deaths / gamesWithChamp;
      avgAssists = assists / gamesWithChamp;
    }

    let note: ChampionRecentStats["note"];
    if (sampleSizeOk) note = undefined;
    else if (gamesWithChamp > 0) note = "INSUFFICIENT_SAMPLE";
    else note = "NO_CHAMP_GAMES";

    const result: ChampionRecentStats = {
      championId,
      recentWindow: "7d",
      totalRankedGames: allMatchIds.length,
      gamesWithChamp,
      wins,
      losses,
      winrateWithChamp,
      kdaWithChamp,
      avgKills,
      avgDeaths,
      avgAssists,
      sampleSizeOk,
      note,
    };

    setCached("champStats", cacheKey, result, TTL.CHAMP_STATS);
    return result;
  } catch (e) {
    const detail = e instanceof RiotApiError ? e.detail : String(e);
    console.warn(`[match-stats] Failed to compute champ stats for ${puuid}: ${detail}`);
    return emptyStats(championId, "FETCH_ERROR");
  }
}
