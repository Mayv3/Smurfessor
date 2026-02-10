import type { APIRoute } from "astro";
import { ACCOUNTS } from "../../../config/accounts";
import {
  getAccountByRiotId,
  getSummonerByPuuid,
  getLeagueEntries,
  getChampionMasteries,
} from "../../../lib/riot/endpoints";
import { bootstrap } from "../../../lib/ddragon/index";
import { ok, err } from "../../../lib/api-response";

export const GET: APIRoute = async ({ request, url }) => {
  /* ── Auth: Vercel sends Authorization header, also accept ?secret= ── */
  const authHeader = request.headers.get("authorization");
  const secretParam = url.searchParams.get("secret");

  let expected = "";
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expected = (import.meta as any).env?.CRON_SECRET ?? process.env.CRON_SECRET ?? "";
  } catch {
    expected = "";
  }

  const isAuthorized =
    (!!expected && authHeader === `Bearer ${expected}`) ||
    (!!expected && !!secretParam && secretParam === expected);

  if (!expected || !isAuthorized) {
    return err("UNAUTHORIZED", "Invalid or missing cron secret", 401);
  }

  const errors: string[] = [];
  let refreshed = 0;

  /* ── DDragon ────────────────────────────────────────── */
  try {
    await bootstrap();
    refreshed++;
  } catch (e) {
    errors.push(`ddragon: ${String(e)}`);
  }

  /* ── Accounts ───────────────────────────────────────── */
  for (const account of ACCOUNTS) {
    try {
      const riot = await getAccountByRiotId(
        account.riotId.gameName,
        account.riotId.tagLine,
      );
      const summoner = await getSummonerByPuuid(riot.puuid);
      await Promise.all([
        getLeagueEntries(summoner.id),
        getChampionMasteries(summoner.id),
      ]);
      refreshed++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${account.key}: ${msg}`);
    }
  }

  console.log(
    `[cron/refresh] refreshed=${refreshed}/${ACCOUNTS.length + 1} errors=${errors.length}`,
  );

  return ok({ refreshed, errors, total: ACCOUNTS.length + 1 });
};
