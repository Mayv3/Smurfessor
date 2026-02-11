/**
 * Insight engine entry point.
 * Orchestrates all rule computations and produces PlayerInsights.
 */
import type { PlayerSignals, PlayerInsights, InsightSummary, Insight } from "./types";
import {
  computeSmurf,
  computeOtp,
  computeEloQuemado,
  computeLowWr,
  computeCarried,
  computeTilted,
} from "./rules";

/** Suppress an insight — zeroes score/severity so it won't show anywhere */
function suppress(i: Insight): Insight {
  return { ...i, severity: "none", score: 0 };
}

function isVisible(sev: string): boolean {
  return sev !== "none" && sev !== "low";
}

/**
 * Compute all insights for a player from their signals.
 * Pure function — no IO, no exceptions.
 */
export function computeInsights(signals: PlayerSignals): PlayerInsights {
  let smurf = computeSmurf(signals);
  const otp = computeOtp(signals);
  const eloQuemado = computeEloQuemado(signals);
  const lowWr = computeLowWr(signals);
  const carried = computeCarried(signals);
  const tilted = computeTilted(signals);

  /* ── Mutual-exclusion: escombro/elo-quemado contradicts smurf ── */
  if (isVisible(lowWr.severity) || isVisible(eloQuemado.severity)) {
    smurf = suppress(smurf);
  }

  const insights: Insight[] = [smurf, otp, eloQuemado, lowWr, carried, tilted];

  const summary: InsightSummary = {
    smurf: {
      confirmed: smurf.severity === "confirmed",
      probable: smurf.severity === "high" || smurf.severity === "medium",
      score: smurf.score,
    },
    otp: { score: otp.score },
    eloQuemado: { score: eloQuemado.score },
    lowWr: { score: lowWr.score },
    carried: { score: carried.score },
    tilted: { score: tilted.score },
  };

  return { insights, summary };
}

/** Empty insights for fallback / error cases */
export function emptyInsights(): PlayerInsights {
  return {
    insights: [],
    summary: {
      smurf: { confirmed: false, probable: false, score: 0 },
      otp: { score: 0 },
      eloQuemado: { score: 0 },
      lowWr: { score: 0 },
      carried: { score: 0 },
      tilted: { score: 0 },
    },
  };
}

export type { PlayerSignals, PlayerInsights, Insight, InsightSummary } from "./types";
export type { InsightKind, InsightSeverity, PlayerRole } from "./types";
