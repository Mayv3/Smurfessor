import { InsightChipList } from "./ui/InsightChip";
import { IconPerson } from "./ui/Icons";
import type { PlayerInsights, Insight } from "../lib/insights/types";
import type { NormalizedRunes, NormalizedRuneSlot } from "../lib/ddragon/runes";

/* ── Types matching PlayerCardData from POST /api/player-cards ── */
export interface PlayerCardRanked {
  queue: "RANKED_SOLO_5x5" | "RANKED_FLEX_SR";
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  games: number;
  winrate: number;
}

export interface PlayerCardChampion {
  id: number;
  name: string;
  icon: string;
}

export interface PlayerCardChampStats {
  recentWindow: string;
  totalRankedGames: number;
  gamesWithChamp: number | null;
  winrateWithChamp: number | null;
  /** Average KDA with this champion: (kills+assists)/deaths. null if no data */
  kdaWithChamp: number | null;
  /** Per-game averages. null if no data */
  avgKills: number | null;
  avgDeaths: number | null;
  avgAssists: number | null;
  sampleSizeOk: boolean;
  note?: string;
}

export interface PlayerCardMastery {
  championLevel: number;
  championPoints: number;
}

export interface PlayerCardSpell {
  id: number;
  name: string;
  icon: string;
}

export interface PlayerCardProps {
  /** Used by parent for keying; not consumed inside the card */
  puuid: string;
  /** Passed through by parent; not consumed inside the card */
  teamId: number;
  riotId: { gameName: string; tagLine: string };
  summonerLevel: number;
  /** Available in props for parent use; not consumed inside the card */
  profileIconId: number;
  ranked: PlayerCardRanked | null;
  currentChampion: PlayerCardChampion;
  champStats: PlayerCardChampStats;
  mastery: PlayerCardMastery | null;
  runes: NormalizedRunes | null;
  spells: { spell1: PlayerCardSpell; spell2: PlayerCardSpell } | null;
  insights?: PlayerInsights | null;
  participant: {
    championId: number;
    spell1Id: number;
    spell2Id: number;
    perkKeystone?: number;
    perkPrimaryStyle?: number;
    perkSubStyle?: number;
  };
  ddragon: {
    version: string;
    champions: Record<string, { id: string; name: string; key: string; image: string }>;
    spells: Record<string, { id: string; name: string; key: string; image: string }>;
    runes?: Record<string, { id: number; key: string; name: string; icon: string }>;
    runeData?: Record<string, { id: number; key: string; name: string; icon: string }>;
  };
  loading?: boolean;
}

