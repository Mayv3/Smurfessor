/**
 * Insight rules engine — pure functions, zero IO.
 * Each compute* fn takes PlayerSignals → Insight.
 */
import type {
  Insight,
  InsightSeverity,
  PlayerSignals,
  PlayerRole,
} from "./types";
import * as CFG from "../../config/insights";

/* ── Helpers ──────────────────────────────────────────── */
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const safeDiv = (a: number, b: number, fallback = 0) => (b === 0 ? fallback : a / b);
const pct = (v: number) => Math.round(v * 100);

function rankedGames(s: PlayerSignals): number {
  return (s.ranked?.wins ?? 0) + (s.ranked?.losses ?? 0);
}
function rankedWr(s: PlayerSignals): number | null {
  const g = rankedGames(s);
  return g > 0 ? safeDiv(s.ranked?.wins ?? 0, g) : null;
}

/* ── Confidence builders ──────────────────────────────── */
function confidenceRecent(s: PlayerSignals): number {
  return clamp(safeDiv(s.recent?.matches ?? 0, CFG.CONFIDENCE.recentMatchesFull), 0, 1);
}
function confidenceRanked(s: PlayerSignals): number {
  return clamp(safeDiv(rankedGames(s), CFG.CONFIDENCE.rankedGamesFull), 0, 1);
}
function confidenceChamp(s: PlayerSignals): number {
  return clamp(safeDiv(s.champRecent?.games ?? 0, CFG.CONFIDENCE.champGamesFull), 0, 1);
}

/** Weighted average of confidence values (non-zero only) */
function confidenceWeighted(weights: Array<[number, number]>): number {
  let sumW = 0;
  let sumV = 0;
  for (const [c, w] of weights) {
    if (w > 0) { sumW += w; sumV += c * w; }
  }
  return sumW > 0 ? clamp(sumV / sumW, 0, 1) : 0;
}

function severityFromScore(
  score: number,
  highMin: number,
  mediumMin: number,
  confidence?: number,
  confirmedMin?: number,
  confirmedConfidence?: number,
): InsightSeverity {
  if (confirmedMin != null && confirmedConfidence != null) {
    if (score >= confirmedMin && (confidence ?? 0) >= confirmedConfidence) return "confirmed";
  }
  if (score >= highMin) return "high";
  if (score >= mediumMin) return "medium";
  if (score > 0) return "low";
  return "none";
}

/** Is the role a CS-farming lane? */
function isLane(role?: PlayerRole): boolean {
  return role === "TOP" || role === "MIDDLE" || role === "BOTTOM";
}

/* ═══════════════════════════════════════════════════════════
   A) SMURF — helper scorers
   ═══════════════════════════════════════════════════════════ */
type ScoreAccum = { score: number; reasons: string[] };

function scoreSmurfRanked(s: PlayerSignals, T: typeof CFG.SMURF, rGames: number, rWr: number | null, acc: ScoreAccum) {
  if (rGames >= T.rankedGamesMin && rWr !== null) {
    if (rWr >= T.rankedWrBase) {
      acc.score += T.rankedWrBasePoints;
      acc.reasons.push(`WR ranked ${pct(rWr)}% en ${rGames} partidas (≥${pct(T.rankedWrBase)}%)`);
    }
    if (rWr >= T.rankedWrHigh) {
      acc.score += T.rankedWrHighPoints;
      acc.reasons.push(`WR ranked muy alto: ${pct(rWr)}% (≥${pct(T.rankedWrHigh)}%)`);
    }
  }
  if (s.ranked?.hotStreak) { acc.score += T.hotStreakPoints; acc.reasons.push("Racha de victorias activa"); }
  if (s.ranked?.freshBlood) { acc.score += T.freshBloodPoints; acc.reasons.push("Cuenta recién rankeada"); }
}

