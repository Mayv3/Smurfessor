import { describe, it, expect } from "vitest";
import { normalizeLiveGame } from "../../src/lib/riot/normalize";
import type { SpectatorGame } from "../../src/lib/riot/types";

function mockGame(participants: SpectatorGame["participants"]): SpectatorGame {
  return {
    gameId: 99999,
    gameType: "MATCHED_GAME",
    gameStartTime: Date.now(),
    mapId: 11,
    gameLength: 300,
    platformId: "LA2",
    gameMode: "CLASSIC",
    participants,
  };
}

describe("normalizeLiveGame", () => {
  it("splits participants into blue (100) and red (200) teams", () => {
    const raw = mockGame([
      { puuid: "p1", riotId: "A#1", championId: 1, spell1Id: 4, spell2Id: 14, teamId: 100, profileIconId: 1, summonerId: "s1" },
      { puuid: "p2", riotId: "B#2", championId: 2, spell1Id: 4, spell2Id: 12, teamId: 100, profileIconId: 2, summonerId: "s2" },
      { puuid: "p3", riotId: "C#3", championId: 3, spell1Id: 4, spell2Id: 7, teamId: 200, profileIconId: 3, summonerId: "s3" },
    ]);

    const result = normalizeLiveGame(raw);

    expect(result.available).toBe(true);
    expect(result.gameId).toBe(99999);
    expect(result.gameMode).toBe("CLASSIC");
    expect(result.teams.blue).toHaveLength(2);
    expect(result.teams.red).toHaveLength(1);
    expect(result.teams.blue[0].puuid).toBe("p1");
    expect(result.teams.blue[1].puuid).toBe("p2");
    expect(result.teams.red[0].puuid).toBe("p3");
  });

  it("handles full 5v5 game", () => {
    const players = Array.from({ length: 10 }, (_, i) => ({
      puuid: `p${i}`,
      riotId: `Player${i}#${i}`,
      championId: i + 1,
      spell1Id: 4,
      spell2Id: 14,
      teamId: i < 5 ? 100 : 200,
      profileIconId: i,
      summonerId: `s${i}`,
    }));

    const result = normalizeLiveGame(mockGame(players));

    expect(result.teams.blue).toHaveLength(5);
    expect(result.teams.red).toHaveLength(5);
  });

  it("handles empty participants", () => {
    const result = normalizeLiveGame(mockGame([]));
    expect(result.teams.blue).toHaveLength(0);
    expect(result.teams.red).toHaveLength(0);
  });

  it("preserves spell and champion ids", () => {
    const raw = mockGame([
      { puuid: "px", riotId: "X#0", championId: 245, spell1Id: 4, spell2Id: 14, teamId: 100, profileIconId: 1, summonerId: "sx" },
    ]);

    const result = normalizeLiveGame(raw);
    const player = result.teams.blue[0];

    expect(player.championId).toBe(245);
    expect(player.spell1Id).toBe(4);
    expect(player.spell2Id).toBe(14);
  });
});
