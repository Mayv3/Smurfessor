import type { APIRoute } from "astro";
import { z } from "zod";
import {
  getSummonerByPuuid,
  getLeagueEntries,
} from "../../lib/riot/endpoints";
import { RiotApiError, RiotErrorCode } from "../../lib/riot/errors";
import { computeSmurfAssessment } from "../../lib/smurf/rules";
import type { SmurfAssessment } from "../../lib/smurf/rules";
import {
  isSmurfTestPuuid,
  isTestPuuid,
  getMockPlayerSummary,
  getAllSmurfMockSummaries,
} from "../../config/mock-data";
import { ok, err } from "../../lib/api-response";

const playerSchema = z.object({
  puuid: z.string().min(1),
  teamId: z.union([z.literal(100), z.literal(200)]),
  championId: z.number().optional(),
});

const schema = z.object({
  platform: z.string().default("LA2"),
  players: z.array(playerSchema).min(1).max(10),
});

interface PlayerSummaryWithSmurf {
  puuid: string;
  teamId: number;
  championId?: number;
  riotId: string;
  profileIconId: number;
  summonerLevel: number;
  soloQueue: {
    queueType: string;
    tier: string;
    rank: string;
    leaguePoints: number;
    wins: number;
    losses: number;
  } | null;
  flexQueue: {
    queueType: string;
    tier: string;
    rank: string;
    leaguePoints: number;
    wins: number;
    losses: number;
  } | null;
  topMasteries: { championId: number; championLevel: number; championPoints: number }[];
  championWinrate: number | null;
  championSampleSize: number;
  smurf: SmurfAssessment;
}

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

  /* ── Check if this is a smurf-test batch (all players are smurf-test puuids) ── */
  const allSmurf = players.every((p) => isSmurfTestPuuid(p.puuid));
  if (allSmurf) {
    const mockSummaries = getAllSmurfMockSummaries();
    const results: PlayerSummaryWithSmurf[] = players.map((p) => {
      const mock = mockSummaries.find((m) => m.puuid === p.puuid);
      if (mock) {
        return {
          puuid: mock.puuid,
          teamId: p.teamId,
          championId: p.championId,
          riotId: mock.riotId,
          profileIconId: mock.profileIconId,
          summonerLevel: mock.summonerLevel,
          soloQueue: mock.soloQueue,
          flexQueue: mock.flexQueue,
          topMasteries: mock.topMasteries,
          championWinrate: (mock as any).championWinrate ?? null,
          championSampleSize: (mock as any).championSampleSize ?? 0,
          smurf: mock.smurf,
        };
      }
      return {
        puuid: p.puuid,
        teamId: p.teamId,
        championId: p.championId,
        riotId: "Unknown",
        profileIconId: 0,
        summonerLevel: 0,
        soloQueue: null,
        flexQueue: null,
        topMasteries: [],
        championWinrate: null,
        championSampleSize: 0,
        smurf: computeSmurfAssessment({ summonerLevel: null, rankedWinrate: null, championWinrate: null, championSampleSize: 0 }),
      };
    });
    return ok({ players: results });
  }

  /* ── Check if this is a legacy test batch ── */
  const allLegacyTest = players.every((p) => isTestPuuid(p.puuid));
  if (allLegacyTest) {
    const results: PlayerSummaryWithSmurf[] = players.map((p) => {
      const mock = getMockPlayerSummary(p.puuid);
      if (mock) {
        const entry = mock.soloQueue ?? mock.flexQueue;
        let rankedWinrate: number | null = null;
        if (entry) {
          const total = entry.wins + entry.losses;
          rankedWinrate = total > 0 ? entry.wins / total : null;
        }
        const smurf = computeSmurfAssessment({
          summonerLevel: mock.summonerLevel,
          rankedWinrate,
          championWinrate: null,
          championSampleSize: 0,
        });
        return {
          puuid: mock.puuid,
          teamId: p.teamId,
          championId: p.championId,
          riotId: mock.riotId,
          profileIconId: mock.profileIconId,
          summonerLevel: mock.summonerLevel,
          soloQueue: mock.soloQueue,
          flexQueue: mock.flexQueue,
          topMasteries: mock.topMasteries,
          championWinrate: null,
          championSampleSize: 0,
          smurf,
        };
      }
      return {
        puuid: p.puuid,
        teamId: p.teamId,
        riotId: "Unknown",
        profileIconId: 0,
        summonerLevel: 0,
        soloQueue: null,
        flexQueue: null,
        topMasteries: [],
        championWinrate: null,
        championSampleSize: 0,
        smurf: computeSmurfAssessment({ summonerLevel: null, rankedWinrate: null, championWinrate: null, championSampleSize: 0 }),
      };
    });
    return ok({ players: results });
  }

  /* ── Real Riot API fetch ── */
  const results: PlayerSummaryWithSmurf[] = [];
  let authFailures = 0;
  let authFailed = false; // fast-fail: skip remaining after first auth error

  for (const p of players) {
    if (authFailed) {
      // Skip API calls, fill with empty data
      results.push({
        puuid: p.puuid,
        teamId: p.teamId,
        championId: p.championId,
        riotId: "",
        profileIconId: 0,
        summonerLevel: 0,
        soloQueue: null,
        flexQueue: null,
        topMasteries: [],
        championWinrate: null,
        championSampleSize: 0,
        smurf: computeSmurfAssessment({
          summonerLevel: null, rankedWinrate: null,
          championWinrate: null, championSampleSize: 0,
        }),
      });
      authFailures++;
      continue;
    }

    try {
      const summoner = await getSummonerByPuuid(p.puuid, platform);
      const entries = await getLeagueEntries(p.puuid, platform);

      const soloQueue = entries.find((e) => e.queueType === "RANKED_SOLO_5x5") ?? null;
      const flexQueue = entries.find((e) => e.queueType === "RANKED_FLEX_SR") ?? null;

      const entry = soloQueue ?? flexQueue;
      let rankedWinrate: number | null = null;
      if (entry) {
        const total = entry.wins + entry.losses;
        rankedWinrate = total > 0 ? entry.wins / total : null;
      }

      // TODO: championWinrate requires FEATURE_MATCH_HISTORY=true + match history fetch
      const smurf = computeSmurfAssessment({
        summonerLevel: summoner.summonerLevel,
        rankedWinrate,
        championWinrate: null,
        championSampleSize: 0,
      });

      results.push({
        puuid: p.puuid,
        teamId: p.teamId,
        championId: p.championId,
        riotId: summoner.name ?? "",
        profileIconId: summoner.profileIconId,
        summonerLevel: summoner.summonerLevel,
        soloQueue,
        flexQueue,
        topMasteries: [],
        championWinrate: null,
        championSampleSize: 0,
        smurf,
      });
    } catch (e) {
      const isAuth = e instanceof RiotApiError &&
        (e.code === RiotErrorCode.KEY_INVALID || e.code === RiotErrorCode.UNAUTHORIZED);
      if (isAuth) {
        authFailures++;
        authFailed = true; // fast-fail remaining players
      }

      /* If one player fails, still include them with "insufficient data" */
      results.push({
        puuid: p.puuid,
        teamId: p.teamId,
        championId: p.championId,
        riotId: "",
        profileIconId: 0,
        summonerLevel: 0,
        soloQueue: null,
        flexQueue: null,
        topMasteries: [],
        championWinrate: null,
        championSampleSize: 0,
        smurf: computeSmurfAssessment({
          summonerLevel: null,
          rankedWinrate: null,
          championWinrate: null,
          championSampleSize: 0,
        }),
      });
      if (e instanceof RiotApiError) {
        console.warn(`[player-summaries] Failed to fetch ${p.puuid} on ${platform}: ${e.detail}`);
      }
    }
  }

  const warning = authFailures > 0
    ? `API key sin permisos para ${platform}. Puede que haya expirado (las dev keys duran 24h). Los datos de ranking no están disponibles.`
    : undefined;

  return ok({ players: results, warning });
};