function scoreSmurfLevel(s: PlayerSignals, T: typeof CFG.SMURF, acc: ScoreAccum) {
  if (s.summonerLevel == null) return;
  if (s.summonerLevel <= T.levelVeryLow) {
    acc.score += T.levelLowPoints + T.levelVeryLowPoints;
    acc.reasons.push(`Nivel ${s.summonerLevel} (≤${T.levelVeryLow}) — cuenta muy nueva`);
  } else if (s.summonerLevel <= T.levelLow) {
    acc.score += T.levelLowPoints;
    acc.reasons.push(`Nivel ${s.summonerLevel} (≤${T.levelLow}) — cuenta nueva`);
  }
}

function scoreSmurfRecent(s: PlayerSignals, T: typeof CFG.SMURF, acc: ScoreAccum) {
  if (!s.recent || s.recent.matches < T.recentMatchesMin) return;

  if (s.recent.winrate >= T.recentWrHigh) {
    acc.score += T.recentWrHighPoints;
    acc.reasons.push(`WR reciente ${pct(s.recent.winrate)}% en ${s.recent.matches} partidas`);
  }
  if (s.recent.avg.kda != null && s.recent.avg.kda >= T.recentKdaHigh) {
    acc.score += T.recentKdaPoints;
    acc.reasons.push(`KDA promedio ${s.recent.avg.kda.toFixed(1)} (≥${T.recentKdaHigh})`);
  }
  const role = s.currentRole ?? "UNKNOWN";
  if (isLane(role) && s.recent.avg.csPerMin != null && s.recent.avg.csPerMin >= T.csPerMinLane) {
    acc.score += T.csRolePoints;
    acc.reasons.push(`CS/min ${s.recent.avg.csPerMin.toFixed(1)} alto para ${role}`);
  } else if (role === "JUNGLE" && s.recent.avg.csPerMin != null && s.recent.avg.csPerMin >= T.csPerMinJg) {
    acc.score += T.csRolePoints;
    acc.reasons.push(`CS/min ${s.recent.avg.csPerMin.toFixed(1)} alto para JG`);
  } else if (role === "UTILITY" && s.recent.avg.visionPerMin != null && s.recent.avg.visionPerMin >= T.visionPerMinSup) {
    acc.score += T.csRolePoints;
    acc.reasons.push(`Visión/min ${s.recent.avg.visionPerMin.toFixed(1)} alto para SUP`);
  }
}

function scoreSmurfChamp(s: PlayerSignals, T: typeof CFG.SMURF, acc: ScoreAccum) {
  if (s.champRecent && s.champRecent.games >= T.champGamesMin && s.champRecent.winrate >= T.champWrHigh) {
    acc.score += T.champDominancePoints;
    acc.reasons.push(`WR ${pct(s.champRecent.winrate)}% con campeón actual en ${s.champRecent.games} partidas`);
  }
  if (s.recent && s.recent.champPool.length > 0) {
    const top1 = s.recent.champPool[0];
    const share = safeDiv(top1.games, s.recent.matches);
    if (share >= T.champPoolTopShareHigh && top1.winrate >= T.champPoolTopWrHigh) {
      acc.score += T.champPoolPoints;
      acc.reasons.push(`Pool: ${pct(share)}% partidas en 1 campeón con ${pct(top1.winrate)}% WR`);
    }
  }
}

export function computeSmurf(s: PlayerSignals): Insight {
  const T = CFG.SMURF;
  const rGames = rankedGames(s);
  const rWr = rankedWr(s);
  const acc: ScoreAccum = { score: 0, reasons: [] };

  scoreSmurfRanked(s, T, rGames, rWr, acc);
  scoreSmurfLevel(s, T, acc);
  scoreSmurfRecent(s, T, acc);
  scoreSmurfChamp(s, T, acc);

  acc.score = clamp(acc.score, 0, 100);

  const confidence = confidenceWeighted([
    [confidenceRanked(s), 3],
    [confidenceRecent(s), 2],
    [confidenceChamp(s), 1],
  ]);

  const canConfirm = (s.recent?.matches ?? 0) >= CFG.CONFIDENCE.recentMinForConfirmed || rGames >= 30;
  const severity = severityFromScore(
    acc.score,
    T.highMin,
    T.mediumMin,
    confidence,
    canConfirm ? T.confirmedMin : undefined,
    canConfirm ? T.confirmedConfidenceMin : undefined,
  );

  if (acc.reasons.length === 0) acc.reasons.push("Ninguna señal de smurf detectada");

  return { kind: "SMURF", score: acc.score, confidence, severity, reasons: acc.reasons, sample: { rankedGames: rGames, recentMatches: s.recent?.matches, champMatches: s.champRecent?.games } };
}

