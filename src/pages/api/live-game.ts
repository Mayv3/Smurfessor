import type { APIRoute } from "astro";
import { z } from "zod";
import { getAccountByRiotId, getActiveGame } from "../../lib/riot/endpoints";
import { normalizeLiveGame } from "../../lib/riot/normalize";
import { RiotApiError, RiotErrorCode } from "../../lib/riot/errors";
import { FEATURES } from "../../config/features";
import { ACCOUNTS } from "../../config/accounts";
import {
  isTestPuuid,
  isSmurfTestPuuid,
  MOCK_LIVE_GAME,
  SMURF_MOCK_LIVE_GAME,
} from "../../config/mock-data";
import { ok, err } from "../../lib/api-response";

/**
 * GET /api/live-game
 *
 * Accepts either:
 *   ?key=<account-key>          — resolves the tracked account internally
 *   ?puuid=<puuid>&platform=LA2 — direct lookup (for search flow)
 */
const schema = z.union([
  z.object({
    key: z.string().min(1),
    puuid: z.undefined().optional(),
    platform: z.string().default("LA2"),
  }),
  z.object({
    key: z.undefined().optional(),
    puuid: z.string().min(1),
    platform: z.string().default("LA2"),
  }),
]);

export const GET: APIRoute = async ({ url }) => {
  const raw = {
    key: url.searchParams.get("key") ?? undefined,
    puuid: url.searchParams.get("puuid") ?? undefined,
    platform: url.searchParams.get("platform") ?? "LA2",
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return err("INVALID_PARAMS", "Provide either ?key= or ?puuid= parameter", 400);
  }

  const params = parsed.data;
  let puuid: string;
  let platform = params.platform;

  /* ── Resolve puuid from key or use directly ──────── */
  if ("key" in params && params.key) {
    /* Mock shortcuts */
    if (params.key === "test") {
      return ok({ ...MOCK_LIVE_GAME, gameStartTime: Date.now() - 14 * 60 * 1000 });
    }
    if (params.key === "smurf-test") {
      return ok({ ...SMURF_MOCK_LIVE_GAME, gameStartTime: Date.now() - 10 * 60 * 1000 });
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
        platform,
      );
      puuid = riot.puuid;
    } catch (e) {
      if (e instanceof RiotApiError) {
        return err(e.code, e.detail, e.status);
      }
      return err("UNKNOWN", "Failed to resolve account", 500, String(e));
    }
  } else {
    puuid = params.puuid!;

    /* Mock shortcuts for direct puuid */
    if (isSmurfTestPuuid(puuid)) {
      return ok({ ...SMURF_MOCK_LIVE_GAME, gameStartTime: Date.now() - 10 * 60 * 1000 });
    }
    if (isTestPuuid(puuid)) {
      return ok({ ...MOCK_LIVE_GAME, gameStartTime: Date.now() - 14 * 60 * 1000 });
    }
  }

  /* MOCK_RIOT mode — always return mock game */
  if (FEATURES.mockRiot) {
    return ok({ ...SMURF_MOCK_LIVE_GAME, gameStartTime: Date.now() - 10 * 60 * 1000 });
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
      if (
        e.code === RiotErrorCode.KEY_INVALID ||
        e.code === RiotErrorCode.UNAUTHORIZED
      ) {
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
