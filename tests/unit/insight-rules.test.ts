import { describe, it, expect } from "vitest";
import {
  computeSmurf,
  computeOtp,
  computeEloQuemado,
  computeLowWr,
  computeCarried,
  computeTilted,
} from "../../src/lib/insights/rules";
import { computeInsights, emptyInsights } from "../../src/lib/insights";
import type { PlayerSignals, RecentSignals, RankedSignals } from "../../src/lib/insights/types";

/* ── Helpers ──────────────────────────────────────────── */
function baseSignals(overrides?: Partial<PlayerSignals>): PlayerSignals {
  return {
    summonerLevel: 100,
    ranked: null,
    currentChampionId: 1,
    currentRole: "MIDDLE",
    recent: null,
    champRecent: null,
    mastery: null,
    ...overrides,
  };
}

function rankedEntry(wins: number, losses: number, tier = "GOLD", opts?: Partial<RankedSignals>): RankedSignals {
  return {
    queue: "RANKED_SOLO_5x5",
    tier,
    rank: "II",
    lp: 50,
    wins,
    losses,
    hotStreak: false,
    freshBlood: false,
    veteran: false,
    inactive: false,
    ...opts,
  };
}

function recentData(matches: number, wins: number, opts?: Partial<RecentSignals>): RecentSignals {
  return {
    window: 20,
    matches,
    wins,
    losses: matches - wins,
    winrate: matches > 0 ? wins / matches : 0,
    streak: { type: "W", count: 0 },
    champPool: [{ championId: 1, games: matches, winrate: matches > 0 ? wins / matches : 0 }],
    rolePool: [{ role: "MIDDLE", games: matches }],
    avg: {
      kda: 3,
      deaths: 4,
      csPerMin: 7.5,
      goldPerMin: 400,
      damagePerMin: 800,
      visionPerMin: 1.2,
    },
    ...opts,
  };
}

/* ══════════════════════════════════════════════════════════
   SMURF
   ══════════════════════════════════════════════════════════ */
describe("computeSmurf", () => {
  it("returns none for unranked player", () => {
    const r = computeSmurf(baseSignals());
    expect(r.severity).toBe("none");
    expect(r.score).toBe(0);
  });

  it("returns none for average ranked player", () => {
    const r = computeSmurf(baseSignals({ ranked: rankedEntry(50, 50) }));
    expect(r.severity).toBe("none");
    expect(r.score).toBe(0);
  });

  it("flags high WR + low level as smurf", () => {
    const s = baseSignals({
      summonerLevel: 40,
      ranked: rankedEntry(40, 10, "GOLD", { hotStreak: true, freshBlood: true }),
      recent: recentData(15, 12, {
        avg: { kda: 5, deaths: 2, csPerMin: 9, goldPerMin: 500, damagePerMin: 1000, visionPerMin: 1.5 },
      }),
    });
    const r = computeSmurf(s);
    expect(r.score).toBeGreaterThanOrEqual(60);
    expect(["high", "confirmed"]).toContain(r.severity);
    expect(r.reasons.length).toBeGreaterThan(0);
  });

  it("produces confirmed for extreme case (WR 75%, level 30, hot streak)", () => {
    const s = baseSignals({
      summonerLevel: 30,
      ranked: rankedEntry(60, 20, "PLATINUM", { hotStreak: true, freshBlood: true }),
      recent: recentData(18, 15, {
        avg: { kda: 6.5, deaths: 1.5, csPerMin: 9.5, goldPerMin: 550, damagePerMin: 1200, visionPerMin: 1.8 },
      }),
    });
    const r = computeSmurf(s);
    expect(r.score).toBeGreaterThanOrEqual(85);
    expect(r.confidence).toBeGreaterThanOrEqual(0.4);
  });

  it("includes sample metadata", () => {
    const r = computeSmurf(baseSignals({
      ranked: rankedEntry(40, 10),
      recent: recentData(15, 10),
    }));
    expect(r.sample.rankedGames).toBe(50);
    expect(r.sample.recentMatches).toBe(15);
  });
});