/* ═══════════════════════════════════════════════════════════
   B) OTP
   ═══════════════════════════════════════════════════════════ */
export function computeOtp(s: PlayerSignals): Insight {
  const T = CFG.OTP;
  let score = 0;
  const reasons: string[] = [];

  if (s.recent && s.recent.matches >= T.recentMatchesMin && s.recent.champPool.length > 0) {
    const top1 = s.recent.champPool[0];
    const share = safeDiv(top1.games, s.recent.matches);

    if (share >= T.topShareBase) {
      score += T.topShareBasePoints;
      reasons.push(`${pct(share)}% de partidas recientes con un solo campeón`);
    }
    if (share >= T.topShareHigh) {
      score += T.topShareHighPoints;
      reasons.push(`Pool muy concentrado: ${pct(share)}% en 1 campeón`);
    }

    // WR split
    if (s.recent.winrate > 0 && top1.winrate - s.recent.winrate >= T.wrSplitDiff) {
      score += T.wrSplitPoints;
      reasons.push(`WR con main (${pct(top1.winrate)}%) vs general (${pct(s.recent.winrate)}%): +${pct(top1.winrate - s.recent.winrate)}%`);
    }
  }

  // Mastery gap
  if (s.mastery && s.mastery.top.length >= 2) {
    const [first, second] = s.mastery.top;
    if (first.points >= second.points * T.masteryGapMultiplier) {
      score += T.masteryGapPoints;
      reasons.push(`Maestría: ${(first.points / 1000).toFixed(0)}k pts en main vs ${(second.points / 1000).toFixed(0)}k en segundo`);
    }
  }

  score = clamp(score, 0, 100);

  const confidence = confidenceWeighted([
    [confidenceRecent(s), 3],
    [clamp(safeDiv(s.mastery?.top?.length ?? 0, 3), 0, 1), 1],
  ]);

  // Gate: no "high" with low sample
  const effectiveHighMin = (s.recent?.matches ?? 0) < T.lowSampleMatchesMax ? 999 : T.highMin;
  const severity = severityFromScore(score, effectiveHighMin, T.mediumMin);

  if (reasons.length === 0) reasons.push("Pool de campeones variado");

  return { kind: "OTP", score, confidence, severity, reasons, sample: { recentMatches: s.recent?.matches } };
}

/* ═══════════════════════════════════════════════════════════
   C) ELO_QUEMADO — helper scorers
   ═══════════════════════════════════════════════════════════ */
function scoreEloRanked(T: typeof CFG.ELO_QUEMADO, rGames: number, rWr: number | null, acc: ScoreAccum) {
  if (rGames >= T.rankedGamesBase) {
    acc.score += T.rankedGamesBasePoints;
    acc.reasons.push(`${rGames} partidas ranked jugadas (≥${T.rankedGamesBase})`);
  }
  if (rGames >= T.rankedGamesHigh) {
    acc.score += T.rankedGamesHighPoints;
    acc.reasons.push(`Volumen muy alto: ${rGames} partidas (≥${T.rankedGamesHigh})`);
  }
  if (rWr !== null && rGames >= T.rankedWrLowGamesMin) {
    if (rWr <= T.rankedWrLow) {
      acc.score += T.rankedWrLowPoints;
      acc.reasons.push(`WR ranked ${pct(rWr)}% en ${rGames} partidas (≤${pct(T.rankedWrLow)}%)`);
    }
    if (rWr <= T.rankedWrVeryLow) {
      acc.score += T.rankedWrVeryLowPoints;
      acc.reasons.push(`WR ranked muy bajo: ${pct(rWr)}%`);
    }
  }
}

