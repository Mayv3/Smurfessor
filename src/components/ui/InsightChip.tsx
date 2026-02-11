/**
 * InsightChip — compact badge for a single insight, with hover tooltip.
 *
 * Shows insight kind, severity-based color, and a hover panel with
 * score / confidence / reasons.
 */
import { useState, useRef, useEffect } from "react";
import type { Insight, InsightKind, InsightSeverity } from "../../lib/insights/types";

/* ── Label & color per kind ───────────────────────────── */
interface KindMeta {
  label: string;
  icon: React.ReactNode;
  gradient: Record<InsightSeverity, string>;
  border: Record<InsightSeverity, string>;
  text: Record<InsightSeverity, string>;
}

const SMURF_ICO = (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
);

const OTP_ICO = (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
);

const ELO_ICO = (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>
);

const LOW_WR_ICO = (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12v4a2 2 0 002 2h1v2a2 2 0 002 2h2v-2h2v2h2v-2h2a2 2 0 002-2v-2h1a2 2 0 002-2v-4c0-5.52-4.48-10-10-10zm-3 13a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm6 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" /></svg>
);

const CARRIED_ICO = (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" /></svg>
);

const TILTED_ICO = (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-3-6c.65 0 1.18-.53 1.18-1.18S9.65 11.64 9 11.64s-1.18.53-1.18 1.18S8.35 14 9 14zm6 0c.65 0 1.18-.53 1.18-1.18s-.53-1.18-1.18-1.18-1.18.53-1.18 1.18S14.35 14 15 14zm-3 1c-2.33 0-4.31 1.46-5.11 3.5h10.22c-.8-2.04-2.78-3.5-5.11-3.5z" /></svg>
);

const severityGrad = (base: string) => ({
  none: "from-gray-700/60 to-gray-600/60",
  low: `from-${base}-700/40 to-${base}-600/40`,
  medium: `from-${base}-600/60 to-${base}-500/50`,
  high: `from-${base}-600/80 to-${base}-500/70`,
  confirmed: `from-${base}-600 to-${base}-500`,
});

const severityBorder = (base: string) => ({
  none: "border-gray-600/40",
  low: `border-${base}-600/30`,
  medium: `border-${base}-500/40`,
  high: `border-${base}-500/50`,
  confirmed: `border-${base}-400/60`,
});

const severityText = (base: string) => ({
  none: "text-gray-400",
  low: `text-${base}-300`,
  medium: `text-${base}-200`,
  high: `text-${base}-100`,
  confirmed: "text-white",
});

const KIND_META: Record<InsightKind, KindMeta> = {
  SMURF: {
    label: "SMURF",
    icon: SMURF_ICO,
    gradient: severityGrad("red"),
    border: severityBorder("red"),
    text: severityText("red"),
  },
  OTP: {
    label: "OTP",
    icon: OTP_ICO,
    gradient: severityGrad("amber"),
    border: severityBorder("amber"),
    text: severityText("amber"),
  },
  ELO_QUEMADO: {
    label: "ELO QUEMADO",
    icon: ELO_ICO,
    gradient: severityGrad("orange"),
    border: severityBorder("orange"),
    text: severityText("orange"),
  },
  LOW_WR: {
    label: "ESCOMBRO",
    icon: LOW_WR_ICO,
    gradient: severityGrad("stone"),
    border: severityBorder("stone"),
    text: severityText("stone"),
  },
  CARRIED: {
    label: "CARRIED",
    icon: CARRIED_ICO,
    gradient: severityGrad("purple"),
    border: severityBorder("purple"),
    text: severityText("purple"),
  },
  TILTED: {
    label: "TILTED",
    icon: TILTED_ICO,
    gradient: severityGrad("rose"),
    border: severityBorder("rose"),
    text: severityText("rose"),
  },
};

/* ── Confidence label ─────────────────────────────────── */
function confidenceLabel(c: number): string {
  if (c >= 0.7) return "Alta";
  if (c >= 0.4) return "Media";
  return "Baja";
}

