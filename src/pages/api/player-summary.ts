import type { APIRoute } from "astro";
import { z } from "zod";
import {
  getSummonerByPuuid,
  getLeagueEntries,
  getChampionMasteries,
} from "../../lib/riot/endpoints";
import { RiotApiError } from "../../lib/riot/errors";
import { isTestPuuid, isSmurfTestPuuid, getMockPlayerSummary, getSmurfMockPlayerSummary } from "../../config/mock-data";
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

  /* Mock shortcut for smurf-test puuids */
  if (isSmurfTestPuuid(parsed.data.puuid)) {
    const mock = getSmurfMockPlayerSummary(parsed.data.puuid);
    if (mock) return ok(mock);
  }

  /* Mock shortcut for legacy test puuids */
  if (isTestPuuid(parsed.data.puuid)) {
    const mock = getMockPlayerSummary(parsed.data.puuid);
    if (mock) return ok(mock);
  }

  try {
    const summoner = await getSummonerByPuuid(parsed.data.puuid);

    const [entries, masteries] = await Promise.all([
      getLeagueEntries(parsed.data.puuid),
      getChampionMasteries(parsed.data.puuid),
    ]);

    const soloQueue =
      entries.find((e) => e.queueType === "RANKED_SOLO_5x5") ?? null;
    const flexQueue =
      entries.find((e) => e.queueType === "RANKED_FLEX_SR") ?? null;
    const topMasteries = [...masteries]
      .sort((a, b) => b.championPoints - a.championPoints)
      .slice(0, 3);

    return ok({
      puuid: parsed.data.puuid,
      riotId: summoner.name ?? "",
      profileIconId: summoner.profileIconId,
      summonerLevel: summoner.summonerLevel,
      soloQueue,
      flexQueue,
      topMasteries,
    });
  } catch (e) {
    if (e instanceof RiotApiError) {
      return err(e.code, e.detail, e.status);
    }
    return err("UNKNOWN", "Failed to fetch player summary", 500, String(e));
  }
};
