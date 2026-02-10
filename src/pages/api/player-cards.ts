/**
 * POST /api/player-cards — Batch endpoint returning card-ready data for up to 10 players.
 *
 * Body: { platform: string, players: [{ puuid, championId, teamId, perks? }] }
 * Response: { ok: true, data: { players: PlayerCardData[], warning?: string } }
 */
import type { APIRoute } from "astro";
import { z } from "zod";
import {
  getAccountByPuuid,
  getSummonerByPuuid,
  getLeagueEntries,
} from "../../lib/riot/endpoints";
import { bootstrap } from "../../lib/ddragon/index";
import { normalizeRunes } from "../../lib/ddragon/runes";
import type { NormalizedRunes } from "../../lib/ddragon/runes";
import { getChampionRecentStats } from "../../lib/riot/match-stats";
import { computeSmurfAssessment } from "../../lib/smurf/rules";

import { RiotApiError } from "../../lib/riot/errors";
import { FEATURES } from "../../config/features";
import {
  isSmurfTestPuuid,
  isTestPuuid,
  getMockPlayerSummary,
  getAllSmurfMockSummaries,
} from "../../config/mock-data";
import { ok, err } from "../../lib/api-response";
import type {
  PlayerCardData,
  PlayerCardRanked,
  PlayerCardChampion,
  PlayerCardChampStats,
} from "../../lib/riot/types";

/* ── Request schema ──────────────────────────────────── */
const perksSchema = z.object({
  perkIds: z.array(z.number()).optional(),
  perkStyle: z.number().optional(),
  perkSubStyle: z.number().optional(),
  perkStatShards: z.object({
    offense: z.number().optional(),
    flex: z.number().optional(),
    defense: z.number().optional(),
  }).optional(),
}).optional();

const playerSchema = z.object({
  puuid: z.string().min(1),
  championId: z.number(),
  teamId: z.union([z.literal(100), z.literal(200)]),
  perks: perksSchema,
});

const schema = z.object({
  platform: z.string().default("LA2"),
  players: z.array(playerSchema).min(1).max(10),
});

/* ── Helpers ──────────────────────────────────────────── */
function buildRanked(
  entries: { queueType: string; tier: string; rank: string; leaguePoints: number; wins: number; losses: number }[],
): PlayerCardRanked | null {
  const solo = entries.find((e) => e.queueType === "RANKED_SOLO_5x5");
  const flex = entries.find((e) => e.queueType === "RANKED_FLEX_SR");
  const entry = solo ?? flex;
  if (!entry) return null;

  const games = entry.wins + entry.losses;
  return {
    queue: entry.queueType as "RANKED_SOLO_5x5" | "RANKED_FLEX_SR",
    tier: entry.tier,
    rank: entry.rank,
    leaguePoints: entry.leaguePoints,
    wins: entry.wins,
    losses: entry.losses,
    games,
    winrate: games > 0 ? entry.wins / games : 0,
  };
}

function emptyChampStats(_championId: number, note: string): PlayerCardChampStats {
  return {
    recentWindow: "7d",
    totalRankedGames: 0,
    gamesWithChamp: null,
    winrateWithChamp: null,
    sampleSizeOk: false,
    note,
  };
}

function emptyCard(puuid: string, teamId: number, championId: number): PlayerCardData {
  return {
    puuid,
    teamId,
    riotId: { gameName: "Unknown", tagLine: "???" },
    summonerLevel: 0,
    profileIconId: 0,
    ranked: null,
    currentChampion: { id: championId, name: "Unknown", icon: "" },
    champStats: emptyChampStats(championId, "FETCH_ERROR"),
    runes: null,
    spells: null,
    smurf: computeSmurfAssessment({
      summonerLevel: null,
      rankedWinrate: null,
      championWinrate: null,
      championSampleSize: 0,
    }),
  };
}