function scoreEloRecent(s: PlayerSignals, T: typeof CFG.ELO_QUEMADO, acc: ScoreAccum) {
  if (!s.recent || s.recent.matches < T.recentMatchesMin) return;
  if (s.recent.winrate <= T.recentWrLow) {
    acc.score += T.recentWrLowPoints;
    acc.reasons.push(`WR reciente ${pct(s.recent.winrate)}% en ${s.recent.matches} partidas`);
  }
  if (s.recent.streak.type === "L" && s.recent.streak.count >= T.streakLossMin) {
    acc.score += T.streakLossPoints;
    acc.reasons.push(`Racha de ${s.recent.streak.count} derrotas consecutivas`);
  }
}

export function computeEloQuemado(s: PlayerSignals): Insight {
  const T = CFG.ELO_QUEMADO;
  const rGames = rankedGames(s);
  const rWr = rankedWr(s);

  if (rGames < T.rankedGamesMinForLabel) {
    return {
      kind: "ELO_QUEMADO", score: 0, confidence: confidenceRanked(s), severity: "none",
      reasons: rGames === 0 ? ["Sin partidas ranked"] : [`Solo ${rGames} partidas ranked (mín ${T.rankedGamesMinForLabel})`],
      sample: { rankedGames: rGames },
    };
  }

  const acc: ScoreAccum = { score: 0, reasons: [] };
  scoreEloRanked(T, rGames, rWr, acc);
  scoreEloRecent(s, T, acc);

  acc.score = clamp(acc.score, 0, 100);
  const confidence = confidenceWeighted([
    [confidenceRanked(s), 4],
    [confidenceRecent(s), 1],
  ]);
  const severity = severityFromScore(acc.score, T.highMin, T.mediumMin);

  if (acc.reasons.length === 0) acc.reasons.push("Sin señales de MMR quemada");

  return { kind: "ELO_QUEMADO", score: acc.score, confidence, severity, reasons: acc.reasons, sample: { rankedGames: rGames, recentMatches: s.recent?.matches } };
}

/* ═══════════════════════════════════════════════════════════
   D) LOW_WR — helper scorers
   ═══════════════════════════════════════════════════════════ */
function scoreLowWrRanked(T: typeof CFG.LOW_WR, rGames: number, rWr: number | null, acc: ScoreAccum) {
  if (rGames < T.rankedGamesMin || rWr === null) return;
  if (rWr <= T.rankedWrLow) {
    acc.score += T.rankedWrBasePoints;
    acc.reasons.push(`WR ranked ${pct(rWr)}% en ${rGames} partidas`);
  }
  if (rWr <= T.rankedWrVeryLow) {
    acc.score += T.rankedWrVeryLowPoints;
    acc.reasons.push(`WR ranked muy bajo: ${pct(rWr)}%`);
  }
}

function scoreLowWrRecent(s: PlayerSignals, T: typeof CFG.LOW_WR, acc: ScoreAccum) {
  if (!s.recent || s.recent.matches < T.recentMatchesMin) return;

  if (s.recent.winrate <= T.recentWrLow) {
    acc.score += T.recentWrLowPoints;
    acc.reasons.push(`WR reciente ${pct(s.recent.winrate)}% en ${s.recent.matches} partidas`);
  }
  const role = s.currentRole ?? "UNKNOWN";
  if (isLane(role) && s.recent.avg.csPerMin != null && s.recent.avg.csPerMin < T.csPerMinLowLane) {
    acc.score += T.rolePoints;
    acc.reasons.push(`CS/min bajo: ${s.recent.avg.csPerMin.toFixed(1)} para ${role}`);
  }
  if (role === "UTILITY" && s.recent.avg.visionPerMin != null && s.recent.avg.visionPerMin < T.visionPerMinLowSup) {
    acc.score += T.rolePoints;
    acc.reasons.push(`Visión/min bajo: ${s.recent.avg.visionPerMin.toFixed(1)} para SUP`);
  }
  if (s.recent.avg.kda != null && s.recent.avg.kda <= T.kdaLow) {
    acc.score += T.kdaLowPoints;
    acc.reasons.push(`KDA promedio bajo: ${s.recent.avg.kda.toFixed(1)}`);
  }
}

