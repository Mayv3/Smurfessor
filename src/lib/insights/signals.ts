/**
 * Signal builder — converts Riot API data into PlayerSignals for the insight engine.
 *
 * "Cheap" signals: Summoner, League, Mastery (already fetched per card).
 * "Deep" signals: Match-V5 aggregate (when FEATURE_MATCH_HISTORY=true).
 */
import type {
  PlayerSignals,
  RecentSignals,
  ChampRecentSignals,
  ChampPoolEntry,
  RolePoolEntry,
  PlayerRole,
  MasterySignals,
} from "./types";
import type { LeagueEntry, ChampionMastery } from "../riot/types";
import { getMatchIds, getMatch } from "../riot/endpoints";
import type { MatchIdsOptions } from "../riot/endpoints";
import { getCached, setCached } from "../cache";
import { FEATURES } from "../../config/features";
import { MATCH_FILTER } from "../../config/insights";

/* ── Constants ────────────────────────────────────────── */
const WINDOW_SECONDS = 7 * 24 * 60 * 60; // 7 days
const MAX_MATCH_DETAILS = 10;
const BATCH_SIZE = 3;
/** Round startTime to 15-min blocks so match-stats & signals share cache keys */
const START_BUCKET = 900;

/* ── Cache TTL for aggregates ─────────────────────────── */
const RECENT_AGG_TTL = 6 * 60 * 60 * 1000; // 6h

/* ── Helpers ───────────────────────────────────────────── */
function computeKda(kills: number, deaths: number, assists: number): number | null {
  if (deaths > 0) return (kills + assists) / deaths;
  return kills + assists > 0 ? 99 : null;
}

/* ── Role normalizer ──────────────────────────────────── */
function normalizeRole(teamPosition: string | undefined): PlayerRole {
  switch (teamPosition?.toUpperCase()) {
    case "TOP": return "TOP";
    case "JUNGLE": return "JUNGLE";
    case "MIDDLE": return "MIDDLE";
    case "BOTTOM": return "BOTTOM";
    case "UTILITY": return "UTILITY";
    default: return "UNKNOWN";
  }
}

/* ── Types for Match-V5 participant ───────────────────── */
interface MatchParticipant {
  puuid: string;
  championId: number;
  teamPosition?: string;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  goldEarned: number;
  totalDamageDealtToChampions: number;
  visionScore: number;
  timePlayed?: number;
}

interface MatchInfo {
  gameDuration: number;
  queueId: number;
  participants: MatchParticipant[];
}

interface MatchData {
  info?: MatchInfo;
}

/* ── Build cheap signals from League + Summoner + Mastery ── */
export function buildCheapSignals(
  summonerLevel: number | null,
  entries: LeagueEntry[],
  masteries: ChampionMastery[] | null,
  currentChampionId: number | null,
): Partial<PlayerSignals> {
  const solo = entries.find((e) => e.queueType === "RANKED_SOLO_5x5");
  const flex = entries.find((e) => e.queueType === "RANKED_FLEX_SR");
  const entry = solo ?? flex;

  const ranked = entry
    ? {
        queue: entry.queueType as "RANKED_SOLO_5x5" | "RANKED_FLEX_SR",
        tier: entry.tier,
        rank: entry.rank,
        lp: entry.leaguePoints,
        wins: entry.wins,
        losses: entry.losses,
        hotStreak: entry.hotStreak ?? null,
        freshBlood: entry.freshBlood ?? null,
        veteran: entry.veteran ?? null,
        inactive: entry.inactive ?? null,
      }
    : null;

  const mastery: MasterySignals | null = masteries
    ? {
        top: masteries.slice(0, 5).map((m) => ({
          championId: m.championId,
          points: m.championPoints,
          level: m.championLevel,
        })),
        currentChampion: currentChampionId
          ? (() => {
              const m = masteries.find((x) => x.championId === currentChampionId);
              return m ? { points: m.championPoints, level: m.championLevel } : null;
            })()
          : null,
      }
    : null;

  return {
    summonerLevel,
    ranked,
    currentChampionId,
    mastery,
  };
}

type EnrichedParticipant = MatchParticipant & { gameDuration: number };

/** Fetch match details in batches and extract the target player's participant data. */
async function fetchParticipants(
  puuid: string,
  matchIds: string[],
  platform?: string,
): Promise<EnrichedParticipant[]> {
  const participants: EnrichedParticipant[] = [];

  for (let i = 0; i < matchIds.length; i += BATCH_SIZE) {
    const batch = matchIds.slice(i, i + BATCH_SIZE);
    const settled = await Promise.allSettled(
      batch.map((id) => getMatch(id, platform)),
    );
    for (const s of settled) {
      if (s.status !== "fulfilled" || !s.value) continue;
      const match = s.value as MatchData;
      if (!match.info) continue;
      if (match.info.gameDuration < MATCH_FILTER.minDurationSeconds) continue;
      const p = match.info.participants.find((x) => x.puuid === puuid);
      if (p) {
        participants.push({ ...p, gameDuration: match.info.gameDuration });
      }
    }
  }

  return participants;
}

/** Compute win/loss streak from the newest match backwards. */
function computeStreak(participants: EnrichedParticipant[]): { type: "W" | "L"; count: number } {
  const streakType: "W" | "L" = participants[0].win ? "W" : "L";
  let count = 0;
  for (const p of participants) {
    if ((p.win ? "W" : "L") === streakType) count++;
    else break;
  }
  return { type: streakType, count };
}

