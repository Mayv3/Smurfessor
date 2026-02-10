import { A as ACCOUNTS } from '../../../chunks/accounts_BS9-O4eu.mjs';
import { g as getAccountByRiotId, a as getSummonerByPuuid, b as getLeagueEntries, c as getChampionMasteries } from '../../../chunks/endpoints_D2z58zB3.mjs';
import { b as bootstrap } from '../../../chunks/index_Bk0Vuwf0.mjs';
import { e as err, o as ok } from '../../../chunks/api-response_BJZTK7sH.mjs';
export { renderers } from '../../../renderers.mjs';

const GET = async ({ request, url }) => {
  const authHeader = request.headers.get("authorization");
  const secretParam = url.searchParams.get("secret");
  let expected = "";
  try {
    expected = "change-me-to-a-long-random-string";
  } catch {
    expected = "";
  }
  const isAuthorized = !!expected && authHeader === `Bearer ${expected}` || !!expected && !!secretParam && secretParam === expected;
  if (!expected || !isAuthorized) {
    return err("UNAUTHORIZED", "Invalid or missing cron secret", 401);
  }
  const errors = [];
  let refreshed = 0;
  try {
    await bootstrap();
    refreshed++;
  } catch (e) {
    errors.push(`ddragon: ${String(e)}`);
  }
  for (const account of ACCOUNTS) {
    try {
      const riot = await getAccountByRiotId(
        account.riotId.gameName,
        account.riotId.tagLine
      );
      const summoner = await getSummonerByPuuid(riot.puuid);
      await Promise.all([
        getLeagueEntries(summoner.id),
        getChampionMasteries(summoner.id)
      ]);
      refreshed++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${account.key}: ${msg}`);
    }
  }
  console.log(
    `[cron/refresh] refreshed=${refreshed}/${ACCOUNTS.length + 1} errors=${errors.length}`
  );
  return ok({ refreshed, errors, total: ACCOUNTS.length + 1 });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