/* ── CDN URLs ─────────────────────────────────────────── */
const DD = "https://ddragon.leagueoflegends.com";
function champIcon(ver: string, img: string) { return `${DD}/cdn/${ver}/img/champion/${img}`; }
function spellIcon(ver: string, img: string) { return `${DD}/cdn/${ver}/img/spell/${img}`; }
function runeIconUrl(iconPath: string) { return `${DD}/cdn/img/${iconPath}`; }
function rankEmblem(tier: string) {
  const t = tier.toLowerCase();
  const ext = t === 'emerald' ? 'svg' : 'png';
  return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${t}.${ext}`;
}

/* ── Rank colors ──────────────────────────────────────── */
const TIER_COLOR: Record<string, string> = {
  IRON: "text-gray-400", BRONZE: "text-amber-600", SILVER: "text-gray-300",
  GOLD: "text-yellow-400", PLATINUM: "text-teal-300", EMERALD: "text-emerald-400",
  DIAMOND: "text-blue-300", MASTER: "text-purple-400", GRANDMASTER: "text-red-400",
  CHALLENGER: "text-amber-300",
};

/* ── Tier gradient for card top accent ────────────────── */
const TIER_GRADIENT: Record<string, string> = {
  IRON:        "from-gray-500/20 to-transparent",
  BRONZE:      "from-amber-700/20 to-transparent",
  SILVER:      "from-gray-300/15 to-transparent",
  GOLD:        "from-yellow-500/20 to-transparent",
  PLATINUM:    "from-teal-400/20 to-transparent",
  EMERALD:     "from-emerald-400/20 to-transparent",
  DIAMOND:     "from-blue-400/20 to-transparent",
  MASTER:      "from-purple-400/25 to-transparent",
  GRANDMASTER: "from-red-400/25 to-transparent",
  CHALLENGER:  "from-amber-300/30 to-transparent",
};

const TIER_BORDER: Record<string, string> = {
  IRON:        "border-gray-600/40",
  BRONZE:      "border-amber-700/40",
  SILVER:      "border-gray-400/30",
  GOLD:        "border-yellow-500/40",
  PLATINUM:    "border-teal-400/40",
  EMERALD:     "border-emerald-400/40",
  DIAMOND:     "border-blue-400/40",
  MASTER:      "border-purple-400/50",
  GRANDMASTER: "border-red-400/50",
  CHALLENGER:  "border-amber-300/50",
};

/* ── Winrate color helper ─────────────────────────────── */
function wrColor(wr: number): string {
  if (wr >= 60) return "text-red-400";
  if (wr >= 55) return "text-yellow-400";
  if (wr >= 50) return "text-emerald-400";
  return "text-gray-400";
}

function wrBgColor(wr: number): string {
  if (wr >= 60) return "bg-red-500";
  if (wr >= 55) return "bg-yellow-500";
  if (wr >= 50) return "bg-emerald-500";
  return "bg-gray-500";
}

/* ── KDA color helper ─────────────────────────────────── */
function kdaColor(kda: number): string {
  if (kda >= 5) return "text-orange-400";
  if (kda >= 3) return "text-emerald-400";
  if (kda >= 2) return "text-blue-400";
  return "text-gray-400";
}

/* ── Mastery badge ────────────────────────────────────── */
function masteryBadge(level: number): { text: string; cls: string } {
  if (level >= 7) return { text: "M7", cls: "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white border-cyan-400/60 shadow-cyan-500/20 shadow-sm" };
  if (level >= 6) return { text: "M6", cls: "bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-400/60 shadow-purple-500/20 shadow-sm" };
  if (level >= 5) return { text: "M5", cls: "bg-gradient-to-r from-red-500 to-red-600 text-white border-red-400/60 shadow-red-500/20 shadow-sm" };
  if (level >= 4) return { text: "M4", cls: "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-500/60" };
  return { text: `M${level}`, cls: "bg-gray-600/80 text-gray-200 border-gray-500/60" };
}

function formatPoints(pts: number): string {
  if (pts >= 1_000_000) return `${(pts / 1_000_000).toFixed(1)}M`;
  if (pts >= 1_000) return `${Math.round(pts / 1_000)}k`;
  return String(pts);
}

/* ── Smurf visual helpers (insight-driven) ────────────── */
function smurfCardClass(smurfSeverity: "confirmed" | "high" | "medium" | "low" | "none", tier?: string): string {
  if (smurfSeverity === "confirmed" || smurfSeverity === "high") return "border-red-500/50 card-smurf";
  if (smurfSeverity === "medium") return "border-yellow-500/40 card-possible-smurf";
  if (tier) return TIER_BORDER[tier] ?? "border-gray-700/40";
  return "border-gray-700/40";
}

function cardTypeClass(smurfSeverity: string, ranked?: PlayerCardRanked | null): string {
  const parts: string[] = [];
  if (smurfSeverity === "none" || smurfSeverity === "low") {
    if (isEscombro(ranked ?? null)) parts.push("card-escombro");
    if (isEloQuemado(ranked ?? null)) parts.push("card-elo-quemado");
  }
  return parts.join(" ");
}

function tierGlowClass(tier?: string): string {
  if (!tier) return "";
  return `tier-glow-${tier.toLowerCase()} animate-pulseGlow`;
}

/* ── Special badge helpers ────────────────────────────── */
function isEloQuemado(ranked: PlayerCardRanked | null): boolean {
  if (!ranked) return false;
  return ranked.games > 300;
}

function isEscombro(ranked: PlayerCardRanked | null): boolean {
  if (!ranked) return false;
  if (ranked.games < 10) return false;
  return Math.round(ranked.winrate * 100) < 46;
}

/* ── Rune icon renderer ───────────────────────────────── */
function RuneIcon({ slot, size = "w-5 h-5" }: Readonly<{ slot: NormalizedRuneSlot; size?: string }>) {
  if (!slot.icon) {
    return <div className={`${size} rounded-full bg-gray-700/40`} title={slot.name} />;
  }
  return (
    <img
      src={runeIconUrl(slot.icon)}
      alt={slot.name}
      title={slot.name}
      className={`${size} rounded-full bg-gray-900/60 p-0.5`}
      loading="lazy"
    />
  );
}


/* ── Sub-components to reduce cognitive complexity ──── */

function CardOverlays({ isSmurf, isPossibleSmurf, escombro, eloQuemado }: Readonly<{
  isSmurf: boolean; isPossibleSmurf: boolean; escombro: boolean; eloQuemado: boolean;
}>) {
  if (isSmurf) return (
    <>
      <div className="absolute inset-0 bg-red-500/[0.04] pointer-events-none z-0" />
      <div className="absolute inset-x-0 top-0 h-12 pointer-events-none z-0 overflow-hidden">
        <div className="w-full h-1 bg-gradient-to-r from-transparent via-red-500/30 to-transparent" style={{ animation: 'smurfScan 3s linear infinite' }} />
      </div>
      <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-bl from-red-500/10 to-transparent" />
      </div>
    </>
  );
  if (isPossibleSmurf) return (
    <>
      <div className="absolute inset-0 bg-yellow-500/[0.03] pointer-events-none z-0" />
      <div className="absolute inset-x-0 top-0 h-1 pointer-events-none z-0">
        <div className="h-full" style={{
          background: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(234,179,8,0.25) 8px, rgba(234,179,8,0.25) 16px)',
          animation: 'warningPulse 3s ease-in-out infinite'
        }} />
      </div>
    </>
  );
  if (escombro) return (
    <>
      <div className="absolute inset-0 pointer-events-none z-0" style={{
        background: 'radial-gradient(circle at 30% 80%, rgba(120,113,108,0.08), transparent 60%), radial-gradient(circle at 70% 20%, rgba(120,113,108,0.06), transparent 50%)',
      }} />
      <div className="absolute bottom-0 inset-x-0 h-8 pointer-events-none z-0">
        <svg viewBox="0 0 200 20" className="w-full h-full opacity-10" preserveAspectRatio="none">
          <path d="M0,10 L30,8 L45,15 L60,5 L80,12 L100,7 L130,14 L150,6 L170,11 L200,9" stroke="#78716c" strokeWidth="0.5" fill="none" />
        </svg>
      </div>
    </>
  );
  if (eloQuemado) return (
    <>
      <div className="absolute inset-x-0 bottom-0 h-20 pointer-events-none z-0" style={{
        background: 'linear-gradient(to top, rgba(251,146,60,0.08), rgba(251,146,60,0.03) 50%, transparent)',
        animation: 'fireRise 2.5s ease-in-out infinite',
        transformOrigin: 'bottom'
      }} />
      <div className="absolute bottom-2 left-1/4 w-1 h-1 rounded-full bg-orange-400/20 animate-float" style={{ animationDuration: '2s' }} />
      <div className="absolute bottom-4 right-1/3 w-0.5 h-0.5 rounded-full bg-orange-500/30 animate-float" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
      <div className="absolute bottom-1 right-1/4 w-0.5 h-0.5 rounded-full bg-yellow-400/20 animate-float" style={{ animationDuration: '2.5s', animationDelay: '1s' }} />
    </>
  );
  return null;
}

/** Summoner level pill — stays absolute top-left */
function LevelBadge({ summonerLevel, loading }: Readonly<{ summonerLevel: number; loading?: boolean }>) {
  if (summonerLevel <= 0 || loading) return null;
  return (
    <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/50 border border-gray-600/40 backdrop-blur-md z-20">
      <IconPerson className="w-3 h-3 text-gray-400" />
      <span className="text-[10px] font-semibold text-gray-300">{summonerLevel}</span>
    </div>
  );
}

/** Insight badges — rendered in normal flow (not absolute) to avoid overlaps */
function InsightBadges({ loading, hasInsights, visibleInsights }: Readonly<{
  loading?: boolean;
  hasInsights: boolean; visibleInsights: Insight[];
}>) {
  if (loading) return null;

  // Limit to 2 insight chips max
  const maxBadges = 2;
  let badges = hasInsights ? visibleInsights.slice(0, maxBadges) : [];

  /* ── Mutual-exclusion: smurf + escombro can't coexist ── */
  const escombroInsight = badges.find((i) => i.kind === "LOW_WR" || i.kind === "ELO_QUEMADO");
  const smurfInsight = badges.find((i) => i.kind === "SMURF");

  if (escombroInsight && smurfInsight) {
    // Keep the one with higher score
    if (smurfInsight.score >= escombroInsight.score) {
      badges = badges.filter((i) => i.kind !== "LOW_WR" && i.kind !== "ELO_QUEMADO");
    } else {
      badges = badges.filter((i) => i.kind !== "SMURF");
    }
  }

  /* Always render a fixed-height container so cards align even when empty */
  if (badges.length === 0) {
    return <div className="min-h-[22px]" />;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 min-h-[22px]">
      <InsightChipList insights={badges} />
    </div>
  );
}

function RankDisplay({ ranked, wr, loading }: Readonly<{
  ranked: PlayerCardRanked | null; wr: number | null; loading?: boolean;
}>) {
  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-gray-800 rounded-lg animate-shimmer" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-20 bg-gray-800 rounded animate-shimmer" />
          <div className="h-3 w-12 bg-gray-800/60 rounded animate-shimmer" />
        </div>
        <div className="w-12 h-8 bg-gray-800 rounded-lg animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      {ranked ? (
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <img src={rankEmblem(ranked.tier)} alt={ranked.tier} className="w-11 h-11 object-contain shrink-0 drop-shadow-lg" loading="lazy" />
          <div className="min-w-0">
            <div className={`text-sm font-bold leading-tight ${TIER_COLOR[ranked.tier] ?? "text-gray-400"}`}>
              {ranked.tier} {ranked.rank}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">{ranked.leaguePoints} LP</div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 text-gray-600 text-sm">
          <div className="w-11 h-11 rounded-lg bg-gray-800/50 flex items-center justify-center">
            <span className="text-gray-600 text-lg">—</span>
          </div>
          <span className="text-gray-500">Unranked</span>
        </div>
      )}

      <div className="text-right shrink-0">
        {wr === null ? (
          <div className="flex flex-col items-end gap-1">
            <div className="text-xl font-extrabold leading-none text-gray-700">—</div>
            <div className="text-[9px] text-gray-600 uppercase tracking-wider">WR</div>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <div className={`text-xl font-extrabold leading-none ${wrColor(wr)}`}>{wr}%</div>
            <div className="w-12 h-1 rounded-full bg-gray-700/60 overflow-hidden">
              <div className={`h-full rounded-full ${wrBgColor(wr)} transition-all`} style={{ width: `${Math.min(wr, 100)}%` }} />
            </div>
            <div className="text-[9px] text-gray-600 uppercase tracking-wider">WR</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChampionHeader({ champ, currentChampion, s1, s2, runes, participant, riotId, loading, ddragon }: Readonly<{
  champ: { id: string; name: string; key: string; image: string } | undefined;
  currentChampion: PlayerCardChampion;
  s1: { id: string; name: string; key: string; image: string } | undefined;
  s2: { id: string; name: string; key: string; image: string } | undefined;
  runes: NormalizedRunes | null;
  participant: { perkKeystone?: number; perkSubStyle?: number };
  riotId: { gameName: string; tagLine: string };
  loading?: boolean;
  ddragon: {
    version: string;
    runes?: Record<string, { id: number; key: string; name: string; icon: string }>;
    runeData?: Record<string, { id: number; key: string; name: string; icon: string }>;
  };
}>) {
  return (
    <div className="flex items-center gap-3 mt-5">
      <div className="relative shrink-0">
        {champ ? (
          <img
            src={champIcon(ddragon.version, currentChampion.icon || champ.image)}
            alt={currentChampion.name || champ.name}
            className="w-14 h-14 rounded-lg ring-2 ring-gray-600/60 shadow-lg shadow-black/30"
            loading="lazy"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-gray-800 flex items-center justify-center text-gray-600 text-sm ring-2 ring-gray-700/40">?</div>
        )}
        <div className="absolute -bottom-1.5 -right-1.5 flex gap-0.5">
          {s1 && <img src={spellIcon(ddragon.version, s1.image)} alt={s1.name} className="w-5 h-5 rounded ring-1 ring-black/60 shadow" loading="lazy" />}
          {s2 && <img src={spellIcon(ddragon.version, s2.image)} alt={s2.name} className="w-5 h-5 rounded ring-1 ring-black/60 shadow" loading="lazy" />}
        </div>
      </div>
      <div className="flex flex-col gap-0.5 shrink-0">
        <RunesPreview runes={runes} participant={participant} ddragon={ddragon} />
      </div>
      <div className="flex-1 min-w-0">
        {loading ? (
          <div className="space-y-1.5">
            <span className="w-20 h-4 bg-gray-800 rounded animate-shimmer inline-block" />
            <span className="w-12 h-3 bg-gray-800/60 rounded animate-shimmer inline-block" />
          </div>
        ) : (
          <>
            <span className="font-bold text-white text-sm leading-snug block truncate">
              {riotId.gameName || "Unknown"}
            </span>
            <span className="text-[11px] text-gray-500 block mt-0.5">
              #{riotId.tagLine || "???"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Rune column preview: full → fallback keystone → placeholders ── */
function RunesPreview({ runes, participant, ddragon }: Readonly<{
  runes: NormalizedRunes | null;
  participant: { perkKeystone?: number; perkSubStyle?: number };
  ddragon: {
    runes?: Record<string, { id: number; key: string; name: string; icon: string }>;
    runeData?: Record<string, { id: number; key: string; name: string; icon: string }>;
  };
}>) {
  if (runes) {
    return (
      <>
        <RuneIcon slot={runes.keystone} size="w-7 h-7" />
        <RuneIcon slot={runes.subStyle} size="w-5 h-5" />
      </>
    );
  }

  const keystoneRune = participant.perkKeystone == null
    ? undefined
    : ddragon.runeData?.[String(participant.perkKeystone)];
  const subRuneTree = participant.perkSubStyle == null
    ? undefined
    : ddragon.runes?.[String(participant.perkSubStyle)];

  if (keystoneRune) {
    return (
      <>
        <img src={runeIconUrl(keystoneRune.icon)} alt={keystoneRune.name} title={keystoneRune.name} className="w-7 h-7 rounded-full bg-gray-900/60 p-0.5" loading="lazy" />
        {subRuneTree ? (
          <img src={runeIconUrl(subRuneTree.icon)} alt={subRuneTree.name} title={subRuneTree.name} className="w-5 h-5 rounded-full bg-gray-900/60 p-0.5 self-center opacity-70" loading="lazy" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-gray-700/30 self-center" />
        )}
      </>
    );
  }
  return (
    <>
      <div className="w-7 h-7 rounded-full bg-gray-800/60" />
      <div className="w-5 h-5 rounded-full bg-gray-800/40 self-center" />
    </>
  );
}

/* ── Champ-stats inline preview ──────────────────────── */
function ChampStatsPreview({ champWR, champGames, champStats }: Readonly<{
  champWR: number | null;
  champGames: number;
  champStats: PlayerCardChampStats;
}>) {
  /* Case 1: Has games with this champion — show full stats */
  if (champWR !== null && champGames > 0) {
    const { kdaWithChamp, avgKills, avgDeaths, avgAssists } = champStats;
    const hasKda = kdaWithChamp != null && avgKills != null && avgDeaths != null && avgAssists != null;
    return (
      <>
        <span className={`text-sm font-bold ${wrColor(champWR)}`}>{champWR}%</span>
        {hasKda && (
          <span
            className={`text-[10px] font-semibold ${kdaColor(kdaWithChamp)}`}
            title={`${avgKills.toFixed(1)} / ${avgDeaths.toFixed(1)} / ${avgAssists.toFixed(1)} promedio por partida`}
          >
            {avgKills.toFixed(1)}/{avgDeaths.toFixed(1)}/{avgAssists.toFixed(1)}
            <span className="text-gray-500 font-normal"> ({kdaWithChamp.toFixed(1)}:1)</span>
          </span>
        )}
        <span className="text-[10px] text-gray-500 ml-auto shrink-0 inline-flex items-center gap-1">
          {champGames}p/{champStats.totalRankedGames}
          <span className="text-[9px] text-gray-600 px-1 py-0.5 rounded bg-gray-800/80 border border-gray-700/40" title="Últimos 7 días ranked">7d</span>
        </span>
      </>
    );
  }
  /* Case 2: Feature disabled */
  if (champStats.note === "FEATURE_DISABLED") {
    return <span className="text-[10px] text-gray-600">Champ WR: —</span>;
  }
  /* Case 3: Fetch error — signal it clearly */
  if (champStats.note === "FETCH_ERROR") {
    return <span className="text-[10px] text-yellow-600">⚠ Error cargando datos</span>;
  }
  /* Case 4: Has ranked games but none with this champ */
  if (champStats.totalRankedGames > 0) {
    return (
      <span className="text-[10px] text-gray-600">
        0p / {champStats.totalRankedGames} ranked (7d)
      </span>
    );
  }
  /* Case 5: No ranked games at all in the window */
  return <span className="text-[10px] text-gray-600">Sin ranked (7d)</span>;
}

/* ══════════════════════════════════════════════════════════
   PlayerCard — Full card with all enriched data
   ══════════════════════════════════════════════════════════ */
export function PlayerCard({
  riotId,
  summonerLevel,
  ranked,
  currentChampion,
  champStats,
  mastery,
  runes,
  insights,
  participant,
  ddragon,
  loading,
}: Readonly<PlayerCardProps>) {
  const champ = ddragon.champions[String(participant.championId)];
  const s1 = ddragon.spells[String(participant.spell1Id)];
  const s2 = ddragon.spells[String(participant.spell2Id)];

  const wr = ranked ? Math.round(ranked.winrate * 100) : null;
  const champWR = champStats.winrateWithChamp == null ? null : Math.round(champStats.winrateWithChamp * 100);
  const champGames = champStats.gamesWithChamp ?? 0;

  const eloQuemado = !loading && isEloQuemado(ranked);
  const escombro = !loading && isEscombro(ranked);

  /* Insight-driven overrides */
  const hasInsights = !loading && insights && insights.insights.length > 0;
  const visibleInsights = hasInsights
    ? (insights?.insights ?? []).filter((i: Insight) => i.severity !== "none" && i.severity !== "low")
    : [];

  /* Derive smurf state from insight engine */
  const smurfInsight = visibleInsights.find((i) => i.kind === "SMURF");
  const smurfSeverity = smurfInsight?.severity ?? "none";
  const isSmurf = smurfSeverity === "confirmed" || smurfSeverity === "high";
  const isPossibleSmurf = smurfSeverity === "medium";

  const tier = ranked?.tier;
  const gradient = tier ? TIER_GRADIENT[tier] ?? "from-transparent to-transparent" : "from-transparent to-transparent";
  const glowCls = !loading && tier && !isSmurf && !isPossibleSmurf ? tierGlowClass(tier) : "";
  const typeCls = loading ? "" : cardTypeClass(smurfSeverity, ranked);

  return (
    <div
      className={`relative rounded-xl border overflow-hidden bg-gray-900/90 backdrop-blur-sm flex flex-col w-full min-h-[280px] transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/30 group ${smurfCardClass(smurfSeverity, tier)} ${glowCls} ${typeCls}`}
      data-smurf-severity={smurfSeverity}
      data-testid="player-card"
    >
      {/* ── Tier gradient accent top ── */}
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${gradient} pointer-events-none`} />

      {/* ── Type overlays ── */}
      <CardOverlays isSmurf={isSmurf} isPossibleSmurf={isPossibleSmurf} escombro={escombro} eloQuemado={eloQuemado} />

      {/* ── Card content ── */}
      <div className="relative flex flex-col gap-2.5 p-3.5 flex-1">

        {/* ── Level badge (absolute top-left) ── */}
        <LevelBadge summonerLevel={summonerLevel} loading={loading} />

        {/* ── Row 1: Champion + Spells + Runes + Name ── */}
        <ChampionHeader
          champ={champ} currentChampion={currentChampion}
          s1={s1} s2={s2} runes={runes} participant={participant}
          riotId={riotId} loading={loading} ddragon={ddragon}
        />

        {/* ── Row 1b: Insight badges (in flow, below name) ── */}
        <InsightBadges
          loading={loading}
          hasInsights={!!hasInsights} visibleInsights={visibleInsights}
        />

        {/* ── Row 2: Rank + Winrate ── */}
        <RankDisplay ranked={ranked} wr={wr} loading={loading} />

        {/* ── Row 3: Mastery + Champion WR + games (ranked 7d) ── */}
        {!loading && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-800/60 border border-gray-700/30">
            {mastery && (
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border leading-tight shrink-0 ${masteryBadge(mastery.championLevel).cls}`}>
                {masteryBadge(mastery.championLevel).text}
                <span className="font-normal opacity-80">{formatPoints(mastery.championPoints)}</span>
              </span>
            )}

            {champ && (
              <img src={champIcon(ddragon.version, currentChampion.icon || champ.image)} alt={currentChampion.name || champ.name} className="w-5 h-5 rounded" loading="lazy" />
            )}

            <ChampStatsPreview champWR={champWR} champGames={champGames} champStats={champStats} />
          </div>
        )}

        {/* ── Row 4: Full runes breakdown (fixed-height slot for alignment) ── */}
        {!loading && runes && (runes.primaryRunes.length > 0 || runes.secondaryRunes.length > 0) && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-800/40 border border-gray-700/20 flex-wrap min-h-[28px]">
            <RuneIcon slot={runes.primaryStyle} size="w-4 h-4" />
            <span className="text-gray-700 text-[10px]">|</span>
            {runes.primaryRunes.map((r) => (
              <RuneIcon key={`p-${r.id}`} slot={r} size="w-4 h-4" />
            ))}
            <span className="text-gray-700 text-[10px] mx-0.5">·</span>
            {runes.secondaryRunes.map((r) => (
              <RuneIcon key={`s-${r.id}`} slot={r} size="w-4 h-4" />
            ))}
            {runes.shards.length > 0 && (
              <>
                <span className="text-gray-700 text-[10px] mx-0.5">·</span>
                {runes.shards.map((s) => (
                  <RuneIcon key={`sh-${s.id}`} slot={s} size="w-3.5 h-3.5" />
                ))}
              </>
            )}
          </div>
        )}

        {/* ── Row 5: W/L record ── */}
        {ranked && !loading && (
          <div className="text-xs text-gray-500 flex items-center gap-2 border-t border-gray-700/30 pt-2 mt-auto">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-400 font-semibold">{ranked.wins}W</span>
            </span>
            <span className="text-gray-700">/</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-red-400 font-semibold">{ranked.losses}L</span>
            </span>
            <span className="text-gray-600 ml-auto text-[10px]">{ranked.games} jugadas</span>
          </div>
        )}
      </div>
    </div>
  );
}