/* ══════════════════════════════════════════════════════════
   OTP
   ══════════════════════════════════════════════════════════ */
describe("computeOtp", () => {
  it("returns none with no recent data", () => {
    const r = computeOtp(baseSignals());
    expect(r.severity).toBe("none");
  });

  it("flags player with 80%+ on one champ as OTP", () => {
    const total = 20;
    const champGames = 17;
    const s = baseSignals({
      recent: recentData(total, 12, {
        champPool: [
          { championId: 1, games: champGames, winrate: 0.7 },
          { championId: 2, games: total - champGames, winrate: 0.5 },
        ],
      }),
      champRecent: { championId: 1, games: champGames, wins: 12, losses: 5, winrate: 0.7 },
      mastery: {
        top: [
          { championId: 1, points: 500000, level: 7 },
          { championId: 2, points: 30000, level: 5 },
        ],
      },
    });
    const r = computeOtp(s);
    expect(r.score).toBeGreaterThanOrEqual(40);
    expect(["medium", "high", "confirmed"]).toContain(r.severity);
  });

  it("returns low/none for diverse champ pool", () => {
    const s = baseSignals({
      recent: recentData(20, 10, {
        champPool: [
          { championId: 1, games: 4, winrate: 0.5 },
          { championId: 2, games: 4, winrate: 0.5 },
          { championId: 3, games: 4, winrate: 0.5 },
          { championId: 4, games: 4, winrate: 0.5 },
          { championId: 5, games: 4, winrate: 0.5 },
        ],
      }),
    });
    const r = computeOtp(s);
    expect(r.score).toBeLessThan(30);
  });
});

/* ══════════════════════════════════════════════════════════
   ELO_QUEMADO
   ══════════════════════════════════════════════════════════ */
describe("computeEloQuemado", () => {
  it("returns none for low games (<80)", () => {
    const r = computeEloQuemado(baseSignals({ ranked: rankedEntry(30, 30) }));
    expect(r.severity).toBe("none");
  });

  it("flags 500+ games with 48% WR as elo quemado", () => {
    const s = baseSignals({
      ranked: rankedEntry(240, 260),
      recent: recentData(15, 6),
    });
    const r = computeEloQuemado(s);
    expect(r.score).toBeGreaterThanOrEqual(40);
    expect(["medium", "high"]).toContain(r.severity);
    expect(r.reasons.length).toBeGreaterThan(0);
  });

  it("flags 300+ games with sub-50 WR", () => {
    const s = baseSignals({
      ranked: rankedEntry(140, 170),
      recent: recentData(15, 5, { streak: { type: "L", count: 4 } }),
    });
    const r = computeEloQuemado(s);
    expect(r.score).toBeGreaterThanOrEqual(30);
  });
});

/* ══════════════════════════════════════════════════════════
   LOW_WR
   ══════════════════════════════════════════════════════════ */
describe("computeLowWr", () => {
  it("returns none for decent WR", () => {
    const r = computeLowWr(baseSignals({ ranked: rankedEntry(55, 45) }));
    expect(r.severity).toBe("none");
  });

  it("flags 40% ranked + recent WR", () => {
    const s = baseSignals({
      ranked: rankedEntry(40, 60),
      recent: recentData(15, 5, {
        avg: { kda: 1.5, deaths: 7, csPerMin: 5, goldPerMin: 300, damagePerMin: 500, visionPerMin: 0.5 },
      }),
    });
    const r = computeLowWr(s);
    expect(r.score).toBeGreaterThanOrEqual(40);
    expect(r.severity).not.toBe("none");
  });
});

/* ══════════════════════════════════════════════════════════
   CARRIED
   ══════════════════════════════════════════════════════════ */
