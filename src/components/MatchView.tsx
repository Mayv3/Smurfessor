import { useEffect, useState, useRef, useCallback } from "react";
import { PlayerCard } from "./PlayerCard";
import { IconShield, IconWarning, IconCheckCircle } from "./ui/Icons";
import { assignRoles } from "../lib/roles/assign";
import type { Role, RoledParticipant } from "../lib/roles/assign";
import type { SmurfAssessment } from "../lib/smurf/rules";
import type { NormalizedRunes } from "../lib/ddragon/runes";

/* ── Types ────────────────────────────────────────────── */
interface Participant {
  puuid: string | null;
  riotId: string;
  championId: number;
  spell1Id: number;
  spell2Id: number;
  teamId: number;
  perkKeystone?: number;
  perkPrimaryStyle?: number;
  perkSubStyle?: number;
  perks?: {
    perkIds?: number[];
    perkStyle?: number;
    perkSubStyle?: number;
    perkStatShards?: { offense?: number; flex?: number; defense?: number };
  };
}

interface DDragon {
  version: string;
  champions: Record<string, { id: string; name: string; key: string; image: string }>;
  spells: Record<string, { id: string; name: string; key: string; image: string }>;
  runes?: Record<string, { id: number; key: string; name: string; icon: string }>;
  runeData?: Record<string, { id: number; key: string; name: string; icon: string }>;
}

/** Shape returned by POST /api/player-cards */
interface PlayerCardDataFromAPI {
  puuid: string;
  teamId: number;
  riotId: { gameName: string; tagLine: string };
  summonerLevel: number;
  profileIconId: number;
  ranked: {
    queue: "RANKED_SOLO_5x5" | "RANKED_FLEX_SR";
    tier: string; rank: string; leaguePoints: number;
    wins: number; losses: number; games: number; winrate: number;
  } | null;
  currentChampion: { id: number; name: string; icon: string };
  champStats: {
    recentWindow: string;
    totalRankedGames: number;
    gamesWithChamp: number | null;
    winrateWithChamp: number | null;
    sampleSizeOk: boolean;
    note?: string;
  };
  mastery: { championLevel: number; championPoints: number } | null;
  runes: NormalizedRunes | null;
  spells: { spell1: { id: number; name: string; icon: string }; spell2: { id: number; name: string; icon: string } } | null;
  smurf: SmurfAssessment;
}

interface Props {
  game: {
    gameId: number;
    gameMode: string;
    gameStartTime: number;
    teams: { blue: Participant[]; red: Participant[] };
  };
  ddragon: DDragon;
  platform?: string;
}

/* ── Smurf counter ───────────────────────────────────── */
interface SmurfCount { confirmed: number; possible: number; }

/* ── Official LoL role icons (CommunityDragon champ-select SVGs) ── */
const ROLE_META: Record<Role, { label: string; short: string }> = {
  TOP:     { label: "Top",     short: "TOP" },
  JUNGLE:  { label: "Jungla",  short: "JG" },
  MID:     { label: "Mid",     short: "MID" },
  ADC:     { label: "ADC",     short: "ADC" },
  SUPPORT: { label: "Support", short: "SUP" },
};