/* ── Chip component ───────────────────────────────────── */
export function InsightChip({ insight }: Readonly<{ insight: Insight }>) {
  const meta = KIND_META[insight.kind];
  const [showTip, setShowTip] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chipRef = useRef<HTMLDivElement>(null);

  // Clean up timer on unmount
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const handleEnter = () => {
    timer.current = setTimeout(() => setShowTip(true), 200);
  };
  const handleLeave = () => {
    if (timer.current) clearTimeout(timer.current);
    setShowTip(false);
  };

  /* We use hardcoded classes because Tailwind JIT needs full class names at compile time */
  const chipClasses = getChipClasses(insight.kind, insight.severity);

  return (
    <div className="relative" ref={chipRef}>
      <button
        type="button"
        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border cursor-default transition-all duration-200 hover:brightness-110 shadow-sm ${chipClasses}`}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={handleEnter}
        onBlur={handleLeave}
        aria-describedby={showTip ? `tip-${insight.kind}` : undefined}
      >
        {meta.icon}
        {meta.label}
      </button>

      {/* Tooltip */}
      {showTip && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 max-w-[90vw] rounded-lg bg-gray-900/95 backdrop-blur border border-gray-700/60 shadow-xl shadow-black/40 p-3 text-left pointer-events-none animate-fadeIn"
          role="tooltip"
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`font-bold text-xs ${chipClasses.includes("text-white") ? "text-white" : getTextClass(insight.kind)}`}>
              {meta.label}
            </span>
            <span className="text-[10px] text-gray-400">
              {insight.score}/100 · Confianza {confidenceLabel(insight.confidence)}
            </span>
          </div>

          {/* Score bar */}
          <div className="w-full h-1 rounded-full bg-gray-700/60 overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all ${getBarClass(insight.kind)}`}
              style={{ width: `${Math.min(insight.score, 100)}%` }}
            />
          </div>

          {/* Reasons */}
          {insight.reasons.length > 0 && (
            <ul className="space-y-0.5">
              {insight.reasons.map((r) => (
                <li key={r} className="text-[10px] text-gray-300 leading-snug flex gap-1.5">
                  <span className="text-gray-500 mt-0.5">·</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Sample info */}
          {(insight.sample.rankedGames || insight.sample.recentMatches) && (
            <div className="mt-1.5 text-[9px] text-gray-500 flex gap-2">
              {insight.sample.rankedGames != null && (
                <span>{insight.sample.rankedGames} ranked</span>
              )}
              {insight.sample.recentMatches != null && (
                <span>{insight.sample.recentMatches} recientes</span>
              )}
            </div>
          )}

          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-gray-700/60" />
        </div>
      )}
    </div>
  );
}

/* ── Hardcoded class maps (Tailwind needs static strings) ── */
function getChipClasses(kind: InsightKind, severity: InsightSeverity): string {
  const base = {
    SMURF: {
      none: "bg-gradient-to-r from-gray-700/60 to-gray-600/60 border-gray-600/40 text-gray-400",
      low: "bg-gradient-to-r from-red-700/40 to-red-600/40 border-red-600/30 text-red-300",
      medium: "bg-gradient-to-r from-red-600/60 to-red-500/50 border-red-500/40 text-red-200",
      high: "bg-gradient-to-r from-red-600/80 to-red-500/70 border-red-500/50 text-red-100",
      confirmed: "bg-gradient-to-r from-red-600 to-red-500 border-red-400/60 text-white shadow-red-500/20",
    },
    OTP: {
      none: "bg-gradient-to-r from-gray-700/60 to-gray-600/60 border-gray-600/40 text-gray-400",
      low: "bg-gradient-to-r from-amber-700/40 to-amber-600/40 border-amber-600/30 text-amber-300",
      medium: "bg-gradient-to-r from-amber-600/60 to-amber-500/50 border-amber-500/40 text-amber-200",
      high: "bg-gradient-to-r from-amber-600/80 to-amber-500/70 border-amber-500/50 text-amber-100",
      confirmed: "bg-gradient-to-r from-amber-600 to-amber-500 border-amber-400/60 text-white shadow-amber-500/20",
    },
    ELO_QUEMADO: {
      none: "bg-gradient-to-r from-gray-700/60 to-gray-600/60 border-gray-600/40 text-gray-400",
      low: "bg-gradient-to-r from-orange-700/40 to-orange-600/40 border-orange-600/30 text-orange-300",
      medium: "bg-gradient-to-r from-orange-600/60 to-orange-500/50 border-orange-500/40 text-orange-200",
      high: "bg-gradient-to-r from-orange-600/80 to-orange-500/70 border-orange-500/50 text-orange-100",
      confirmed: "bg-gradient-to-r from-orange-600 to-orange-500 border-orange-400/60 text-white shadow-orange-500/20",
    },
    LOW_WR: {
      none: "bg-gradient-to-r from-gray-700/60 to-gray-600/60 border-gray-600/40 text-gray-400",
      low: "bg-gradient-to-r from-stone-700/40 to-stone-600/40 border-stone-600/30 text-stone-300",
      medium: "bg-gradient-to-r from-stone-600/60 to-stone-500/50 border-stone-500/40 text-stone-200",
      high: "bg-gradient-to-r from-stone-600/80 to-stone-500/70 border-stone-500/50 text-stone-100",
      confirmed: "bg-gradient-to-r from-stone-600 to-stone-500 border-stone-400/60 text-white shadow-stone-500/20",
    },
    CARRIED: {
      none: "bg-gradient-to-r from-gray-700/60 to-gray-600/60 border-gray-600/40 text-gray-400",
      low: "bg-gradient-to-r from-purple-700/40 to-purple-600/40 border-purple-600/30 text-purple-300",
      medium: "bg-gradient-to-r from-purple-600/60 to-purple-500/50 border-purple-500/40 text-purple-200",
      high: "bg-gradient-to-r from-purple-600/80 to-purple-500/70 border-purple-500/50 text-purple-100",
      confirmed: "bg-gradient-to-r from-purple-600 to-purple-500 border-purple-400/60 text-white shadow-purple-500/20",
    },
    TILTED: {
      none: "bg-gradient-to-r from-gray-700/60 to-gray-600/60 border-gray-600/40 text-gray-400",
      low: "bg-gradient-to-r from-rose-700/40 to-rose-600/40 border-rose-600/30 text-rose-300",
      medium: "bg-gradient-to-r from-rose-600/60 to-rose-500/50 border-rose-500/40 text-rose-200",
      high: "bg-gradient-to-r from-rose-600/80 to-rose-500/70 border-rose-500/50 text-rose-100",
      confirmed: "bg-gradient-to-r from-rose-600 to-rose-500 border-rose-400/60 text-white shadow-rose-500/20",
    },
  };
  return base[kind]?.[severity] ?? base[kind]?.none ?? "";
}

function getTextClass(kind: InsightKind): string {
  const map: Record<InsightKind, string> = {
    SMURF: "text-red-400",
    OTP: "text-amber-400",
    ELO_QUEMADO: "text-orange-400",
    LOW_WR: "text-stone-400",
    CARRIED: "text-purple-400",
    TILTED: "text-rose-400",
  };
  return map[kind] ?? "text-gray-400";
}

function getBarClass(kind: InsightKind): string {
  const map: Record<InsightKind, string> = {
    SMURF: "bg-red-500",
    OTP: "bg-amber-500",
    ELO_QUEMADO: "bg-orange-500",
    LOW_WR: "bg-stone-500",
    CARRIED: "bg-purple-500",
    TILTED: "bg-rose-500",
  };
  return map[kind] ?? "bg-gray-500";
}

/* ── InsightChipList — shows only relevant insights (severity >= medium) ── */
export function InsightChipList({ insights }: Readonly<{ insights: Insight[] }>) {
  const visible = insights.filter(
    (i) => i.severity !== "none" && i.severity !== "low",
  );
  if (visible.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((i) => (
        <InsightChip key={i.kind} insight={i} />
      ))}
    </div>
  );
}
