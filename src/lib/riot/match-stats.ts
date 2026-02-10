/**
 * Champion stats derived from Match-V5 history.
 * Fetches recent matches and computes per-champion winrate.
 */
import { getMatchIds, getMatch } from "../riot/endpoints";
import { getCached, setCached, TTL } from "../cache";
import { FEATURES } from "../../config/features";
import { RiotApiError } from "../riot/errors";

export interface ChampionRecentStats {
  championId: number;
  recentWindow: number;
  gamesWithChamp: number;
  wins: number;
  losses: number;
  winrateWithChamp: number | null;
  sampleSizeOk: boolean;
  note?: string;
}

const RECENT_MATCH_COUNT = 5;
const MIN_SAMPLE_SIZE = 3;

/**
 * Compute recent stats for a specific champion from match history.
 *
 * @param puuid     Player's PUUID
 * @param championId The champion to filter for
 * @param platform   Platform code (for regional routing)
 * @returns ChampionRecentStats or null if feature disabled / error
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
      recentWindow: RECENT_MATCH_COUNT,
      gamesWithChamp: 0,
      wins: 0,
      losses: 0,
      winrateWithChamp: null,
      sampleSizeOk: false,
      note: "FEATURE_DISABLED",
    };
  }

  /* Check cache first */
  const cacheKey = `${puuid}:${championId}:${platform ?? "la2"}`;
  const hit = getCached<ChampionRecentStats>("champStats", cacheKey, TTL.CHAMP_STATS);
  if (hit) return hit;

  try {
    /* Fetch recent match IDs */
    const matchIds = await getMatchIds(puuid, RECENT_MATCH_COUNT, platform);

    if (matchIds.length === 0) {
      const result: ChampionRecentStats = {
        championId,
        recentWindow: RECENT_MATCH_COUNT,
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

    /* Fetch match details in parallel (they're cached individually) */
    const matchDetails = await Promise.allSettled(
      matchIds.map((id) => getMatch(id, platform)),
    );

    let gamesWithChamp = 0;
    let wins = 0;

    for (const settled of matchDetails) {
      if (settled.status !== "fulfilled" || !settled.value) continue;
      const match = settled.value as {
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

    const losses = gamesWithChamp - wins;
    const sampleSizeOk = gamesWithChamp >= MIN_SAMPLE_SIZE;
    const winrateWithChamp =
      gamesWithChamp > 0 ? wins / gamesWithChamp : null;

    const result: ChampionRecentStats = {
      championId,
      recentWindow: RECENT_MATCH_COUNT,
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
      recentWindow: RECENT_MATCH_COUNT,
      gamesWithChamp: 0,
      wins: 0,
      losses: 0,
      winrateWithChamp: null,
      sampleSizeOk: false,
      note: "FETCH_ERROR",
    };
  }
}
