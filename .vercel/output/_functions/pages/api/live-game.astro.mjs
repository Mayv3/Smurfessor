import { z } from 'zod';
import { d as getActiveGame, R as RiotApiError, e as RiotErrorCode } from '../../chunks/endpoints_D2z58zB3.mjs';
import { i as isSmurfTestPuuid, a as isTestPuuid, S as SMURF_MOCK_LIVE_GAME, M as MOCK_LIVE_GAME } from '../../chunks/mock-data_BDHGij8S.mjs';
import { e as err, o as ok } from '../../chunks/api-response_BJZTK7sH.mjs';
export { renderers } from '../../renderers.mjs';

function normalizeLiveGame(raw) {
  const blue = [];
  const red = [];
  for (const p of raw.participants) {
    const n = {
      puuid: p.puuid,
      riotId: p.riotId,
      championId: p.championId,
      spell1Id: p.spell1Id,
      spell2Id: p.spell2Id,
      teamId: p.teamId,
      perkKeystone: p.perks?.perkIds?.[0],
      perkPrimaryStyle: p.perks?.perkStyle,
      perkSubStyle: p.perks?.perkSubStyle
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

const __vite_import_meta_env__ = {"ASSETS_PREFIX": undefined, "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SITE": undefined, "SSR": true};
function env(key, fallback) {
  try {
    const val = Object.assign(__vite_import_meta_env__, { FEATURE_SPECTATOR: "true", FEATURE_MATCH_HISTORY: "false" })?.[key] ?? process.env[key];
    return val ?? fallback;
  } catch {
    return fallback;
  }
}
const FEATURES = {
  spectator: env("FEATURE_SPECTATOR", "true") === "true",
  matchHistory: env("FEATURE_MATCH_HISTORY", "false") === "true"
};

const schema = z.object({
  puuid: z.string().min(1),
  platform: z.string().default("LA2")
});
const GET = async ({ url }) => {
  const parsed = schema.safeParse({
    puuid: url.searchParams.get("puuid"),
    platform: url.searchParams.get("platform") ?? "LA2"
  });
  if (!parsed.success) {
    return err("INVALID_PARAMS", "Missing or invalid parameters", 400);
  }
  if (isSmurfTestPuuid(parsed.data.puuid)) {
    return ok({ ...SMURF_MOCK_LIVE_GAME, gameStartTime: Date.now() - 10 * 60 * 1e3 });
  }
  if (isTestPuuid(parsed.data.puuid)) {
    return ok({ ...MOCK_LIVE_GAME, gameStartTime: Date.now() - 14 * 60 * 1e3 });
  }
  if (!FEATURES.spectator) {
    return ok({ available: false, reason: "SPECTATOR_DISABLED" });
  }
  try {
    const game = await getActiveGame(parsed.data.puuid, parsed.data.platform);
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
