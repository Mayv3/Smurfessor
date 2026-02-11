/**
 * Configurable thresholds & weights for the Insights engine.
 * All magic numbers live here — tune freely.
 *
 * KEY CONSTRAINTS (keep in sync with match-stats.ts & signals.ts):
 *   • MAX_MATCH_DETAILS = 10  → "recent" signals are based on at most 10 games
 *   • Window = 7 days         → a typical account plays 15-20 ranked/week
 *   • Ranked totals (from League-V4) cover the entire split/season
 */

/* ── Confidence scaling ──────────────────────────────── */
export const CONFIDENCE = {
  /** How many recent matches = full confidence (1.0) — capped by MAX_MATCH_DETAILS */
  recentMatchesFull: 10,
  /** How many ranked games = full confidence (1.0) */
  rankedGamesFull: 40,
  /** How many champ games = full confidence (1.0) */
  champGamesFull: 8,
  /** Minimum recent matches to allow "confirmed" severity */
  recentMinForConfirmed: 6,
  /** Minimum ranked games to allow "confirmed" ELO_QUEMADO */
  rankedMinForConfirmed: 50,
} as const;

/* ── Match filtering ─────────────────────────────────── */
export const MATCH_FILTER = {
  /** Minimum game duration in seconds (exclude remakes) */
  minDurationSeconds: 600,
  /** Recent window size (aligned with MAX_MATCH_DETAILS) */
  recentWindowSize: 10,
} as const;

/* ── A) SMURF thresholds ─────────────────────────────── */
export const SMURF = {
  // Ranked WR (season totals from League-V4)
  rankedGamesMin: 10,
  rankedWrBase: 0.6,       // +35 pts
  rankedWrHigh: 0.65,       // +15 extra pts
  rankedWrBasePoints: 35,
  rankedWrHighPoints: 15,
  // Hot streak / fresh blood
  hotStreakPoints: 10,
  freshBloodPoints: 5,
  // Level
  levelLow: 80,             // +10 pts
  levelVeryLow: 50,         // +15 extra pts
  levelLowPoints: 10,
  levelVeryLowPoints: 15,
  // Recent (Match-V5, max 10 details)
  recentMatchesMin: 5,
  recentWrHigh: 0.65,       // +20 pts
  recentWrHighPoints: 20,
  recentKdaHigh: 3.5,       // +10 pts
  recentKdaPoints: 10,
  // CS/min role-aware
  csPerMinLane: 6.5,        // TOP/MID/ADC
  csPerMinJg: 5.5,          // JG
  visionPerMinSup: 1.2,     // SUP
  csRolePoints: 8,
  // Champ dominance
  champGamesMin: 3,
  champWrHigh: 0.7,
  champDominancePoints: 15,
  champPoolTopShareHigh: 0.55,
  champPoolTopWrHigh: 0.6,
  champPoolPoints: 10,
  // Low WR penalty — strong evidence against smurf
  lowWrPenaltyThreshold: 0.47,   // WR < 47% → penalize
  lowWrPenaltyPoints: 40,        // heavy penalty to cancel most signals
  // Severity
  confirmedMin: 85,
  confirmedConfidenceMin: 0.55,
  highMin: 70,
  mediumMin: 50,
} as const;

/* ── B) OTP thresholds ───────────────────────────────── */
export const OTP = {
  recentMatchesMin: 6,
  topShareBase: 0.65,        // +50 pts
  topShareBasePoints: 50,
  topShareHigh: 0.75,        // +15 pts
  topShareHighPoints: 15,
  // Mastery gap
  masteryGapMultiplier: 2,   // top1 >= 2x second
  masteryGapPoints: 15,
  // Performance split
  wrSplitDiff: 0.1,         // top1 wr - overall wr
  wrSplitPoints: 10,
  // Severity
  highMin: 75,
  mediumMin: 55,
  // Confidence gating — block "high" with very few matches
  lowSampleMatchesMax: 5,
} as const;

/* ── C) ELO_QUEMADO thresholds ───────────────────────── */
export const ELO_QUEMADO = {
  rankedGamesBase: 150,      // +25 pts
  rankedGamesBasePoints: 25,
  rankedGamesHigh: 250,      // +15 extra pts
  rankedGamesHighPoints: 15,
  rankedWrLow: 0.48,         // +25 pts with rankedGames>=60
  rankedWrLowGamesMin: 60,
  rankedWrLowPoints: 25,
  rankedWrVeryLow: 0.45,     // +15 extra pts
  rankedWrVeryLowPoints: 15,
  // Recent trend (max 10 details)
  recentMatchesMin: 5,
  recentWrLow: 0.42,         // +20 pts
  recentWrLowPoints: 20,
  streakLossMin: 4,           // +10 pts
  streakLossPoints: 10,
  // Severity
  highMin: 75,
  mediumMin: 55,
  // Minimum ranked games to even consider
  rankedGamesMinForLabel: 40,
} as const;

/* ── D) LOW_WR / LOW_PERFORMANCE thresholds ──────────── */
export const LOW_WR = {
  rankedGamesMin: 15,
  rankedWrLow: 0.45,         // +45 pts
  rankedWrBasePoints: 45,
  rankedWrVeryLow: 0.4,     // +15 extra pts
  rankedWrVeryLowPoints: 15,
  // Recent (max 10 details)
  recentMatchesMin: 5,
  recentWrLow: 0.4,         // +20 pts
  recentWrLowPoints: 20,
  // Role-aware CS/perf lows
  csPerMinLowLane: 5.2,      // TOP/MID/ADC below this
  visionPerMinLowSup: 0.7,   // SUP below this
  rolePoints: 10,
  kdaLow: 1.5,               // +10 pts
  kdaLowPoints: 10,
  // Severity
  highMin: 75,
  mediumMin: 55,
} as const;

/* ── E) CARRIED / BOOSTED thresholds ─────────────────── */
export const CARRIED = {
  rankedWrHigh: 0.58,
  kdaLow: 1.4,
  recentMatchesMin: 6,
  basePoints: 65,
  highMin: 70,
  mediumMin: 50,
} as const;

/* ── F) TILTED thresholds ────────────────────────────── */
export const TILTED = {
  streakLossHigh: 5,          // +60 pts
  streakLossHighPoints: 60,
  recentWrVeryLow: 0.3,     // +25 pts
  recentWrVeryLowMatchesMin: 5,
  recentWrVeryLowPoints: 25,
  highMin: 70,
  mediumMin: 50,
} as const;
