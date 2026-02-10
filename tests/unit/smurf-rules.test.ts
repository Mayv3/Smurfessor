import { describe, it, expect } from "vitest";
import { computeSmurfAssessment } from "../../src/lib/smurf/rules";
import type { SmurfInput } from "../../src/lib/smurf/rules";

describe("computeSmurfAssessment", () => {
  /* ── Rule 1: summonerLevel < 50 => confirmed ── */
  it("flags level < 50 as confirmed smurf", () => {
    const input: SmurfInput = {
      summonerLevel: 30,
      rankedWinrate: null,
      championWinrate: null,
      championSampleSize: 0,
    };
    const result = computeSmurfAssessment(input);
    expect(result.severity).toBe("confirmed");
    expect(result.probability).toBe(100);
    expect(result.label).toBe("SMURF 100%");
    expect(result.reasons.length).toBeGreaterThanOrEqual(1);
    expect(result.reasons[0]).toContain("Nivel 30");
  });

  it("flags level 1 as confirmed", () => {
    const result = computeSmurfAssessment({
      summonerLevel: 1,
      rankedWinrate: null,
      championWinrate: null,
      championSampleSize: 0,
    });
    expect(result.severity).toBe("confirmed");
    expect(result.probability).toBe(100);
  });

  it("does NOT flag level 50 (boundary — not less than)", () => {
    const result = computeSmurfAssessment({
      summonerLevel: 50,
      rankedWinrate: null,
      championWinrate: null,
      championSampleSize: 0,
    });
    expect(result.severity).toBe("none");
  });

  /* ── Rule 2: level 100–120 => possible ── */
  it("flags level 100 as possible smurf", () => {
    const result = computeSmurfAssessment({
      summonerLevel: 100,
      rankedWinrate: null,
      championWinrate: null,
      championSampleSize: 0,
    });
    expect(result.severity).toBe("possible");
    expect(result.probability).toBe(55);
    expect(result.label).toBe("Posible smurf");
  });

  it("flags level 110 as possible", () => {
    const result = computeSmurfAssessment({
      summonerLevel: 110,
      rankedWinrate: null,
      championWinrate: null,
      championSampleSize: 0,
    });
    expect(result.severity).toBe("possible");
    expect(result.probability).toBe(55);
  });

  it("flags level 120 as possible (inclusive boundary)", () => {
    const result = computeSmurfAssessment({
      summonerLevel: 120,
      rankedWinrate: null,
      championWinrate: null,
      championSampleSize: 0,
    });
    expect(result.severity).toBe("possible");
  });

  it("does NOT flag level 121", () => {
    const result = computeSmurfAssessment({
      summonerLevel: 121,
      rankedWinrate: null,
      championWinrate: null,
      championSampleSize: 0,
    });
    expect(result.severity).toBe("none");
  });

  it("does NOT flag level 99", () => {
    const result = computeSmurfAssessment({
      summonerLevel: 99,
      rankedWinrate: null,
      championWinrate: null,
      championSampleSize: 0,
    });
    // level 99 is >= 50, so rule 1 does not trigger; and 99 < 100, so rule 2 does not trigger
    expect(result.severity).toBe("none");
  });

  /* ── Rule 3: rankedWinrate >= 60% => confirmed ── */
  it("flags ranked winrate 60% as confirmed", () => {
    const result = computeSmurfAssessment({
      summonerLevel: 200,
      rankedWinrate: 0.6,
      championWinrate: null,
      championSampleSize: 0,
    });
    expect(result.severity).toBe("confirmed");
    expect(result.probability).toBe(100);
    expect(result.reasons.some((r) => r.includes("Winrate ranked 60%"))).toBe(true);
  });

  it("flags ranked winrate 72% as confirmed", () => {
    const result = computeSmurfAssessment({
      summonerLevel: 180,
      rankedWinrate: 0.72,
      championWinrate: null,
      championSampleSize: 0,
    });
    expect(result.severity).toBe("confirmed");
    expect(result.probability).toBe(100);
  });

  it("does NOT flag ranked winrate 59%", () => {
    const result = computeSmurfAssessment({
      summonerLevel: 200,
      rankedWinrate: 0.59,
      championWinrate: null,
      championSampleSize: 0,
    });
    expect(result.severity).toBe("none");
  });

  /* ── Rule 4: championWinrate >= 80% with sample >= 8 => confirmed ── */
  it("flags champion winrate 80% with 8 games as confirmed", () => {
    const result = computeSmurfAssessment({
      summonerLevel: 200,
      rankedWinrate: 0.5,
      championWinrate: 0.8,
      championSampleSize: 8,
    });
    expect(result.severity).toBe("confirmed");
    expect(result.probability).toBe(100);
    expect(result.reasons.some((r) => r.includes("Winrate con campeón actual 80%"))).toBe(true);
  });

  it("flags champion winrate 90% with 10 games as confirmed", () => {
    const result = computeSmurfAssessment({
      summonerLevel: 200,
      rankedWinrate: 0.5,
      championWinrate: 0.9,
      championSampleSize: 10,
    });
    expect(result.severity).toBe("confirmed");
  });

  it("does NOT flag champion winrate 80% with only 5 games (insufficient sample)", () => {
    const result = computeSmurfAssessment({
      summonerLevel: 200,
      rankedWinrate: 0.5,
      championWinrate: 0.8,
      championSampleSize: 5,
    });
    expect(result.severity).toBe("none");
    expect(result.reasons.some((r) => r.includes("insuficiente"))).toBe(true);
  });

  it("does NOT flag champion winrate 79% even with enough games", () => {
    const result = computeSmurfAssessment({
      summonerLevel: 200,
      rankedWinrate: 0.5,
      championWinrate: 0.79,
      championSampleSize: 20,
    });
    expect(result.severity).toBe("none");
  });

  /* ── Combination rules ── */
  it("confirmed overrides possible (level 30 + level in 100-120 impossible, but WR + level)", () => {
    // level 30 confirmed + ranked WR 70% confirmed
    const result = computeSmurfAssessment({
      summonerLevel: 30,
      rankedWinrate: 0.7,
      championWinrate: null,
      championSampleSize: 0,
    });
    expect(result.severity).toBe("confirmed");
    expect(result.probability).toBe(100);
    expect(result.reasons.length).toBe(2);
  });

  it("multiple confirmed reasons are all included", () => {
    const result = computeSmurfAssessment({
      summonerLevel: 25,
      rankedWinrate: 0.65,
      championWinrate: 0.85,
      championSampleSize: 10,
    });
    expect(result.severity).toBe("confirmed");
    expect(result.reasons.length).toBe(3);
  });

  /* ── No smurf ── */
  it("returns 'No smurf' for normal player", () => {
    const result = computeSmurfAssessment({
      summonerLevel: 250,
      rankedWinrate: 0.52,
      championWinrate: null,
      championSampleSize: 0,
    });
    expect(result.severity).toBe("none");
    expect(result.probability).toBe(0);
    expect(result.label).toBe("No smurf");
  });

  /* ── Insufficient data ── */
  it("returns 'Datos insuficientes' when all null", () => {
    const result = computeSmurfAssessment({
      summonerLevel: null,
      rankedWinrate: null,
      championWinrate: null,
      championSampleSize: 0,
    });
    expect(result.severity).toBe("none");
    expect(result.label).toBe("Datos insuficientes");
  });
});
