import type { APIRoute } from "astro";
import { z } from "zod";
import { getAccountByRiotId } from "../../lib/riot/endpoints";
import { RiotApiError } from "../../lib/riot/errors";
import { ok, err } from "../../lib/api-response";

const schema = z.object({
  gameName: z.string().min(1).max(30),
  tagLine: z.string().min(1).max(10),
  platform: z.string().min(1).max(10).default("LA2"),
});

export const GET: APIRoute = async ({ url }) => {
  const parsed = schema.safeParse({
    gameName: url.searchParams.get("gameName"),
    tagLine: url.searchParams.get("tagLine"),
    platform: url.searchParams.get("platform") ?? "LA2",
  });

  if (!parsed.success) {
    return err("INVALID_PARAMS", "Se necesita gameName y tagLine", 400);
  }

  const { gameName, tagLine, platform } = parsed.data;

  try {
    const riot = await getAccountByRiotId(gameName, tagLine, platform);
    return ok({
      account: {
        riotId: { gameName, tagLine },
        platform,
      },
      puuid: riot.puuid,
    });
  } catch (e) {
    if (e instanceof RiotApiError) {
      if (e.status === 404) {
        return err("NOT_FOUND", `No se encontró "${gameName}#${tagLine}"`, 404);
      }
      return err(e.code, e.detail, e.status);
    }
    return err("UNKNOWN", "Error buscando la cuenta", 500, String(e));
  }
};
