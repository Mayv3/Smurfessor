import { SmurfBadge } from "./ui/SmurfBadge";
import { IconPerson, IconFire } from "./ui/Icons";
import type { SmurfAssessment } from "../lib/smurf/rules";
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
  puuid: string;
  teamId: number;
  riotId: { gameName: string; tagLine: string };
  summonerLevel: number;
  profileIconId: number;
  ranked: PlayerCardRanked | null;
  currentChampion: PlayerCardChampion;
  champStats: PlayerCardChampStats;
  mastery: PlayerCardMastery | null;
  runes: NormalizedRunes | null;
  spells: { spell1: PlayerCardSpell; spell2: PlayerCardSpell } | null;
  smurf: SmurfAssessment;
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

/* ── Smurf visual helpers ─────────────────────────────── */
function smurfCardClass(smurf?: SmurfAssessment, tier?: string): string {
  if (smurf?.severity === "confirmed") return "border-red-500/50 animate-borderGlow";
  if (smurf?.severity === "possible") return "border-yellow-500/40 animate-borderGlowYellow";
  if (tier) return TIER_BORDER[tier] ?? "border-gray-700/40";
  return "border-gray-700/40";
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
function RuneIcon({ slot, size = "w-5 h-5" }: { slot: NormalizedRuneSlot; size?: string }) {
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

/* ── Skull icon for escombro ──────────────────────────── */
function IconSkull({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12v4a2 2 0 002 2h1v2a2 2 0 002 2h2v-2h2v2h2v-2h2a2 2 0 002-2v-2h1a2 2 0 002-2v-4c0-5.52-4.48-10-10-10zm-3 13a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm6 0a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
    </svg>
  );
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
  smurf,
  participant,
  ddragon,
  loading,
}: PlayerCardProps) {
  const champ = ddragon.champions[String(participant.championId)];
  const s1 = ddragon.spells[String(participant.spell1Id)];
  const s2 = ddragon.spells[String(participant.spell2Id)];

  const keystoneRune = !runes && participant.perkKeystone != null
    ? ddragon.runeData?.[String(participant.perkKeystone)]
    : undefined;
  const subRuneTree = !runes && participant.perkSubStyle != null
    ? ddragon.runes?.[String(participant.perkSubStyle)]
    : undefined;

  const wr = ranked ? Math.round(ranked.winrate * 100) : null;
  const champWR = champStats.winrateWithChamp != null ? Math.round(champStats.winrateWithChamp * 100) : null;
  const champGames = champStats.gamesWithChamp ?? 0;

  const eloQuemado = !loading && isEloQuemado(ranked);
  const escombro = !loading && isEscombro(ranked);

  const tier = ranked?.tier;
  const gradient = tier ? TIER_GRADIENT[tier] ?? "from-transparent to-transparent" : "from-transparent to-transparent";
  const glowCls = !loading && tier && smurf?.severity === "none" ? tierGlowClass(tier) : "";

  return (
    <div
      className={`relative rounded-xl border overflow-hidden bg-gray-900/90 backdrop-blur-sm flex flex-col w-full min-h-[280px] transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/30 group ${smurfCardClass(smurf, tier)} ${glowCls}`}
      data-smurf-severity={smurf?.severity ?? "none"}
      data-testid="player-card"
    >
      {/* ── Tier gradient accent top ── */}
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${gradient} pointer-events-none`} />

      {/* ── Card content ── */}
      <div className="relative flex flex-col gap-2.5 p-3.5 flex-1">

        {/* ── Corner badges ── */}
        {summonerLevel > 0 && !loading && (
          <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/50 border border-gray-600/40 backdrop-blur-md z-10">
            <IconPerson className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] font-semibold text-gray-300">{summonerLevel}</span>
          </div>
        )}

        <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
          {smurf && smurf.severity !== "none" && !loading && (
            <SmurfBadge
              severity={smurf.severity}
              label={smurf.label}
              probability={smurf.probability}
              reasons={smurf.reasons}
            />
          )}
          {eloQuemado && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border bg-gradient-to-r from-orange-600 to-orange-500 text-white border-orange-400/60 shadow-sm shadow-orange-500/20 animate-firePulse" title={`${ranked!.games} rankeds jugadas`}>
              <IconFire className="w-3 h-3" />
              ELO QUEMADO
            </span>
          )}
          {escombro && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border bg-gradient-to-r from-stone-700 to-stone-600 text-stone-200 border-stone-500/60 shadow-sm" title={`${wr}% WR en ranked`}>
              <IconSkull className="w-3 h-3" />
              ESCOMBRO
            </span>
          )}
        </div>

        {/* ── Row 1: Champion + Spells + Runes + Name ── */}
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
            {runes ? (
              <>
                <RuneIcon slot={runes.keystone} size="w-7 h-7" />
                <RuneIcon slot={runes.subStyle} size="w-5 h-5" />
              </>
            ) : keystoneRune ? (
              <>
                <img src={runeIconUrl(keystoneRune.icon)} alt={keystoneRune.name} title={keystoneRune.name} className="w-7 h-7 rounded-full bg-gray-900/60 p-0.5" loading="lazy" />
                {subRuneTree ? (
                  <img src={runeIconUrl(subRuneTree.icon)} alt={subRuneTree.name} title={subRuneTree.name} className="w-5 h-5 rounded-full bg-gray-900/60 p-0.5 self-center opacity-70" loading="lazy" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-700/30 self-center" />
                )}
              </>
            ) : (
              <>
                <div className="w-7 h-7 rounded-full bg-gray-800/60" />
                <div className="w-5 h-5 rounded-full bg-gray-800/40 self-center" />
              </>
            )}
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

        {/* ── Row 2: Rank + Winrate ── */}
        {loading ? (
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gray-800 rounded-lg animate-shimmer" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-20 bg-gray-800 rounded animate-shimmer" />
              <div className="h-3 w-12 bg-gray-800/60 rounded animate-shimmer" />
            </div>
            <div className="w-12 h-8 bg-gray-800 rounded-lg animate-shimmer" />
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            {ranked ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <img
                  src={rankEmblem(ranked.tier)}
                  alt={ranked.tier}
                  className="w-11 h-11 object-contain shrink-0 drop-shadow-lg"
                  loading="lazy"
                />
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

            {/* WR with mini progress bar */}
            <div className="text-right shrink-0">
              {wr !== null ? (
                <div className="flex flex-col items-end gap-1">
                  <div className={`text-xl font-extrabold leading-none ${wrColor(wr)}`}>{wr}%</div>
                  <div className="w-12 h-1 rounded-full bg-gray-700/60 overflow-hidden">
                    <div className={`h-full rounded-full ${wrBgColor(wr)} transition-all`} style={{ width: `${Math.min(wr, 100)}%` }} />
                  </div>
                  <div className="text-[9px] text-gray-600 uppercase tracking-wider">WR</div>
                </div>
              ) : (
                <div className="flex flex-col items-end gap-1">
                  <div className="text-xl font-extrabold leading-none text-gray-700">—</div>
                  <div className="text-[9px] text-gray-600 uppercase tracking-wider">WR</div>
                </div>
              )}
            </div>
          </div>
        )}

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

            {champWR !== null && champGames > 0 ? (
              <>
                <span className={`text-sm font-bold ${wrColor(champWR)}`}>{champWR}%</span>
                <span className="text-[10px] text-gray-500">
                  {champGames}p / {champStats.totalRankedGames}
                </span>
                <span className="text-[9px] text-gray-600 ml-auto px-1 py-0.5 rounded bg-gray-800/80 border border-gray-700/40" title="Últimos 7 días ranked">7d</span>
              </>
            ) : champStats.note === "FEATURE_DISABLED" ? (
              <span className="text-[10px] text-gray-600">Champ WR: —</span>
            ) : champStats.totalRankedGames > 0 ? (
              <span className="text-[10px] text-gray-600">
                0p / {champStats.totalRankedGames} ranked (7d)
              </span>
            ) : !mastery ? (
              <span className="text-[10px] text-gray-600">
                {champStats.note === "NO_CHAMP_GAMES" ? "Sin ranked (7d)" : "Champ WR: —"}
              </span>
            ) : (
              <span className="text-[10px] text-gray-600">Sin ranked recientes (7d)</span>
            )}
          </div>
        )}

        {/* ── Row 4: Full runes breakdown ── */}
        {!loading && runes && (runes.primaryRunes.length > 0 || runes.secondaryRunes.length > 0) && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-800/40 border border-gray-700/20 flex-wrap">
            <RuneIcon slot={runes.primaryStyle} size="w-4 h-4" />
            <span className="text-gray-700 text-[10px]">|</span>
            {runes.primaryRunes.map((r, i) => (
              <RuneIcon key={`p-${i}`} slot={r} size="w-4 h-4" />
            ))}
            <span className="text-gray-700 text-[10px] mx-0.5">·</span>
            {runes.secondaryRunes.map((r, i) => (
              <RuneIcon key={`s-${i}`} slot={r} size="w-4 h-4" />
            ))}
            {runes.shards.length > 0 && (
              <>
                <span className="text-gray-700 text-[10px] mx-0.5">·</span>
                {runes.shards.map((s, i) => (
                  <RuneIcon key={`sh-${i}`} slot={s} size="w-3.5 h-3.5" />
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
