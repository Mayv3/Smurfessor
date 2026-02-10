import type {
  SpectatorGame,
  NormalizedLiveGame,
  NormalizedParticipant,
  SpectatorPerks,
} from "./types";

export function normalizeLiveGame(raw: SpectatorGame): NormalizedLiveGame {
  const blue: NormalizedParticipant[] = [];
  const red: NormalizedParticipant[] = [];

  for (const p of raw.participants) {
    const fullPerks: SpectatorPerks | undefined = p.perks
      ? {
          perkIds: p.perks.perkIds ?? [],
          perkStyle: p.perks.perkStyle,
          perkSubStyle: p.perks.perkSubStyle,
          perkStatShards: (p.perks as any).perkStatShards ?? undefined,
        }
      : undefined;

    const n: NormalizedParticipant = {
      puuid: p.puuid,
      riotId: p.riotId,
      championId: p.championId,
      spell1Id: p.spell1Id,
      spell2Id: p.spell2Id,
      teamId: p.teamId,
      perkKeystone: p.perks?.perkIds?.[0],
      perkPrimaryStyle: p.perks?.perkStyle,
      perkSubStyle: p.perks?.perkSubStyle,
      perks: fullPerks,
    };
    if (p.teamId === 100) blue.push(n);
    else red.push(n);
  }

  return {
    available: true,
    gameId: raw.gameId,
    gameMode: raw.gameMode,
    gameStartTime: raw.gameStartTime,
    teams: { blue, red },
  };
}
