import { SmurfBadge } from "./ui/SmurfBadge";
import { IconPerson, IconFire, IconRubble } from "./ui/Icons";
import type { SmurfAssessment } from "../lib/smurf/rules";

/* ── Types ────────────────────────────────────────────── */
interface Participant {
  puuid: string;
  riotId: string;
  championId: number;
  spell1Id: number;
  spell2Id: number;
  teamId: number;
  perkKeystone?: number;
  perkPrimaryStyle?: number;
  perkSubStyle?: number;
}

interface DDragon {
  version: string;
  champions: Record<string, { id: string; name: string; key: string; image: string }>;
  spells: Record<string, { id: string; name: string; key: string; image: string }>;
  runes?: Record<string, { id: number; key: string; name: string; icon: string }>;
  runeData?: Record<string, { id: number; key: string; name: string; icon: string }>;
}

interface RankedQueue {
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

export interface BatchSummary {
  summonerLevel: number;
  profileIconId: number;
  soloQueue: RankedQueue | null;
  flexQueue: RankedQueue | null;
  championWinrate?: number | null;
  championSampleSize?: number;
}

/* ── CDN URLs ─────────────────────────────────────────── */
const DD = "https://ddragon.leagueoflegends.com";
function champIcon(ver: string, img: string) { return `${DD}/cdn/${ver}/img/champion/${img}`; }
function spellIcon(ver: string, img: string) { return `${DD}/cdn/${ver}/img/spell/${img}`; }
function runeIcon(iconPath: string) { return `${DD}/cdn/img/${iconPath}`; }
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
function isEloQuemado(queue: RankedQueue | null): boolean {
  if (!queue) return false;
  return queue.wins + queue.losses > 300;
}

function isEscombro(queue: RankedQueue | null): boolean {
  if (!queue) return false;
  const total = queue.wins + queue.losses;
  if (total < 10) return false;
  return Math.round((queue.wins / total) * 100) < 46;
}

/* ══════════════════════════════════════════════════════════
   PlayerCard
   ══════════════════════════════════════════════════════════ */
export function PlayerCard({
  participant,
  ddragon,
  smurfData,
  summary,
  batchLoading,
}: {
  participant: Participant;
  ddragon: DDragon;
  smurfData?: SmurfAssessment;
  summary?: BatchSummary;
  batchLoading?: boolean;
}) {
  const champ = ddragon.champions[String(participant.championId)];
  const s1 = ddragon.spells[String(participant.spell1Id)];
  const s2 = ddragon.spells[String(participant.spell2Id)];

  const keystoneRune = participant.perkKeystone != null
    ? ddragon.runeData?.[String(participant.perkKeystone)]
    : undefined;
  const subRune = participant.perkSubStyle != null
    ? ddragon.runes?.[String(participant.perkSubStyle)]
    : undefined;

  const queue = summary?.soloQueue ?? summary?.flexQueue ?? null;
  const total = queue ? queue.wins + queue.losses : 0;
  const wr = total > 0 ? Math.round((queue!.wins / total) * 100) : null;
  const level = summary?.summonerLevel ?? null;
  const champWR = summary?.championWinrate !== undefined && summary?.championWinrate !== null
    ? Math.round(summary.championWinrate * 100)
    : null;
  const champGames = summary?.championSampleSize ?? 0;

  const eloQuemado = !batchLoading && isEloQuemado(queue);
  const escombro = !batchLoading && isEscombro(queue);

  return (
    <div
      className={`relative rounded-xl border backdrop-blur-sm bg-gray-800/80 p-5 flex flex-col gap-4 w-full min-h-[280px] transition-all ${smurfCardClass(smurfData)}`}
      data-smurf-severity={smurfData?.severity ?? "none"}
    >
      {/* ── Corner badges ── */}
      {/* Level badge - top left */}
      {level !== null && !batchLoading && (
        <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-900/80 border border-gray-600/60 backdrop-blur-sm z-10">
          <IconPerson className="w-3 h-3 text-gray-400" />
          <span className="text-[10px] font-semibold text-gray-300">{level}</span>
        </div>
      )}

      {/* Status badges - top right (smurf, elo quemado, escombro) */}
      <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
        {smurfData && smurfData.severity !== "none" && !batchLoading && (
          <SmurfBadge
            severity={smurfData.severity}
            label={smurfData.label}
            probability={smurfData.probability}
            reasons={smurfData.reasons}
          />
        )}
        {eloQuemado && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border bg-orange-600/90 text-white border-orange-400 leading-tight" title={`${total} rankeds jugadas`}>
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
        {/* Champion icon with spells + runes */}
        <div className="relative shrink-0">
          {champ ? (
            <img
              src={champIcon(ddragon.version, champ.image)}
              alt={champ.name}
              className="w-16 h-16 rounded-xl ring-2 ring-gray-600"
              loading="lazy"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gray-700 flex items-center justify-center text-gray-500 text-sm">?</div>
          )}
          {/* Spells on bottom-right */}
          <div className="absolute -bottom-1 -right-1 flex gap-px">
            {s1 && <img src={spellIcon(ddragon.version, s1.image)} alt={s1.name} className="w-5 h-5 rounded-sm ring-1 ring-gray-900" loading="lazy" />}
            {s2 && <img src={spellIcon(ddragon.version, s2.image)} alt={s2.name} className="w-5 h-5 rounded-sm ring-1 ring-gray-900" loading="lazy" />}
          </div>
        </div>

        {/* Runes — keystone (specific) + sub tree */}
        <div className="flex flex-col gap-0.5 shrink-0">
          {keystoneRune ? (
            <img
              src={runeIcon(keystoneRune.icon)}
              alt={keystoneRune.name}
              title={keystoneRune.name}
              className="w-7 h-7 rounded-full bg-gray-900/60 p-0.5"
              loading="lazy"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gray-700/40" />
          )}
          {subRune ? (
            <img
              src={runeIcon(subRune.icon)}
              alt={subRune.name}
              title={subRune.name}
              className="w-5 h-5 rounded-full bg-gray-900/60 p-0.5 self-center opacity-70"
              loading="lazy"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-gray-700/30 self-center" />
          )}
        </div>

        {/* Name + tag on separate lines */}
        <div className="flex-1 min-w-0">
          {(() => {
            const rid = participant.riotId || "Unknown";
            const hashIdx = rid.lastIndexOf("#");
            const name = hashIdx > 0 ? rid.slice(0, hashIdx) : rid;
            const tag = hashIdx > 0 ? rid.slice(hashIdx) : "";
            return (
              <>
                <span className="font-bold text-white text-sm leading-snug block break-words">
                  {name}
                </span>
                {tag && (
                  <span className="text-[11px] text-gray-500 block mt-0.5">{tag}</span>
                )}
              </>
            );
          })()}
          {batchLoading && (
            <span className="w-16 h-4 bg-gray-700 rounded animate-pulse inline-block mt-1" />
          )}
        </div>
      </div>

      {/* ── Row 2: Rank + Winrate ── */}
      {batchLoading ? (
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-12 h-12 bg-gray-700 rounded" />
          <div className="h-5 w-20 bg-gray-700 rounded" />
          <div className="h-8 w-14 bg-gray-700 rounded ml-auto" />
        </div>
      ) : (
        <>
        <div className="flex items-center gap-3">
          {/* Rank emblem + tier text */}
          {queue ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img
                src={rankEmblem(queue.tier)}
                alt={queue.tier}
                className="w-12 h-12 object-contain shrink-0"
                loading="lazy"
              />
              <div className="min-w-0">
                <div className={`text-sm font-bold leading-tight ${TIER_COLOR[queue.tier] ?? "text-gray-400"}`}>
                  {queue.tier} {queue.rank}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{queue.leaguePoints} LP</div>
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

          {/* Ranked winrate */}
          <div className="text-right shrink-0">
            {wr !== null ? (
              <>
                <div className={`text-2xl font-extrabold leading-none ${wrColor(wr)}`}>
                  {wr}%
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                  Ranked
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-extrabold leading-none text-gray-600">—</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Ranked</div>
              </>
            )}
          </div>
        </div>

        {/* Champion-specific WR */}
        {champWR !== null && champGames >= 3 && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-950/30 border border-blue-500/15">
            {champ && (
              <img
                src={champIcon(ddragon.version, champ.image)}
                alt={champ.name}
                className="w-5 h-5 rounded"
                loading="lazy"
              />
            )}
            <span className={`text-sm font-bold ${wrColor(champWR)}`}>{champWR}%</span>
            <span className="text-[10px] text-gray-500">{champGames} partidas</span>
          </div>
        )}
        </>
      )}

      {/* ── Row 3: W/L record ── */}
      {queue && !batchLoading && (
        <div className="text-xs text-gray-500 flex items-center gap-2.5 border-t border-gray-700/40 pt-2.5 mt-auto">
          <span className="text-emerald-400 font-semibold">{queue.wins}W</span>
          <span className="text-gray-600">/</span>
          <span className="text-red-400 font-semibold">{queue.losses}L</span>
          <span className="text-gray-500 ml-auto">{total} jugadas</span>
        </div>
      )}
    </div>
  );
}
