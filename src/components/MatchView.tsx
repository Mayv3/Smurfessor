import { useEffect, useState } from "react";
import { PlayerCard } from "./PlayerCard";
import { IconShield, IconWarning, IconCheckCircle } from "./ui/Icons";
import type { SmurfAssessment } from "../lib/smurf/rules";
import type { NormalizedRunes } from "../lib/ddragon/runes";

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
    recentWindow: number;
    gamesWithChamp: number | null;
    winrateWithChamp: number | null;
    sampleSizeOk: boolean;
    note?: string;
  };
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

      {/* 5 cards in a responsive grid */}
      <div className="grid grid-cols-5 gap-3">
        {participants.map((p) => {
          const card = cards.get(p.puuid);
          const champ = ddragon.champions[String(p.championId)];
          return (
            <PlayerCard
              key={p.puuid}
              puuid={p.puuid}
              teamId={p.teamId}
              riotId={card?.riotId ?? { gameName: p.riotId?.split("#")?.[0] ?? "Unknown", tagLine: p.riotId?.split("#")?.[1] ?? "???" }}
              summonerLevel={card?.summonerLevel ?? 0}
              profileIconId={card?.profileIconId ?? 0}
              ranked={card?.ranked ?? null}
              currentChampion={card?.currentChampion ?? { id: p.championId, name: champ?.name ?? "Unknown", icon: champ?.image ?? "" }}
              champStats={card?.champStats ?? { recentWindow: 20, gamesWithChamp: null, winrateWithChamp: null, sampleSizeOk: false }}
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
        const res = await fetch("/api/player-cards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform,
            players: allParticipants.map((p) => ({
              puuid: p.puuid,
              teamId: p.teamId,
              championId: p.championId,
              perks: p.perks ?? undefined,
            })),
          }),
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

  const blueCount = countSmurfs(game.teams.blue.map((p) => p.puuid), cards);
  const redCount = countSmurfs(game.teams.red.map((p) => p.puuid), cards);
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
