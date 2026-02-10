/**
 * Insight engine types — pure data, no IO.
 */

/* ── Insight kinds ────────────────────────────────────── */
export type InsightKind =
  | "SMURF"
  | "ELO_QUEMADO"
  | "OTP"
  | "LOW_WR"
  | "CARRIED"
  | "TILTED";

/* ── Severity levels ──────────────────────────────────── */
export type InsightSeverity = "none" | "low" | "medium" | "high" | "confirmed";

/* ── Single insight ───────────────────────────────────── */
export interface Insight {
  kind: InsightKind;
  /** 0..100 composite score */
  score: number;
  /** 0..1 how much data we had */
  confidence: number;
  severity: InsightSeverity;
  /** Human-readable reasons (neutral tone) */
  reasons: string[];
  /** Metadata about sample sizes used */
  sample: {
    rankedGames?: number;
    recentMatches?: number;
    champMatches?: number;
    window?: number;
  };
}

/* ── Aggregated output per player ─────────────────────── */
export interface InsightSummary {
  smurf: { confirmed: boolean; probable: boolean; score: number };
  otp: { score: number };
  eloQuemado: { score: number };
  lowWr: { score: number };
  carried: { score: number };
  tilted: { score: number };
}

export interface PlayerInsights {
  insights: Insight[];
  summary: InsightSummary;
}

/* ── Signals: input to the rule engine ────────────────── */
export type PlayerRole = "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY" | "UNKNOWN";

export interface RankedSignals {
  queue: "RANKED_SOLO_5x5" | "RANKED_FLEX_SR" | null;
  tier?: string | null;
  rank?: string | null;
  lp?: number | null;
  wins?: number | null;
  losses?: number | null;
  hotStreak?: boolean | null;
  freshBlood?: boolean | null;
  veteran?: boolean | null;
  inactive?: boolean | null;
}

export interface ChampPoolEntry {
  championId: number;
  games: number;
  winrate: number; // 0..1
}

export interface RolePoolEntry {
  role: string;
  games: number;
}

export interface RecentSignals {
  /** Configured window size (e.g. 20) */
  window: number;
  /** Actual matches counted after filtering */
  matches: number;
  wins: number;
  losses: number;
  /** 0..1 */
  winrate: number;
  streak: { type: "W" | "L"; count: number };
  champPool: ChampPoolEntry[];
  rolePool: RolePoolEntry[];
  avg: {
    kda: number | null;
    deaths: number | null;
    csPerMin: number | null;
    goldPerMin: number | null;
    damagePerMin: number | null;
    visionPerMin: number | null;
  };
  offRoleRate?: number | null;
}

export interface ChampRecentSignals {
  championId: number;
  games: number;
  wins: number;
  losses: number;
  /** 0..1 */
  winrate: number;
}

export interface MasterySignals {
  top: Array<{ championId: number; points: number; level: number }>;
  currentChampion?: { points: number; level: number } | null;
}

export interface PlayerSignals {
  /* cheap */
  summonerLevel?: number | null;
  ranked?: RankedSignals | null;
  /* context */
  currentChampionId?: number | null;
  currentRole?: PlayerRole;
  /* deep (from Match-V5) */
  recent?: RecentSignals | null;
  champRecent?: ChampRecentSignals | null;
  mastery?: MasterySignals | null;
}