function RoleIcon({ role, size = 20 }: { role: Role; size?: number }) {
  const s = { width: size, height: size };
  switch (role) {
    case "TOP":
      return (
        <svg style={s} viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">
          <path opacity="0.5" fill="#785a28" fillRule="evenodd" d="M21,14H14v7h7V14Zm5-3V26L11.014,26l-4,4H30V7.016Z"/>
          <polygon fill="#c8aa6e" points="4 4 4.003 28.045 9 23 9 9 23 9 28.045 4.003 4 4"/>
        </svg>
      );
    case "JUNGLE":
      return (
        <svg style={s} viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">
          <path fill="#c8aa6e" fillRule="evenodd" d="M25,3c-2.128,3.3-5.147,6.851-6.966,11.469A42.373,42.373,0,0,1,20,20a27.7,27.7,0,0,1,1-3C21,12.023,22.856,8.277,25,3ZM13,20c-1.488-4.487-4.76-6.966-9-9,3.868,3.136,4.422,7.52,5,12l3.743,3.312C14.215,27.917,16.527,30.451,17,31c4.555-9.445-3.366-20.8-8-28C11.67,9.573,13.717,13.342,13,20Zm8,5a15.271,15.271,0,0,1,0,2l4-4c0.578-4.48,1.132-8.864,5-12C24.712,13.537,22.134,18.854,21,25Z"/>
        </svg>
      );
    case "MID":
      return (
        <svg style={s} viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">
          <path opacity="0.5" fill="#785a28" fillRule="evenodd" d="M30,12.968l-4.008,4L26,26H17l-4,4H30ZM16.979,8L21,4H4V20.977L8,17,8,8h8.981Z"/>
          <polygon fill="#c8aa6e" points="25 4 4 25 4 30 9 30 30 9 30 4 25 4"/>
        </svg>
      );
    case "ADC":
      return (
        <svg style={s} viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">
          <path opacity="0.5" fill="#785a28" fillRule="evenodd" d="M13,20h7V13H13v7ZM4,4V26.984l3.955-4L8,8,22.986,8l4-4H4Z"/>
          <polygon fill="#c8aa6e" points="29.997 5.955 25 11 25 25 11 25 5.955 29.997 30 30 29.997 5.955"/>
        </svg>
      );
    case "SUPPORT":
      return (
        <svg style={s} viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">
          <path fill="#c8aa6e" fillRule="evenodd" d="M26,13c3.535,0,8-4,8-4H23l-3,3,2,7,5-2-3-4h2ZM22,5L20.827,3H13.062L12,5l5,6Zm-5,9-1-1L13,28l4,3,4-3L18,13ZM11,9H0s4.465,4,8,4h2L7,17l5,2,2-7Z"/>
        </svg>
      );
  }
}

function countSmurfs(puuids: string[], map: Map<string, PlayerCardDataFromAPI>): SmurfCount {
  let confirmed = 0, possible = 0;
  for (const id of puuids) {
    const s = map.get(id);
    if (!s) continue;
    if (s.smurf.severity === "confirmed") confirmed++;
    else if (s.smurf.severity === "possible") possible++;
  }
  return { confirmed, possible };
}