/** Accumulate per-champion and per-role distributions from match participants. */
function buildPools(
  participants: EnrichedParticipant[],
): { champPool: ChampPoolEntry[]; rolePool: RolePoolEntry[]; champMap: Map<number, { games: number; wins: number }> } {
  const champMap = new Map<number, { games: number; wins: number }>();
  const roleMap = new Map<string, number>();

  for (const p of participants) {
    const ce = champMap.get(p.championId) ?? { games: 0, wins: 0 };
    ce.games++;
    if (p.win) ce.wins++;
    champMap.set(p.championId, ce);

    const role = normalizeRole(p.teamPosition);
    roleMap.set(role, (roleMap.get(role) ?? 0) + 1);
  }

  const champPool: ChampPoolEntry[] = [...champMap.entries()]
    .map(([championId, { games, wins: w }]) => ({
      championId,
      games,
      winrate: games > 0 ? w / games : 0,
    }))
    .sort((a, b) => b.games - a.games);

  const rolePool: RolePoolEntry[] = [...roleMap.entries()]
    .map(([role, games]) => ({ role, games }))
    .sort((a, b) => b.games - a.games);

  return { champPool, rolePool, champMap };
}

/** Aggregate win/loss totals and per-minute averages from match participants. */
function aggregateAvg(participants: EnrichedParticipant[]) {
  let wins = 0, losses = 0;
  let totalKills = 0, totalDeaths = 0, totalAssists = 0;
  let totalCs = 0, totalGold = 0, totalDamage = 0, totalVision = 0, totalMinutes = 0;

  for (const p of participants) {
    if (p.win) wins++; else losses++;
    totalKills += p.kills;
    totalDeaths += p.deaths;
    totalAssists += p.assists;
    totalMinutes += Math.max(1, (p.timePlayed ?? p.gameDuration) / 60);
    totalCs += p.totalMinionsKilled + p.neutralMinionsKilled;
    totalGold += p.goldEarned;
    totalDamage += p.totalDamageDealtToChampions;
    totalVision += p.visionScore;
  }

  const matches = participants.length;
  const safeMin = Math.max(1, totalMinutes);

  return {
    wins, losses, matches,
    avg: {
      kda: computeKda(totalKills, totalDeaths, totalAssists),
      deaths: matches > 0 ? totalDeaths / matches : null,
      csPerMin: safeMin > 0 ? totalCs / safeMin : null,
      goldPerMin: safeMin > 0 ? totalGold / safeMin : null,
      damagePerMin: safeMin > 0 ? totalDamage / safeMin : null,
      visionPerMin: safeMin > 0 ? totalVision / safeMin : null,
    },
  };
}

/** Resolve champ-specific recent signals for the currently played champion. */
function resolveChampRecent(
  currentChampionId: number | null,
  champMap: Map<number, { games: number; wins: number }>,
): ChampRecentSignals | null {
  if (currentChampionId == null) return null;
  const ce = champMap.get(currentChampionId);
  if (!ce || ce.games === 0) return null;
  return {
    championId: currentChampionId,
    games: ce.games,
    wins: ce.wins,
    losses: ce.games - ce.wins,
    winrate: ce.wins / ce.games,
  };
}

/* ── Build deep signals from Match-V5 ────────────────── */
export async function buildDeepSignals(
  puuid: string,
  currentChampionId: number | null,
  platform?: string,
): Promise<{ recent: RecentSignals | null; champRecent: ChampRecentSignals | null }> {
  if (!FEATURES.matchHistory) {
    return { recent: null, champRecent: null };
  }

  const cacheKey = `insights:${puuid}:${currentChampionId}:${platform ?? "la2"}`;
  const hit = getCached<{ recent: RecentSignals; champRecent: ChampRecentSignals | null }>(
    "insightSignals",
    cacheKey,
    RECENT_AGG_TTL,
  );
  if (hit) return hit;

  try {
    const startTime = Math.floor((Date.now() / 1000 - WINDOW_SECONDS) / START_BUCKET) * START_BUCKET;
    const allIds = await getMatchIds(puuid, {
      type: "ranked", startTime, count: 100, start: 0,
    } satisfies MatchIdsOptions, platform);
    if (allIds.length === 0) return { recent: null, champRecent: null };

    const participants = await fetchParticipants(puuid, allIds.slice(0, MAX_MATCH_DETAILS), platform);
    if (participants.length === 0) return { recent: null, champRecent: null };

    const { wins, losses, matches, avg } = aggregateAvg(participants);
    const streak = computeStreak(participants);
    const { champPool, rolePool, champMap } = buildPools(participants);

    const recent: RecentSignals = {
      window: MAX_MATCH_DETAILS, matches, wins, losses,
      winrate: matches > 0 ? wins / matches : 0,
      streak, champPool, rolePool, avg,
    };

    const champRecent = resolveChampRecent(currentChampionId, champMap);

    const result = { recent, champRecent };
    setCached("insightSignals", cacheKey, result, RECENT_AGG_TTL);
    return result;
  } catch (e) {
    console.warn("[insights/signals] Failed to build deep signals:", e);
    return { recent: null, champRecent: null };
  }
}

/**
 * Build complete PlayerSignals from all available data.
 */
export async function buildPlayerSignals(
  puuid: string,
  summonerLevel: number | null,
  entries: LeagueEntry[],
  masteries: ChampionMastery[] | null,
  currentChampionId: number | null,
  currentRole: PlayerRole | undefined,
  platform?: string,
): Promise<PlayerSignals> {
  const cheap = buildCheapSignals(summonerLevel, entries, masteries, currentChampionId);
  const deep = await buildDeepSignals(puuid, currentChampionId, platform);

  return {
    ...cheap,
    currentRole: currentRole ?? "UNKNOWN",
    recent: deep.recent,
    champRecent: deep.champRecent,
  };
}
