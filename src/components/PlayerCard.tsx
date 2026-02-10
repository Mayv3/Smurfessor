import { SmurfBadge } from "./ui/SmurfBadge";
import { IconPerson, IconFire, IconRubble } from "./ui/Icons";
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
  recentWindow: number;
  gamesWithChamp: number | null;
  winrateWithChamp: number | null;
  sampleSizeOk: boolean;
  note?: string;
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
  runes: NormalizedRunes | null;
  spells: { spell1: PlayerCardSpell; spell2: PlayerCardSpell } | null;
  smurf: SmurfAssessment;
  /** Original participant data for fallback spell/champ display */
  participant: {
    championId: number;
    spell1Id: number;
    spell2Id: number;
    perkKeystone?: number;
    perkPrimaryStyle?: number;
    perkSubStyle?: number;
  };
  /** DDragon data for fallback icon resolution */
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
  return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${tier.toLowerCase()}.png`;
}

/* ── Rank colors ──────────────────────────────────────── */
const TIER_COLOR: Record<string, string> = {
  IRON: "text-gray-400", BRONZE: "text-amber-600", SILVER: "text-gray-300",
  GOLD: "text-yellow-400", PLATINUM: "text-teal-300", EMERALD: "text-emerald-400",
  DIAMOND: "text-blue-300", MASTER: "text-purple-400", GRANDMASTER: "text-red-400",
  CHALLENGER: "text-amber-300",
};

/* ── Winrate color helper ─────────────────────────────── */
function wrColor(wr: number): string {
  if (wr >= 60) return "text-red-400";
  if (wr >= 55) return "text-yellow-400";
  if (wr >= 50) return "text-emerald-400";
  return "text-gray-400";
}

/* ── Smurf visual helpers ─────────────────────────────── */
function smurfCardClass(smurf?: SmurfAssessment): string {
  if (!smurf) return "border-gray-700/60";
  if (smurf.severity === "confirmed") return "border-red-500/60 ring-1 ring-red-500/20 bg-red-950/20";
  if (smurf.severity === "possible") return "border-yellow-500/40 ring-1 ring-yellow-500/15 bg-yellow-950/10";
  return "border-gray-700/60";
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

/* ══════════════════════════════════════════════════════════
   PlayerCard — Full card with all enriched data
   ══════════════════════════════════════════════════════════ */
export function PlayerCard({
  riotId,
  summonerLevel,
  ranked,
  currentChampion,
  champStats,
  runes,
  smurf,
  participant,
  ddragon,
  loading,
}: PlayerCardProps) {
  const champ = ddragon.champions[String(participant.championId)];
  const s1 = ddragon.spells[String(participant.spell1Id)];
  const s2 = ddragon.spells[String(participant.spell2Id)];

  /* Fallback rune icons when normalized runes unavailable */
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

  return (
    <div
      className={`relative rounded-xl border backdrop-blur-sm bg-gray-800/80 p-4 flex flex-col gap-3 w-full min-h-[280px] transition-all ${smurfCardClass(smurf)}`}
      data-smurf-severity={smurf?.severity ?? "none"}
      data-testid="player-card"
    >
      {/* ── Corner badges ── */}
      {summonerLevel > 0 && !loading && (
        <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-900/80 border border-gray-600/60 backdrop-blur-sm z-10">
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
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border bg-orange-600/90 text-white border-orange-400 leading-tight" title={`${ranked!.games} rankeds jugadas`}>
            <IconFire className="w-2.5 h-2.5" />
            ELO QUEMADO
          </span>
        )}
        {escombro && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border bg-stone-600/90 text-white border-stone-400 leading-tight" title={`${wr}% WR en ranked`}>
            <IconRubble className="w-2.5 h-2.5" />
            ESCOMBRO
          </span>
        )}
      </div>

      {/* ── Row 1: Champion + Spells + Runes + Name ── */}
      <div className="flex items-center gap-3 mt-6">
        <div className="relative shrink-0">
          {champ ? (
            <img
              src={champIcon(ddragon.version, currentChampion.icon || champ.image)}
              alt={currentChampion.name || champ.name}
              className="w-16 h-16 rounded-xl ring-2 ring-gray-600"
              loading="lazy"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gray-700 flex items-center justify-center text-gray-500 text-sm">?</div>
          )}
          <div className="absolute -bottom-1 -right-1 flex gap-px">
            {s1 && <img src={spellIcon(ddragon.version, s1.image)} alt={s1.name} className="w-5 h-5 rounded-sm ring-1 ring-gray-900" loading="lazy" />}
            {s2 && <img src={spellIcon(ddragon.version, s2.image)} alt={s2.name} className="w-5 h-5 rounded-sm ring-1 ring-gray-900" loading="lazy" />}
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
              <div className="w-7 h-7 rounded-full bg-gray-700/40" />
              <div className="w-5 h-5 rounded-full bg-gray-700/30 self-center" />
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {loading ? (
            <span className="w-20 h-4 bg-gray-700 rounded animate-pulse inline-block" />
          ) : (
            <>
              <span className="font-bold text-white text-sm leading-snug block break-words">
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
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-12 h-12 bg-gray-700 rounded" />
          <div className="h-5 w-20 bg-gray-700 rounded" />
          <div className="h-8 w-14 bg-gray-700 rounded ml-auto" />
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {ranked ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img src={rankEmblem(ranked.tier)} alt={ranked.tier} className="w-12 h-12 object-contain shrink-0" loading="lazy" />
              <div className="min-w-0">
                <div className={`text-sm font-bold leading-tight ${TIER_COLOR[ranked.tier] ?? "text-gray-400"}`}>
                  {ranked.tier} {ranked.rank}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{ranked.leaguePoints} LP</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 text-gray-600 text-sm">
              <div className="w-12 h-12 rounded bg-gray-700/50 flex items-center justify-center">
                <span className="text-gray-600 text-sm">—</span>
              </div>
              <span>Unranked</span>
            </div>
          )}

          <div className="text-right shrink-0">
            {wr !== null ? (
              <>
                <div className={`text-2xl font-extrabold leading-none ${wrColor(wr)}`}>{wr}%</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Ranked</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-extrabold leading-none text-gray-600">—</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Ranked</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Row 3: Champion WR + games ── */}
      {!loading && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-950/30 border border-blue-500/15">
          {champ && (
            <img src={champIcon(ddragon.version, currentChampion.icon || champ.image)} alt={currentChampion.name || champ.name} className="w-5 h-5 rounded" loading="lazy" />
          )}
          {champWR !== null && champGames > 0 ? (
            <>
              <span className={`text-sm font-bold ${wrColor(champWR)}`}>{champWR}%</span>
              <span className="text-[10px] text-gray-500">{champGames} partidas</span>
              {!champStats.sampleSizeOk && (
                <span className="text-[9px] text-yellow-600 ml-auto" title="Muestra insuficiente (&lt;8)">⚠</span>
              )}
            </>
          ) : champStats.note === "FEATURE_DISABLED" ? (
            <span className="text-[10px] text-gray-600" title="Activa FEATURE_MATCH_HISTORY para ver winrate con campeón">
              Champ WR: —
            </span>
          ) : (
            <span className="text-[10px] text-gray-600">
              {champStats.note === "NO_CHAMP_GAMES" ? "Sin partidas recientes" : "Champ WR: —"}
            </span>
          )}
        </div>
      )}

      {/* ── Row 4: Full runes breakdown ── */}
      {!loading && runes && (runes.primaryRunes.length > 0 || runes.secondaryRunes.length > 0) && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-900/40 border border-gray-700/30 flex-wrap">
          <RuneIcon slot={runes.primaryStyle} size="w-4 h-4" />
          <span className="text-gray-600 text-[10px]">|</span>
          {runes.primaryRunes.map((r, i) => (
            <RuneIcon key={`p-${i}`} slot={r} size="w-4 h-4" />
          ))}
          <span className="text-gray-600 text-[10px] mx-0.5">·</span>
          {runes.secondaryRunes.map((r, i) => (
            <RuneIcon key={`s-${i}`} slot={r} size="w-4 h-4" />
          ))}
          {runes.shards.length > 0 && (
            <>
              <span className="text-gray-600 text-[10px] mx-0.5">·</span>
              {runes.shards.map((s, i) => (
                <RuneIcon key={`sh-${i}`} slot={s} size="w-3.5 h-3.5" />
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Row 5: W/L record ── */}
      {ranked && !loading && (
        <div className="text-xs text-gray-500 flex items-center gap-2.5 border-t border-gray-700/40 pt-2.5 mt-auto">
          <span className="text-emerald-400 font-semibold">{ranked.wins}W</span>
          <span className="text-gray-600">/</span>
          <span className="text-red-400 font-semibold">{ranked.losses}L</span>
          <span className="text-gray-500 ml-auto">{ranked.games} jugadas</span>
        </div>
      )}
    </div>
  );
}