/* ── Team section ────────────────────────────────────── */
function TeamSection({
  label,
  color,
  participants,
  ddragon,
  cards,
  loading,
}: {
  label: string;
  color: "blue" | "red";
  participants: Participant[];
  ddragon: DDragon;
  cards: Map<string, PlayerCardDataFromAPI>;
  loading: boolean;
}) {
  const accentBorder = color === "blue" ? "border-blue-500" : "border-red-500";
  const accentText = color === "blue" ? "text-blue-400" : "text-red-400";
  const accentBg = color === "blue" ? "bg-blue-500" : "bg-red-500";

  /* Assign roles using champion + spell heuristics */
  const initialRoled = assignRoles(participants);

  /* ── Drag & drop state ── */
  const [order, setOrder] = useState<RoledParticipant<Participant>[]>(initialRoled);
  const dragIdx = useRef<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);

  /* Sync when participants change (new game) */
  const prevGameKey = useRef("");
  const gameKey = participants.map(p => p.championId).join("-");
  if (gameKey !== prevGameKey.current) {
    prevGameKey.current = gameKey;
    // Reset order to match new assignment — this runs during render (safe for ref sync)
    if (order.length !== initialRoled.length || order.some((o, i) => o.data.championId !== initialRoled[i].data.championId)) {
      setOrder(initialRoled);
    }
  }

  const handleDragStart = useCallback((idx: number) => {
    dragIdx.current = idx;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    dragOverIdx.current = idx;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    const fromIdx = dragIdx.current;
    if (fromIdx === null || fromIdx === dropIdx) return;
    setOrder(prev => {
      const next = [...prev];
      // Swap the two cards, keeping each slot's role label
      const fromRole = next[fromIdx].role;
      const toRole = next[dropIdx].role;
      const fromData = next[fromIdx].data;
      const toData = next[dropIdx].data;
      next[fromIdx] = { role: fromRole, data: toData };
      next[dropIdx] = { role: toRole, data: fromData };
      return next;
    });
    dragIdx.current = null;
    dragOverIdx.current = null;
  }, []);

  const handleDragEnd = useCallback(() => {
    dragIdx.current = null;
    dragOverIdx.current = null;
  }, []);

  const roled = order;

  return (
    <div>
      {/* Team header */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-3 h-3 rounded-full ${accentBg}`} />
        <h3 className={`text-base font-bold uppercase tracking-wider ${accentText}`}>
          {label}
        </h3>
        <div className={`flex-1 h-px ${accentBorder} opacity-30`} />
      </div>

      {/* Role labels row */}
      <div className="grid grid-cols-5 gap-3 mb-2">
        {roled.map(({ role }, i) => (
          <div key={`role-${i}`} className="flex items-center justify-center gap-1.5">
            <RoleIcon role={role} size={16} />
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              {ROLE_META[role].short}
            </span>
          </div>
        ))}
      </div>

      {/* 5 cards in a responsive grid — draggable */}
      <div className="grid grid-cols-5 gap-3">
        {roled.map(({ role, data: p }, i) => {
          const isStreamer = !p.puuid || p.puuid.length === 0;

          /* ── Streamer mode card ── */
          if (isStreamer) {
            const champ = ddragon.champions[String(p.championId)];
            const champImg = champ
              ? `https://ddragon.leagueoflegends.com/cdn/${ddragon.version}/img/champion/${champ.image}`
              : null;

            return (
              <div
                key={`streamer-${role}-${i}`}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDrop={(e) => handleDrop(e, i)}
                onDragEnd={handleDragEnd}
                className="relative rounded-xl border border-purple-500/40 ring-1 ring-purple-500/20 bg-purple-950/20 backdrop-blur-sm p-4 flex flex-col items-center justify-center gap-3 w-full min-h-[280px] cursor-grab active:cursor-grabbing"
              >
                {champImg ? (
                  <img
                    src={champImg}
                    alt={champ?.name ?? "?"}
                    className="w-20 h-20 rounded-xl ring-2 ring-purple-500/40"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gray-700 flex items-center justify-center text-gray-500 text-2xl">?</div>
                )}
                <div className="text-center">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-600/80 text-white text-[10px] font-bold uppercase tracking-wider border border-purple-400/50">
                    🎭 Modo Streamer
                  </span>
                  <p className="text-[11px] text-purple-300/80 mt-2 leading-tight">
                    Este putito tiene<br/>modo streamer
                  </p>
                </div>
              </div>
            );
          }

          const puuid = p.puuid!; // guaranteed non-null after isStreamer guard
          const card = cards.get(puuid);
          const champ = ddragon.champions[String(p.championId)];
          return (
            <div
              key={puuid}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              className="cursor-grab active:cursor-grabbing"
            >
            <PlayerCard
              puuid={puuid}
              teamId={p.teamId}
              riotId={card?.riotId ?? { gameName: p.riotId?.split("#")?.[0] ?? "Unknown", tagLine: p.riotId?.split("#")?.[1] ?? "???" }}
              summonerLevel={card?.summonerLevel ?? 0}
              profileIconId={card?.profileIconId ?? 0}
              ranked={card?.ranked ?? null}
              currentChampion={card?.currentChampion ?? { id: p.championId, name: champ?.name ?? "Unknown", icon: champ?.image ?? "" }}
              champStats={card?.champStats ?? { recentWindow: "7d", totalRankedGames: 0, gamesWithChamp: null, winrateWithChamp: null, sampleSizeOk: false }}
              mastery={card?.mastery ?? null}
              runes={card?.runes ?? null}
              spells={card?.spells ?? null}
              smurf={card?.smurf ?? { severity: "none" as const, label: "No smurf", probability: 0, reasons: [] }}
              participant={{
                championId: p.championId,
                spell1Id: p.spell1Id,
                spell2Id: p.spell2Id,
                perkKeystone: p.perkKeystone,
                perkPrimaryStyle: p.perkPrimaryStyle,
                perkSubStyle: p.perkSubStyle,
              }}
              ddragon={ddragon}
              loading={loading && !card}
            />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MatchView — vertical: blue on top, red below, counters at bottom
   ══════════════════════════════════════════════════════════ */
export function MatchView({ game, ddragon, platform = "LA2" }: Props) {
  const elapsed = Math.max(0, Math.floor((Date.now() - game.gameStartTime) / 1000 / 60));
  const [cards, setCards] = useState<Map<string, PlayerCardDataFromAPI>>(new Map());
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);

  const allParticipants = [...game.teams.blue, ...game.teams.red];

  useEffect(() => {
    let cancelled = false;
    async function fetchBatch() {
      setLoading(true);
      setWarning(null);
      try {
        /* Filter out participants with no valid puuid (bots, private profiles) */
        const validPlayers = allParticipants
          .filter((p) => p.puuid && p.puuid.length > 0)
          .map((p) => ({
            puuid: p.puuid,
            teamId: p.teamId,
            championId: p.championId,
            perks: p.perks ?? undefined,
          }));

        if (validPlayers.length === 0) {
          if (!cancelled) setLoading(false);
          return;
        }

        const res = await fetch("/api/player-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platform, players: validPlayers }),
        });
        const json = await res.json();
        if (!cancelled && json.ok) {
          const map = new Map<string, PlayerCardDataFromAPI>();
          for (const p of json.data.players) map.set(p.puuid, p);
          setCards(map);
          if (json.data.warning) setWarning(json.data.warning);
        }
      } catch (e) { console.error("[MatchView] batch fetch failed:", e); }
      finally { if (!cancelled) setLoading(false); }
    }
    fetchBatch();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.gameId, platform]);

  const blueCount = countSmurfs(game.teams.blue.map((p) => p.puuid).filter((id): id is string => !!id), cards);
  const redCount = countSmurfs(game.teams.red.map((p) => p.puuid).filter((id): id is string => !!id), cards);
  const totalConfirmed = blueCount.confirmed + redCount.confirmed;
  const totalPossible = blueCount.possible + redCount.possible;

  return (
    <div className="flex justify-center w-full">
      <div className="space-y-6 min-w-[1400px]">
      {/* ── Header ── */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium text-red-400 uppercase tracking-wider">En vivo</span>
        </div>
        <h2 className="text-2xl font-bold text-white">
          Partida {game.gameMode} — ~{elapsed} min
        </h2>
        <p className="text-gray-500 text-sm">Game ID: {game.gameId}</p>
      </div>

      {/* ── Region warning ── */}
      {warning && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm">
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>{warning}</span>
        </div>
      )}

      {/* ── Blue team (top) ── */}
      <TeamSection
        label="Equipo Azul"
        color="blue"
        participants={game.teams.blue}
        ddragon={ddragon}
        cards={cards}
        loading={loading}
      />

      {/* ── Divider ── */}
      <div className="flex items-center gap-3 py-2">
        <div className="flex-1 h-px bg-gradient-to-r from-blue-500/30 to-transparent" />
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">VS</span>
        <div className="flex-1 h-px bg-gradient-to-l from-red-500/30 to-transparent" />
      </div>

      {/* ── Red team (bottom) ── */}
      <TeamSection
        label="Equipo Rojo"
        color="red"
        participants={game.teams.red}
        ddragon={ddragon}
        cards={cards}
        loading={loading}
      />

      {/* ── Smurf counters (bottom) ── */}
      <div className="border-t border-gray-700/50 pt-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 animate-pulse">
              <div className="w-40 h-6 bg-gray-700 rounded" />
            </div>
          ) : totalConfirmed === 0 && totalPossible === 0 ? (
            <div className="flex items-center gap-2 text-base text-gray-500">
              <IconCheckCircle className="w-6 h-6 text-emerald-500" />
              <span>Sin smurfs detectados en esta partida</span>
            </div>
          ) : (
            <>
              {/* Blue counter */}
              <div data-testid="blue-smurf-counter" className="flex items-center gap-4 px-5 py-3 rounded-lg bg-blue-950/30 border border-blue-500/20">
                <span className="text-sm font-bold text-blue-400 uppercase">Azul</span>
                {blueCount.confirmed > 0 && (
                  <span className="flex items-center gap-1.5 text-sm font-bold text-red-400">
                    <IconShield className="w-4 h-4" />
                    Smurfs: {blueCount.confirmed}
                  </span>
                )}
                {blueCount.possible > 0 && (
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-yellow-400">
                    <IconWarning className="w-4 h-4" />
                    Posibles: {blueCount.possible}
                  </span>
                )}
                {blueCount.confirmed === 0 && blueCount.possible === 0 && (
                  <span className="text-sm text-gray-500">Limpios</span>
                )}
              </div>

              {/* Red counter */}
              <div data-testid="red-smurf-counter" className="flex items-center gap-4 px-5 py-3 rounded-lg bg-red-950/30 border border-red-500/20">
                <span className="text-sm font-bold text-red-400 uppercase">Rojo</span>
                {redCount.confirmed > 0 && (
                  <span className="flex items-center gap-1.5 text-sm font-bold text-red-400">
                    <IconShield className="w-4 h-4" />
                    Smurfs: {redCount.confirmed}
                  </span>
                )}
                {redCount.possible > 0 && (
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-yellow-400">
                    <IconWarning className="w-4 h-4" />
                    Posibles: {redCount.possible}
                  </span>
                )}
                {redCount.confirmed === 0 && redCount.possible === 0 && (
                  <span className="text-sm text-gray-500">Limpios</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
