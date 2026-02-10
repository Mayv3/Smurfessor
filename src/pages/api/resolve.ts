import type { APIRoute } from "astro";
import { z } from "zod";
import { ACCOUNTS } from "../../config/accounts";
import { getAccountByRiotId } from "../../lib/riot/endpoints";
import { RiotApiError } from "../../lib/riot/errors";
import { MOCK_RESOLVE, SMURF_TEST_RESOLVE } from "../../config/mock-data";
import { ok, err } from "../../lib/api-response";

const schema = z.object({ key: z.string().min(1) });

export const GET: APIRoute = async ({ url }) => {
  const parsed = schema.safeParse({ key: url.searchParams.get("key") });
  if (!parsed.success) {
    return err("INVALID_PARAMS", 'Missing or invalid "key" parameter', 400);
  }

  /* Mock shortcut for test accounts */
  if (parsed.data.key === "test") {
    return ok(MOCK_RESOLVE);
  }
  if (parsed.data.key === "smurf-test") {
    return ok(SMURF_TEST_RESOLVE);
  }

  const account = ACCOUNTS.find((a) => a.key === parsed.data.key);
  if (!account) {
    return err("NOT_FOUND", `Account "${parsed.data.key}" not found`, 404);
  }

  try {
    const riot = await getAccountByRiotId(
      account.riotId.gameName,
      account.riotId.tagLine,
    );
    return ok({ account, puuid: riot.puuid });
  } catch (e) {
    if (e instanceof RiotApiError) {
      return err(e.code, e.detail, e.status);
    }
    return err("UNKNOWN", "Failed to resolve account", 500, String(e));
  }
};
