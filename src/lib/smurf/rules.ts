/* ── Smurf detection types ────────────────────────────── */

export type SmurfSeverity = "confirmed" | "possible" | "none";

export interface SmurfAssessment {
  probability: number; // 0..100
  label: "SMURF 100%" | "Posible smurf" | "No smurf" | "Datos insuficientes";
  severity: SmurfSeverity;
  reasons: string[];
}

export interface SmurfInput {
  /** Summoner level */
  summonerLevel: number | null;
  /** Ranked winrate as decimal (0..1), from SoloQ or Flex if SoloQ absent */
  rankedWinrate: number | null;
  /** Champion winrate as decimal (0..1) for current champion in last N matches */
  championWinrate: number | null;
  /** Number of games used to compute championWinrate */
  championSampleSize: number;
}

/* ── Thresholds (DO NOT CHANGE — leave TODOs to review) ── */
// TODO: review thresholds after gathering real-world data
const LEVEL_CONFIRMED_MAX = 50; // level < 50 is suspicious (new account)
const LEVEL_POSSIBLE_MIN = 100;
const LEVEL_POSSIBLE_MAX = 120;
const RANKED_WR_CONFIRMED = 0.6; // 60%
const CHAMP_WR_CONFIRMED = 0.8; // 80%
const CHAMP_MIN_SAMPLE = 8;

/* ── Main function ───────────────────────────────────── */
export function computeSmurfAssessment(input: SmurfInput): SmurfAssessment {
  const reasons: string[] = [];
  let maxProbability = 0;
  let hasPossible = false;
  let hasConfirmed = false;

  /* Rule 1: summonerLevel < 50 => confirmed */
  if (input.summonerLevel !== null && input.summonerLevel < LEVEL_CONFIRMED_MAX) {
    reasons.push(`Nivel ${input.summonerLevel} (< ${LEVEL_CONFIRMED_MAX}) — cuenta nueva`);
    maxProbability = 100;
    hasConfirmed = true;
  }

  /* Rule 2: summonerLevel between 100 and 120 inclusive => possible */
  if (
    input.summonerLevel !== null &&
    input.summonerLevel >= LEVEL_POSSIBLE_MIN &&
    input.summonerLevel <= LEVEL_POSSIBLE_MAX
  ) {
    reasons.push(`Nivel ${input.summonerLevel} (${LEVEL_POSSIBLE_MIN}–${LEVEL_POSSIBLE_MAX}) — cuenta sospechosa`);
    if (maxProbability < 55) maxProbability = 55;
    hasPossible = true;
  }

  /* Rule 3: rankedWinrate >= 60% => confirmed */
  if (input.rankedWinrate !== null && input.rankedWinrate >= RANKED_WR_CONFIRMED) {
    const pct = Math.round(input.rankedWinrate * 100);
    reasons.push(`Winrate ranked ${pct}% (≥ ${Math.round(RANKED_WR_CONFIRMED * 100)}%)`);
    maxProbability = 100;
    hasConfirmed = true;
  }

  /* Rule 4: championWinrate >= 80% with current champion (needs FEATURE_MATCH_HISTORY) */
  if (input.championWinrate !== null) {
    if (input.championSampleSize >= CHAMP_MIN_SAMPLE) {
      if (input.championWinrate >= CHAMP_WR_CONFIRMED) {
        const pct = Math.round(input.championWinrate * 100);
        reasons.push(`Winrate con campeón actual ${pct}% (≥ ${Math.round(CHAMP_WR_CONFIRMED * 100)}%) en ${input.championSampleSize} partidas`);
        maxProbability = 100;
        hasConfirmed = true;
      }
    } else if (input.championSampleSize > 0) {
      reasons.push(
        `Muestra campeón insuficiente (${input.championSampleSize} < ${CHAMP_MIN_SAMPLE} partidas)`,
      );
    }
  }

  /* Determine final assessment */
  if (hasConfirmed) {
    return {
      probability: 100,
      label: "SMURF 100%",
      severity: "confirmed",
      reasons,
    };
  }

  if (hasPossible) {
    return {
      probability: maxProbability,
      label: "Posible smurf",
      severity: "possible",
      reasons,
    };
  }

  if (reasons.length === 0 && input.summonerLevel === null && input.rankedWinrate === null) {
    return {
      probability: 0,
      label: "Datos insuficientes",
      severity: "none",
      reasons: ["Sin datos para evaluar"],
    };
  }

  return {
    probability: 0,
    label: "No smurf",
    severity: "none",
    reasons: reasons.length > 0 ? reasons : ["Ninguna regla activada"],
  };
}
