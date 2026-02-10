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
  sampleSizeOk: boolean;
  note?: string;
}

/** 7 days in seconds */
const WINDOW_SECONDS = 7 * 24 * 60 * 60;
/** Max IDs per Match-V5 page */
const PAGE_SIZE = 100;
/** Absolute cap — don't fetch more than 20 match details per player */
const MAX_MATCH_DETAILS = 20;
/** Stop fetching once we find this many games with the target champion */
const EARLY_STOP_CHAMP_GAMES = 5;
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
  const startTime = Math.floor(Date.now() / 1000) - WINDOW_SECONDS;
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
export async function getChampionRecentStats(
  puuid: string,
  championId: number,
  platform?: string,
): Promise<ChampionRecentStats> {
  /* Feature gate */
  if (!FEATURES.matchHistory) {
    return {
      championId,
      recentWindow: "7d",
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
  const cacheKey = `${puuid}:${championId}:7d:${platform ?? "la2"}`;
  const hit = getCached<ChampionRecentStats>("champStats", cacheKey, TTL.CHAMP_STATS);
  if (hit) return hit;

  try {
    /* 1) Fetch ranked match IDs from last 7 days (single page, 1 call) */
    const allMatchIds = await fetchRankedMatchIds(puuid, platform);

    if (allMatchIds.length === 0) {
      const result: ChampionRecentStats = {
        championId,
        recentWindow: "7d",
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

    /* 2) Fetch match details with early-stop:
       Stop as soon as we find EARLY_STOP_CHAMP_GAMES with the target champion,
       or hit MAX_MATCH_DETAILS. Batches of 3 to respect rate limits. */
    const BATCH_SIZE = 3;
    const matchIds = allMatchIds.slice(0, MAX_MATCH_DETAILS);
    let gamesWithChamp = 0;
    let wins = 0;
    let detailsFetched = 0;

    for (let i = 0; i < matchIds.length; i += BATCH_SIZE) {
      /* Early stop — enough champion games found */
      if (gamesWithChamp >= EARLY_STOP_CHAMP_GAMES) break;

      const batch = matchIds.slice(i, i + BATCH_SIZE);
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
      recentWindow: "7d",
      totalRankedGames: allMatchIds.length,
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
      recentWindow: "7d",
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