export function computeLowWr(s: PlayerSignals): Insight {
  const T = CFG.LOW_WR;
  const rGames = rankedGames(s);
  const rWr = rankedWr(s);
  const acc: ScoreAccum = { score: 0, reasons: [] };

  scoreLowWrRanked(T, rGames, rWr, acc);
  scoreLowWrRecent(s, T, acc);

  acc.score = clamp(acc.score, 0, 100);
  const confidence = confidenceWeighted([
    [confidenceRanked(s), 3],
    [confidenceRecent(s), 2],
  ]);
  const severity = severityFromScore(acc.score, T.highMin, T.mediumMin);

  if (acc.reasons.length === 0) acc.reasons.push("Rendimiento dentro del rango normal");

  return { kind: "LOW_WR", score: acc.score, confidence, severity, reasons: acc.reasons, sample: { rankedGames: rGames, recentMatches: s.recent?.matches } };
}

/* ═══════════════════════════════════════════════════════════
   E) CARRIED / BOOSTED
   ═══════════════════════════════════════════════════════════ */
export function computeCarried(s: PlayerSignals): Insight {
  const T = CFG.CARRIED;
  let score = 0;
  const reasons: string[] = [];
  const rGames = rankedGames(s);
  const rWr = rankedWr(s);

  if (rWr !== null && rWr >= T.rankedWrHigh && s.recent && s.recent.matches >= T.recentMatchesMin) {
    const lowKda = s.recent.avg.kda != null && s.recent.avg.kda <= T.kdaLow;
    if (lowKda) {
      score = T.basePoints;
      reasons.push(`WR ranked ${pct(rWr)}% pero KDA promedio ${s.recent.avg.kda!.toFixed(1)} (≤${T.kdaLow})`);
    }
  }

  score = clamp(score, 0, 100);
  const confidence = confidenceWeighted([
    [confidenceRanked(s), 2],
    [confidenceRecent(s), 3],
  ]);
  const severity = severityFromScore(score, T.highMin, T.mediumMin);

  if (reasons.length === 0) reasons.push("Rendimiento acorde a su WR");

  return { kind: "CARRIED", score, confidence, severity, reasons, sample: { rankedGames: rGames, recentMatches: s.recent?.matches } };
}

/* ═══════════════════════════════════════════════════════════
   F) TILTED
   ═══════════════════════════════════════════════════════════ */
export function computeTilted(s: PlayerSignals): Insight {
  const T = CFG.TILTED;
  let score = 0;
  const reasons: string[] = [];

  if (s.recent) {
    if (s.recent.streak.type === "L" && s.recent.streak.count >= T.streakLossHigh) {
      score += T.streakLossHighPoints;
      reasons.push(`Racha de ${s.recent.streak.count} derrotas consecutivas`);
    }
    if (s.recent.matches >= T.recentWrVeryLowMatchesMin && s.recent.winrate <= T.recentWrVeryLow) {
      score += T.recentWrVeryLowPoints;
      reasons.push(`WR reciente ${pct(s.recent.winrate)}% en ${s.recent.matches} partidas`);
    }
  }

  score = clamp(score, 0, 100);
  const confidence = confidenceRecent(s);
  const severity = severityFromScore(score, T.highMin, T.mediumMin);

  if (reasons.length === 0) reasons.push("Sin señales de tilt");

  return { kind: "TILTED", score, confidence, severity, reasons, sample: { recentMatches: s.recent?.matches } };
}
