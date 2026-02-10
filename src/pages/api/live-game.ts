import type { APIRoute } from "astro";
import { z } from "zod";
import { getActiveGame } from "../../lib/riot/endpoints";
import { normalizeLiveGame } from "../../lib/riot/normalize";
import { RiotApiError, RiotErrorCode } from "../../lib/riot/errors";
import { FEATURES } from "../../config/features";
import { isTestPuuid, isSmurfTestPuuid, MOCK_LIVE_GAME, SMURF_MOCK_LIVE_GAME } from "../../config/mock-data";
import { ok, err } from "../../lib/api-response";

const schema = z.object({
  puuid: z.string().min(1),
  platform: z.string().default("LA2"),
});

export const GET: APIRoute = async ({ url }) => {
  const parsed = schema.safeParse({
    puuid: url.searchParams.get("puuid"),
    platform: url.searchParams.get("platform") ?? "LA2",
  });

  if (!parsed.success) {
    return err("INVALID_PARAMS", "Missing or invalid parameters", 400);
  }

  /* Mock shortcut for test puuids */
  if (isSmurfTestPuuid(parsed.data.puuid)) {
    return ok({ ...SMURF_MOCK_LIVE_GAME, gameStartTime: Date.now() - 10 * 60 * 1000 });
  }
  if (isTestPuuid(parsed.data.puuid)) {
    return ok({ ...MOCK_LIVE_GAME, gameStartTime: Date.now() - 14 * 60 * 1000 });
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