describe("computeCarried", () => {
  it("returns none normally", () => {
    const r = computeCarried(baseSignals({ ranked: rankedEntry(50, 50) }));
    expect(r.severity).toBe("none");
  });

  it("flags high WR + low KDA", () => {
    const s = baseSignals({
      ranked: rankedEntry(60, 40),
      recent: recentData(15, 10, {
        avg: { kda: 1.2, deaths: 8, csPerMin: 5, goldPerMin: 300, damagePerMin: 400, visionPerMin: 0.5 },
      }),
    });
    const r = computeCarried(s);
    expect(r.score).toBeGreaterThanOrEqual(30);
  });
});

/* ══════════════════════════════════════════════════════════
   TILTED
   ══════════════════════════════════════════════════════════ */
describe("computeTilted", () => {
  it("returns none for no loss streak", () => {
    const s = baseSignals({
      recent: recentData(15, 10, { streak: { type: "W", count: 3 } }),
    });
    const r = computeTilted(s);
    expect(r.severity).toBe("none");
  });

  it("flags 6-game loss streak + low WR", () => {
    const s = baseSignals({
      recent: recentData(15, 3, {
        streak: { type: "L", count: 6 },
        winrate: 0.2,
      }),
    });
    const r = computeTilted(s);
    expect(r.score).toBeGreaterThanOrEqual(50);
    expect(["medium", "high"]).toContain(r.severity);
  });
});

/* ══════════════════════════════════════════════════════════
   Orchestrator
   ══════════════════════════════════════════════════════════ */
describe("computeInsights", () => {
  it("returns 6 insights for any signals", () => {
    const result = computeInsights(baseSignals());
    expect(result.insights).toHaveLength(6);
    expect(result.summary.smurf.confirmed).toBe(false);
  });

  it("summary reflects smurf confirmed", () => {
    const s = baseSignals({
      summonerLevel: 30,
      ranked: rankedEntry(60, 20, "PLATINUM", { hotStreak: true, freshBlood: true }),
      recent: recentData(18, 15, {
        avg: { kda: 6.5, deaths: 1.5, csPerMin: 9.5, goldPerMin: 550, damagePerMin: 1200, visionPerMin: 1.8 },
      }),
    });
    const result = computeInsights(s);
    expect(result.summary.smurf.score).toBeGreaterThanOrEqual(60);
  });
});

describe("emptyInsights", () => {
  it("returns zero scores", () => {
    const e = emptyInsights();
    expect(e.insights).toHaveLength(0);
    expect(e.summary.smurf.score).toBe(0);
    expect(e.summary.otp.score).toBe(0);
    expect(e.summary.tilted.score).toBe(0);
  });
});

/* ══════════════════════════════════════════════════════════
   Edge cases
   ══════════════════════════════════════════════════════════ */
describe("edge cases", () => {
  it("handles empty PlayerSignals without crashing", () => {
    const result = computeInsights({});
    expect(result.insights).toHaveLength(6);
  });

  it("handles null ranked without crashing", () => {
    const r = computeSmurf(baseSignals({ ranked: null }));
    expect(r.score).toBe(0);
  });

  it("handles zero games without division errors", () => {
    const s = baseSignals({
      ranked: rankedEntry(0, 0),
      recent: recentData(0, 0),
    });
    const result = computeInsights(s);
    for (const insight of result.insights) {
      expect(Number.isFinite(insight.score)).toBe(true);
      expect(Number.isFinite(insight.confidence)).toBe(true);
    }
  });

  it("handles undefined recent avg fields", () => {
    const s = baseSignals({
      recent: {
        window: 20,
        matches: 5,
        wins: 3,
        losses: 2,
        winrate: 0.6,
        streak: { type: "W", count: 2 },
        champPool: [],
        rolePool: [],
        avg: {
          kda: null,
          deaths: null,
          csPerMin: null,
          goldPerMin: null,
          damagePerMin: null,
          visionPerMin: null,
        },
      },
    });
    const result = computeInsights(s);
    for (const insight of result.insights) {
      expect(Number.isFinite(insight.score)).toBe(true);
    }
  });
});
