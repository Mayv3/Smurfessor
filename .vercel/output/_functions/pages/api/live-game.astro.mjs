import { z } from 'zod';
import { g as getAccountByRiotId, R as RiotApiError, d as getActiveGame, e as RiotErrorCode } from '../../chunks/endpoints_BQGYynjO.mjs';
import { F as FEATURES } from '../../chunks/features_B4HJnu_F.mjs';
import { A as ACCOUNTS } from '../../chunks/accounts_BS9-O4eu.mjs';
import { i as isSmurfTestPuuid, a as isTestPuuid, M as MOCK_LIVE_GAME, S as SMURF_MOCK_LIVE_GAME } from '../../chunks/mock-data_DUIVrbyk.mjs';
import { e as err, o as ok } from '../../chunks/api-response_BJZTK7sH.mjs';
export { renderers } from '../../renderers.mjs';

function normalizeLiveGame(raw) {
  const blue = [];
  const red = [];
  for (const p of raw.participants) {
    const fullPerks = p.perks ? {
      perkIds: p.perks.perkIds ?? [],
      perkStyle: p.perks.perkStyle,
      perkSubStyle: p.perks.perkSubStyle,
      perkStatShards: p.perks.perkStatShards ?? void 0
    } : void 0;
    const n = {
      puuid: p.puuid,
      riotId: p.riotId,
      championId: p.championId,
      spell1Id: p.spell1Id,
      spell2Id: p.spell2Id,
      teamId: p.teamId,
      perkKeystone: p.perks?.perkIds?.[0],
      perkPrimaryStyle: p.perks?.perkStyle,
      perkSubStyle: p.perks?.perkSubStyle,
      perks: fullPerks
    };
    if (p.teamId === 100) blue.push(n);
    else red.push(n);
  }
  return {
    available: true,
    gameId: raw.gameId,
    gameMode: raw.gameMode,
    gameStartTime: raw.gameStartTime,
    teams: { blue, red }
  };
}

const schema = z.union([
  z.object({
    key: z.string().min(1),
    puuid: z.undefined().optional(),
    platform: z.string().default("LA2")
  }),
  z.object({
    key: z.undefined().optional(),
    puuid: z.string().min(1),
    platform: z.string().default("LA2")
  })
]);
const GET = async ({ url }) => {
  const raw = {
    key: url.searchParams.get("key") ?? void 0,
    puuid: url.searchParams.get("puuid") ?? void 0,
    platform: url.searchParams.get("platform") ?? "LA2"
  };
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return err("INVALID_PARAMS", "Provide either ?key= or ?puuid= parameter", 400);
  }
  const params = parsed.data;
  let puuid;
  let platform = params.platform;
  if ("key" in params && params.key) {
    if (params.key === "test") {
      return ok({ ...MOCK_LIVE_GAME, gameStartTime: Date.now() - 14 * 60 * 1e3 });
    }
    if (params.key === "smurf-test") {
      return ok({ ...SMURF_MOCK_LIVE_GAME, gameStartTime: Date.now() - 10 * 60 * 1e3 });
    }
    const account = ACCOUNTS.find((a) => a.key === params.key);
    if (!account) {
      return err("NOT_FOUND", `Account "${params.key}" not found`, 404);
    }
    platform = account.platform;
    try {
      const riot = await getAccountByRiotId(
        account.riotId.gameName,
        account.riotId.tagLine,
        platform
      );
      puuid = riot.puuid;
    } catch (e) {
      if (e instanceof RiotApiError) {
        return err(e.code, e.detail, e.status);
      }
      return err("UNKNOWN", "Failed to resolve account", 500, String(e));
    }
  } else {
    puuid = params.puuid;
    if (isSmurfTestPuuid(puuid)) {
      return ok({ ...SMURF_MOCK_LIVE_GAME, gameStartTime: Date.now() - 10 * 60 * 1e3 });
    }
    if (isTestPuuid(puuid)) {
      return ok({ ...MOCK_LIVE_GAME, gameStartTime: Date.now() - 14 * 60 * 1e3 });
    }
  }
  if (FEATURES.mockRiot) {
    return ok({ ...SMURF_MOCK_LIVE_GAME, gameStartTime: Date.now() - 10 * 60 * 1e3 });
  }
  if (!FEATURES.spectator) {
    return ok({ available: false, reason: "SPECTATOR_DISABLED" });
  }
  try {
    const game = await getActiveGame(puuid, platform);
    const normalized = normalizeLiveGame(game);
    return ok(normalized);
  } catch (e) {
    if (e instanceof RiotApiError) {
      if (e.status === 404) {
        return ok({ available: false, reason: "NOT_IN_GAME" });
      }
      if (e.code === RiotErrorCode.KEY_INVALID || e.code === RiotErrorCode.UNAUTHORIZED) {
        return ok({ available: false, reason: "KEY_INVALID" });
      }
      if (e.code === RiotErrorCode.RATE_LIMITED) {
        return ok({ available: false, reason: "RATE_LIMITED" });
      }
      return ok({ available: false, reason: "SPECTATOR_UNAVAILABLE" });
    }
    return ok({ available: false, reason: "SPECTATOR_UNAVAILABLE" });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
