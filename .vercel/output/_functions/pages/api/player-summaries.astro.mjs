import { z } from 'zod';
import { a as getSummonerByPuuid, b as getLeagueEntries, R as RiotApiError, e as RiotErrorCode } from '../../chunks/endpoints_BQGYynjO.mjs';
import { i as isSmurfTestPuuid, c as computeSmurfAssessment, a as isTestPuuid, g as getMockPlayerSummary, b as getAllSmurfMockSummaries } from '../../chunks/mock-data_DUIVrbyk.mjs';
import { e as err, o as ok } from '../../chunks/api-response_BJZTK7sH.mjs';
export { renderers } from '../../renderers.mjs';

const playerSchema = z.object({
  puuid: z.string().min(1),
  teamId: z.union([z.literal(100), z.literal(200)]),
  championId: z.number().optional()
});
const schema = z.object({
  platform: z.string().default("LA2"),
  players: z.array(playerSchema).min(1).max(10)
});
const POST = async ({ request }) => {
  let body;
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
  const allSmurf = players.every((p) => isSmurfTestPuuid(p.puuid));
  if (allSmurf) {
    const mockSummaries = getAllSmurfMockSummaries();
    const results2 = players.map((p) => {
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
          championWinrate: mock.championWinrate ?? null,
          championSampleSize: mock.championSampleSize ?? 0,
          smurf: mock.smurf
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
        smurf: computeSmurfAssessment({ summonerLevel: null, rankedWinrate: null, championWinrate: null, championSampleSize: 0 })
      };
    });
    return ok({ players: results2 });
  }
  const allLegacyTest = players.every((p) => isTestPuuid(p.puuid));
  if (allLegacyTest) {
    const results2 = players.map((p) => {
      const mock = getMockPlayerSummary(p.puuid);
      if (mock) {
        const entry = mock.soloQueue ?? mock.flexQueue;
        let rankedWinrate = null;
        if (entry) {
          const total = entry.wins + entry.losses;
          rankedWinrate = total > 0 ? entry.wins / total : null;
        }
        const smurf = computeSmurfAssessment({
          summonerLevel: mock.summonerLevel,
          rankedWinrate,
          championWinrate: null,
          championSampleSize: 0
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
          smurf
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
        smurf: computeSmurfAssessment({ summonerLevel: null, rankedWinrate: null, championWinrate: null, championSampleSize: 0 })
      };
    });
    return ok({ players: results2 });
  }
  const results = [];
  let authFailures = 0;
  let authFailed = false;
  for (const p of players) {
    if (authFailed) {
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
          championSampleSize: 0
        })
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
      let rankedWinrate = null;
      if (entry) {
        const total = entry.wins + entry.losses;
        rankedWinrate = total > 0 ? entry.wins / total : null;
      }
      const smurf = computeSmurfAssessment({
        summonerLevel: summoner.summonerLevel,
        rankedWinrate,
        championWinrate: null,
        championSampleSize: 0
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
        smurf
      });
    } catch (e) {
      const isAuth = e instanceof RiotApiError && (e.code === RiotErrorCode.KEY_INVALID || e.code === RiotErrorCode.UNAUTHORIZED);
      if (isAuth) {
        authFailures++;
        authFailed = true;
      }
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
          championSampleSize: 0
        })
      });
      if (e instanceof RiotApiError) {
        console.warn(`[player-summaries] Failed to fetch ${p.puuid} on ${platform}: ${e.detail}`);
      }
    }
  }
  const warning = authFailures > 0 ? `API key sin permisos para ${platform}. Puede que haya expirado (las dev keys duran 24h). Los datos de ranking no están disponibles.` : void 0;
  return ok({ players: results, warning });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
