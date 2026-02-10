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
  /** "30d" window label */
  recentWindow: string;
  /** Total ranked games found in the window */
  totalRankedGames: number;
  /** How many of those were on this champion */
  gamesWithChamp: number;
  wins: number;
  losses: number;
  winrateWithChamp: number | null;
  sampleSizeOk: boolean;
  note?: string;
}

/** 30 days in seconds */
const WINDOW_SECONDS = 30 * 24 * 60 * 60;
/** Max IDs per Match-V5 page */
const PAGE_SIZE = 100;
/** Absolute cap — don't fetch more than 200 match details per player */
const MAX_MATCH_DETAILS = 200;
/** Minimum games with champion to consider the sample reliable */
const MIN_SAMPLE_SIZE = 3;

/**
 * Fetch all ranked match IDs for `puuid` in the last 30 days.
 * Paginates automatically up to MAX_MATCH_DETAILS.
 */
async function fetchRankedMatchIds(
  puuid: string,
  platform?: string,
): Promise<string[]> {
  const startTime = Math.floor(Date.now() / 1000) - WINDOW_SECONDS;
  const all: string[] = [];
  let offset = 0;

  while (all.length < MAX_MATCH_DETAILS) {
    const opts: MatchIdsOptions = {
      type: "ranked",
      startTime,
      count: PAGE_SIZE,
      start: offset,
    };
    const page = await getMatchIds(puuid, opts, platform);
    if (page.length === 0) break;
    all.push(...page);
    if (page.length < PAGE_SIZE) break; // last page
    offset += PAGE_SIZE;
  }

  return all.slice(0, MAX_MATCH_DETAILS);
}

/**
 * Compute recent ranked stats for a specific champion from match history.
 *
 * @param puuid      Player's PUUID
 * @param championId The champion to filter for
 * @param platform   Platform code (for regional routing)
 */
export async function getChampionRecentStats(
  puuid: string,
  championId: number,
  platform?: string,
): Promise<ChampionRecentStats> {
  /* Feature gate */
  if (!FEATURES.matchHistory) {
    return {
      championId,
      recentWindow: "30d",
      totalRankedGames: 0,
      gamesWithChamp: 0,
      wins: 0,
      losses: 0,
      winrateWithChamp: null,
      sampleSizeOk: false,
      note: "FEATURE_DISABLED",
    };
  }

  /* Check cache first */
  const cacheKey = `${puuid}:${championId}:30d:${platform ?? "la2"}`;
  const hit = getCached<ChampionRecentStats>("champStats", cacheKey, TTL.CHAMP_STATS);
  if (hit) return hit;

  try {
    /* 1) Fetch ALL ranked match IDs from last 30 days */
    const matchIds = await fetchRankedMatchIds(puuid, platform);

    if (matchIds.length === 0) {
      const result: ChampionRecentStats = {
        championId,
        recentWindow: "30d",
        totalRankedGames: 0,
        gamesWithChamp: 0,
        wins: 0,
        losses: 0,
        winrateWithChamp: null,
        sampleSizeOk: false,
        note: "NO_MATCHES",
      };
      setCached("champStats", cacheKey, result, TTL.CHAMP_STATS);
      return result;
    }

    /* 2) Fetch match details in parallel (each one cached 24 h individually) */
    const BATCH_SIZE = 10;
    let gamesWithChamp = 0;
    let wins = 0;

    for (let i = 0; i < matchIds.length; i += BATCH_SIZE) {
      const batch = matchIds.slice(i, i + BATCH_SIZE);
      const settled = await Promise.allSettled(
        batch.map((id) => getMatch(id, platform)),
      );

      for (const s of settled) {
        if (s.status !== "fulfilled" || !s.value) continue;
        const match = s.value as {
          info?: {
            participants?: Array<{
              puuid: string;
              championId: number;
              win: boolean;
            }>;
          };
        };

        const participant = match.info?.participants?.find(
          (p) => p.puuid === puuid && p.championId === championId,
        );

        if (participant) {
          gamesWithChamp++;
          if (participant.win) wins++;
        }
      }
    }

    const losses = gamesWithChamp - wins;
    const sampleSizeOk = gamesWithChamp >= MIN_SAMPLE_SIZE;
    const winrateWithChamp =
      gamesWithChamp > 0 ? wins / gamesWithChamp : null;

    const result: ChampionRecentStats = {
      championId,
      recentWindow: "30d",
      totalRankedGames: matchIds.length,
      gamesWithChamp,
      wins,
      losses,
      winrateWithChamp,
      sampleSizeOk,
      note: sampleSizeOk
        ? undefined
        : gamesWithChamp > 0
          ? "INSUFFICIENT_SAMPLE"
          : "NO_CHAMP_GAMES",
    };

    setCached("champStats", cacheKey, result, TTL.CHAMP_STATS);
    return result;
  } catch (e) {
    /* Graceful degradation — don't break the card */
    const detail = e instanceof RiotApiError ? e.detail : String(e);
    console.warn(`[match-stats] Failed to compute champ stats for ${puuid}: ${detail}`);
    return {
      championId,
      recentWindow: "30d",
      totalRankedGames: 0,
      gamesWithChamp: 0,
      wins: 0,
      losses: 0,
      winrateWithChamp: null,
      sampleSizeOk: false,
      note: "FETCH_ERROR",
    };
  }
}