/* ── Main handler ────────────────────────────────────── */
export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("INVALID_PARAMS", "Invalid JSON body", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return err("INVALID_PARAMS", parsed.error.message, 400);
  }

  const { platform, players } = parsed.data;

  /* ── Bootstrap DDragon ── */
  let dd: Awaited<ReturnType<typeof bootstrap>> | null = null;
  try {
    dd = await bootstrap();
  } catch (e) {
    console.warn("[player-cards] DDragon bootstrap failed:", e);
  }

  /* ── Check mock modes ── */
  if (FEATURES.mockRiot) {
    return ok({ players: buildMockCards(players, dd) });
  }

  const allSmurf = players.every((p) => isSmurfTestPuuid(p.puuid));
  if (allSmurf) {
    return ok({ players: buildSmurfTestCards(players, dd) });
  }

  const allLegacy = players.every((p) => isTestPuuid(p.puuid));
  if (allLegacy) {
    return ok({ players: buildLegacyTestCards(players, dd) });
  }

  /* ── Real Riot API fetch (parallel — rate limiter handles concurrency) ── */
  const ENRICHMENT_TIMEOUT = 25_000; // 25s hard cap

  async function enrichPlayer(
    p: z.infer<typeof playerSchema>,
  ): Promise<PlayerCardData> {
    try {
      /* 1) Account (riotId) */
      /* All API calls in parallel — rate limiter handles concurrency */
      const [accountResult, summoner, entries, champStatsRaw] = await Promise.all([
        getAccountByPuuid(p.puuid, platform).catch(() => null),
        getSummonerByPuuid(p.puuid, platform),
        getLeagueEntries(p.puuid, platform),
        getChampionRecentStats(p.puuid, p.championId, platform).catch(
          () => null,
        ),
      ]);

      const gameName = accountResult?.gameName ?? "";
      const tagLine = accountResult?.tagLine ?? "";

      const ranked = buildRanked(entries);

      /* 3) Champion stats */
      const champStats: PlayerCardChampStats = champStatsRaw
        ? {
            recentWindow: champStatsRaw.recentWindow,
            totalRankedGames: champStatsRaw.totalRankedGames,
            gamesWithChamp:
              champStatsRaw.gamesWithChamp > 0
                ? champStatsRaw.gamesWithChamp
                : null,
            winrateWithChamp: champStatsRaw.winrateWithChamp,
            sampleSizeOk: champStatsRaw.sampleSizeOk,
            note: champStatsRaw.note,
          }
        : emptyChampStats(p.championId, "FETCH_ERROR");

      /* 4) Champion info from DDragon */
      const champData = dd?.champions[String(p.championId)];
      const currentChampion: PlayerCardChampion = champData
        ? { id: p.championId, name: champData.name, icon: champData.image }
        : { id: p.championId, name: "Unknown", icon: "" };

      /* 5) Runes normalization */
      let runes: NormalizedRunes | null = null;
      if (p.perks && dd) {
        runes = normalizeRunes(
          {
            perkIds: p.perks.perkIds ?? [],
            perkStyle: p.perks.perkStyle ?? 0,
            perkSubStyle: p.perks.perkSubStyle ?? 0,
          },
          p.perks.perkStatShards ?? null,
          dd.runes,
          dd.runeData,
        );
      }

      /* 6) Smurf assessment */
      const rankedWinrate = ranked ? ranked.winrate : null;
      const smurf = computeSmurfAssessment({
        summonerLevel: summoner.summonerLevel,
        rankedWinrate,
        championWinrate: champStats.winrateWithChamp,
        championSampleSize: champStats.gamesWithChamp ?? 0,
      });

      return {
        puuid: p.puuid,
        teamId: p.teamId,
        riotId: {
          gameName: gameName || summoner.name || "Unknown",
          tagLine: tagLine || "???",
        },
        summonerLevel: summoner.summonerLevel,
        profileIconId: summoner.profileIconId,
        ranked,
        currentChampion,
        champStats,
        runes,
        spells: null,
        smurf,
      };
    } catch (e) {
      if (e instanceof RiotApiError) {
        console.warn(`[player-cards] ${p.puuid}: [${e.code}] ${e.detail}`);
      }
      return emptyCard(p.puuid, p.teamId, p.championId);
    }
  }

  /* Fire all enrichments in parallel — rate limiter caps concurrency */
  const settled = await Promise.race([
    Promise.allSettled(players.map(enrichPlayer)),
    new Promise<PromiseSettledResult<PlayerCardData>[]>((resolve) =>
      setTimeout(
        () => resolve(players.map((p) => ({
          status: "fulfilled" as const,
          value: emptyCard(p.puuid, p.teamId, p.championId),
        }))),
        ENRICHMENT_TIMEOUT,
      ),
    ),
  ]);

  const results: PlayerCardData[] = [];
  let authFailures = 0;

  for (let i = 0; i < settled.length; i++) {
    const s = settled[i];
    if (s.status === "fulfilled") {
      results.push(s.value);
      if (s.value.riotId.gameName === "Unknown" && s.value.summonerLevel === 0) {
        authFailures++;
      }
    } else {
      results.push(emptyCard(players[i].puuid, players[i].teamId, players[i].championId));
    }
  }

  const warning = authFailures > 3
    ? `API key sin permisos para ${platform}. Puede que haya expirado (las dev keys duran 24h).`
    : undefined;

  return ok({ players: results, warning });
};

/* ══════════════════════════════════════════════════════════
   Mock builders
   ══════════════════════════════════════════════════════════ */

function buildMockCards(
  players: z.infer<typeof schema>["players"],
  dd: Awaited<ReturnType<typeof bootstrap>> | null,
): PlayerCardData[] {
  // Reuse smurf-test mock data for MOCK_RIOT mode
  return buildSmurfTestCards(players, dd);
}

