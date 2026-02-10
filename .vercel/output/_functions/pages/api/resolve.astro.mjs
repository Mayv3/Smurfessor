import { z } from 'zod';
import { A as ACCOUNTS } from '../../chunks/accounts_BS9-O4eu.mjs';
import { g as getAccountByRiotId, R as RiotApiError } from '../../chunks/endpoints_D2z58zB3.mjs';
import { e as MOCK_RESOLVE, f as SMURF_TEST_RESOLVE } from '../../chunks/mock-data_BDHGij8S.mjs';
import { e as err, o as ok } from '../../chunks/api-response_BJZTK7sH.mjs';
export { renderers } from '../../renderers.mjs';

const schema = z.object({ key: z.string().min(1) });
const GET = async ({ url }) => {
  const parsed = schema.safeParse({ key: url.searchParams.get("key") });
  if (!parsed.success) {
    return err("INVALID_PARAMS", 'Missing or invalid "key" parameter', 400);
  }
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
      account.riotId.tagLine
    );
    return ok({ account, puuid: riot.puuid });
  } catch (e) {
    if (e instanceof RiotApiError) {
      return err(e.code, e.detail, e.status);
    }
    return err("UNKNOWN", "Failed to resolve account", 500, String(e));
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