function buildSmurfTestCards(
  players: z.infer<typeof schema>["players"],
  dd: Awaited<ReturnType<typeof bootstrap>> | null,
): PlayerCardData[] {
  const mocks = getAllSmurfMockSummaries();
  return players.map((p) => {
    const mock = mocks.find((m) => m.puuid === p.puuid);
    const champData = dd?.champions[String(p.championId)];

    const entry = mock?.soloQueue ?? mock?.flexQueue ?? null;
    let ranked: PlayerCardRanked | null = null;
    if (entry) {
      const games = entry.wins + entry.losses;
      ranked = {
        queue: entry.queueType as "RANKED_SOLO_5x5" | "RANKED_FLEX_SR",
        tier: entry.tier,
        rank: entry.rank,
        leaguePoints: entry.leaguePoints,
        wins: entry.wins,
        losses: entry.losses,
        games,
        winrate: games > 0 ? entry.wins / games : 0,
      };
    }

    const riotIdParts = (mock?.riotId ?? "Unknown#???").split("#");
    const champWR = mock?.championWinrate ?? null;
    const champSample = mock?.championSampleSize ?? 0;

    /* Build runes from perks if DDragon available */
    let runes: NormalizedRunes | null = null;
    if (p.perks && dd) {
      runes = normalizeRunes(
        { perkIds: p.perks.perkIds ?? [], perkStyle: p.perks.perkStyle ?? 0, perkSubStyle: p.perks.perkSubStyle ?? 0 },
        p.perks.perkStatShards ?? null,
        dd.runes,
        dd.runeData,
      );
    }

    return {
      puuid: p.puuid,
      teamId: p.teamId,
      riotId: { gameName: riotIdParts[0], tagLine: riotIdParts[1] ?? "???" },
      summonerLevel: mock?.summonerLevel ?? 0,
      profileIconId: mock?.profileIconId ?? 0,
      ranked,
      currentChampion: champData
        ? { id: p.championId, name: champData.name, icon: champData.image }
        : { id: p.championId, name: "Unknown", icon: "" },
      champStats: {
        recentWindow: "7d",
        totalRankedGames: 0,
        gamesWithChamp: champSample > 0 ? champSample : null,
        winrateWithChamp: champWR,
        sampleSizeOk: champSample >= 8,
        note: champSample === 0 ? "MOCK_DATA" : undefined,
      },
      runes,
      spells: null,
      smurf: mock?.smurf ?? computeSmurfAssessment({
        summonerLevel: null, rankedWinrate: null,
        championWinrate: null, championSampleSize: 0,
      }),
    };
  });
}

function buildLegacyTestCards(
  players: z.infer<typeof schema>["players"],
  dd: Awaited<ReturnType<typeof bootstrap>> | null,
): PlayerCardData[] {
  return players.map((p) => {
    const mock = getMockPlayerSummary(p.puuid);
    const champData = dd?.champions[String(p.championId)];

    const entry = mock?.soloQueue ?? mock?.flexQueue ?? null;
    let ranked: PlayerCardRanked | null = null;
    if (entry) {
      const games = entry.wins + entry.losses;
      ranked = {
        queue: entry.queueType as "RANKED_SOLO_5x5" | "RANKED_FLEX_SR",
        tier: entry.tier,
        rank: entry.rank,
        leaguePoints: entry.leaguePoints,
        wins: entry.wins,
        losses: entry.losses,
        games,
        winrate: games > 0 ? entry.wins / games : 0,
      };
    }

    const riotIdParts = (mock?.riotId ?? "Unknown#???").split("#");
    const rankedWinrate = ranked ? ranked.winrate : null;

    let runes: NormalizedRunes | null = null;
    if (p.perks && dd) {
      runes = normalizeRunes(
        { perkIds: p.perks.perkIds ?? [], perkStyle: p.perks.perkStyle ?? 0, perkSubStyle: p.perks.perkSubStyle ?? 0 },
        p.perks.perkStatShards ?? null,
        dd.runes,
        dd.runeData,
      );
    }

    return {
      puuid: p.puuid,
      teamId: p.teamId,
      riotId: { gameName: riotIdParts[0], tagLine: riotIdParts[1] ?? "???" },
      summonerLevel: mock?.summonerLevel ?? 0,
      profileIconId: mock?.profileIconId ?? 0,
      ranked,
      currentChampion: champData
        ? { id: p.championId, name: champData.name, icon: champData.image }
        : { id: p.championId, name: "Unknown", icon: "" },
      champStats: emptyChampStats(p.championId, "MOCK_DATA"),
      runes,
      spells: null,
      smurf: computeSmurfAssessment({
        summonerLevel: mock?.summonerLevel ?? null,
        rankedWinrate,
        championWinrate: null,
        championSampleSize: 0,
      }),
    };
  });
}
