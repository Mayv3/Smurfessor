import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { useState, useEffect } from 'react';

function IconShield({ className = "w-4 h-4" }) {
  return /* @__PURE__ */ jsx("svg", { className, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" }) });
}
function IconWarning({ className = "w-4 h-4" }) {
  return /* @__PURE__ */ jsx("svg", { className, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" }) });
}
function IconCheckCircle({ className = "w-4 h-4" }) {
  return /* @__PURE__ */ jsx("svg", { className, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" }) });
}
function IconPerson({ className = "w-4 h-4" }) {
  return /* @__PURE__ */ jsx("svg", { className, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" }) });
}
function IconRefresh({ className = "w-4 h-4" }) {
  return /* @__PURE__ */ jsx("svg", { className, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" }) });
}
function IconRubble({ className = "w-4 h-4" }) {
  return /* @__PURE__ */ jsx("svg", { className, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M14 2H6L2 8l4 2-4 6h5l1 6 4-8h4l-2-6 4-4-4-2z" }) });
}
function IconFire({ className = "w-4 h-4" }) {
  return /* @__PURE__ */ jsx("svg", { className, viewBox: "0 0 24 24", fill: "currentColor", children: /* @__PURE__ */ jsx("path", { d: "M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" }) });
}

function SmurfBadge({ severity, label, probability, reasons }) {
  if (severity === "none") return null;
  const isConfirmed = severity === "confirmed";
  const badgeClass = isConfirmed ? "bg-red-600 text-white border-red-400" : "bg-yellow-600/90 text-white border-yellow-400";
  const icon = isConfirmed ? /* @__PURE__ */ jsx(IconShield, { className: "w-2.5 h-2.5" }) : /* @__PURE__ */ jsx(IconWarning, { className: "w-2.5 h-2.5" });
  return /* @__PURE__ */ jsxs("div", { className: "relative group inline-flex", children: [
    /* @__PURE__ */ jsxs(
      "span",
      {
        className: `inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${badgeClass} cursor-help leading-tight`,
        children: [
          icon,
          isConfirmed ? label : `${label} (${probability}%)`
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-full mt-1 z-50 hidden group-hover:block min-w-[240px]", children: /* @__PURE__ */ jsxs("div", { className: "bg-gray-900 border border-gray-600 rounded-lg shadow-xl p-3 text-sm text-gray-300 space-y-1.5", children: [
      /* @__PURE__ */ jsxs("div", { className: "font-bold text-white mb-1.5 flex items-center gap-1.5", children: [
        icon,
        isConfirmed ? "Smurf detectado" : "Posible smurf"
      ] }),
      reasons.map((r, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-gray-500 shrink-0 mt-0.5", children: "•" }),
        /* @__PURE__ */ jsx("span", { children: r })
      ] }, i))
    ] }) })
  ] });
}

const DD = "https://ddragon.leagueoflegends.com";
function champIcon(ver, img) {
  return `${DD}/cdn/${ver}/img/champion/${img}`;
}
function spellIcon(ver, img) {
  return `${DD}/cdn/${ver}/img/spell/${img}`;
}
function runeIcon(iconPath) {
  return `${DD}/cdn/img/${iconPath}`;
}
function rankEmblem(tier) {
  return `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests/${tier.toLowerCase()}.png`;
}
const TIER_COLOR = {
  IRON: "text-gray-400",
  BRONZE: "text-amber-600",
  SILVER: "text-gray-300",
  GOLD: "text-yellow-400",
  PLATINUM: "text-teal-300",
  EMERALD: "text-emerald-400",
  DIAMOND: "text-blue-300",
  MASTER: "text-purple-400",
  GRANDMASTER: "text-red-400",
  CHALLENGER: "text-amber-300"
};
function wrColor(wr) {
  if (wr >= 60) return "text-red-400";
  if (wr >= 55) return "text-yellow-400";
  if (wr >= 50) return "text-emerald-400";
  return "text-gray-400";
}
function smurfCardClass(smurf) {
  if (!smurf) return "border-gray-700/60";
  if (smurf.severity === "confirmed") return "border-red-500/60 ring-1 ring-red-500/20 bg-red-950/20";
  if (smurf.severity === "possible") return "border-yellow-500/40 ring-1 ring-yellow-500/15 bg-yellow-950/10";
  return "border-gray-700/60";
}
function isEloQuemado(queue) {
  if (!queue) return false;
  return queue.wins + queue.losses > 300;
}
function isEscombro(queue) {
  if (!queue) return false;
  const total = queue.wins + queue.losses;
  if (total < 10) return false;
  return Math.round(queue.wins / total * 100) < 46;
}
function PlayerCard({
  participant,
  ddragon,
  smurfData,
  summary,
  batchLoading
}) {
  const champ = ddragon.champions[String(participant.championId)];
  const s1 = ddragon.spells[String(participant.spell1Id)];
  const s2 = ddragon.spells[String(participant.spell2Id)];
  const keystoneRune = participant.perkKeystone != null ? ddragon.runeData?.[String(participant.perkKeystone)] : void 0;
  const subRune = participant.perkSubStyle != null ? ddragon.runes?.[String(participant.perkSubStyle)] : void 0;
  const queue = summary?.soloQueue ?? summary?.flexQueue ?? null;
  const total = queue ? queue.wins + queue.losses : 0;
  const wr = total > 0 ? Math.round(queue.wins / total * 100) : null;
  const level = summary?.summonerLevel ?? null;
  const champWR = summary?.championWinrate !== void 0 && summary?.championWinrate !== null ? Math.round(summary.championWinrate * 100) : null;
  const champGames = summary?.championSampleSize ?? 0;
  const eloQuemado = !batchLoading && isEloQuemado(queue);
  const escombro = !batchLoading && isEscombro(queue);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `relative rounded-xl border backdrop-blur-sm bg-gray-800/80 p-5 flex flex-col gap-4 w-full min-h-[280px] transition-all ${smurfCardClass(smurfData)}`,
      "data-smurf-severity": smurfData?.severity ?? "none",
      children: [
        level !== null && !batchLoading && /* @__PURE__ */ jsxs("div", { className: "absolute top-2 left-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-900/80 border border-gray-600/60 backdrop-blur-sm z-10", children: [
          /* @__PURE__ */ jsx(IconPerson, { className: "w-3 h-3 text-gray-400" }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold text-gray-300", children: level })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "absolute top-2 right-2 flex flex-col items-end gap-1 z-10", children: [
          smurfData && smurfData.severity !== "none" && !batchLoading && /* @__PURE__ */ jsx(
            SmurfBadge,
            {
              severity: smurfData.severity,
              label: smurfData.label,
              probability: smurfData.probability,
              reasons: smurfData.reasons
            }
          ),
          eloQuemado && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border bg-orange-600/90 text-white border-orange-400 leading-tight", title: `${total} rankeds jugadas`, children: [
            /* @__PURE__ */ jsx(IconFire, { className: "w-2.5 h-2.5" }),
            "ELO QUEMADO"
          ] }),
          escombro && /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border bg-stone-600/90 text-white border-stone-400 leading-tight", title: `${wr}% WR en ranked`, children: [
            /* @__PURE__ */ jsx(IconRubble, { className: "w-2.5 h-2.5" }),
            "ESCOMBRO"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mt-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative shrink-0", children: [
            champ ? /* @__PURE__ */ jsx(
              "img",
              {
                src: champIcon(ddragon.version, champ.image),
                alt: champ.name,
                className: "w-16 h-16 rounded-xl ring-2 ring-gray-600",
                loading: "lazy"
              }
            ) : /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-xl bg-gray-700 flex items-center justify-center text-gray-500 text-sm", children: "?" }),
            /* @__PURE__ */ jsxs("div", { className: "absolute -bottom-1 -right-1 flex gap-px", children: [
              s1 && /* @__PURE__ */ jsx("img", { src: spellIcon(ddragon.version, s1.image), alt: s1.name, className: "w-5 h-5 rounded-sm ring-1 ring-gray-900", loading: "lazy" }),
              s2 && /* @__PURE__ */ jsx("img", { src: spellIcon(ddragon.version, s2.image), alt: s2.name, className: "w-5 h-5 rounded-sm ring-1 ring-gray-900", loading: "lazy" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5 shrink-0", children: [
            keystoneRune ? /* @__PURE__ */ jsx(
              "img",
              {
                src: runeIcon(keystoneRune.icon),
                alt: keystoneRune.name,
                title: keystoneRune.name,
                className: "w-7 h-7 rounded-full bg-gray-900/60 p-0.5",
                loading: "lazy"
              }
            ) : /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-full bg-gray-700/40" }),
            subRune ? /* @__PURE__ */ jsx(
              "img",
              {
                src: runeIcon(subRune.icon),
                alt: subRune.name,
                title: subRune.name,
                className: "w-5 h-5 rounded-full bg-gray-900/60 p-0.5 self-center opacity-70",
                loading: "lazy"
              }
            ) : /* @__PURE__ */ jsx("div", { className: "w-5 h-5 rounded-full bg-gray-700/30 self-center" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            (() => {
              const rid = participant.riotId || "Unknown";
              const hashIdx = rid.lastIndexOf("#");
              const name = hashIdx > 0 ? rid.slice(0, hashIdx) : rid;
              const tag = hashIdx > 0 ? rid.slice(hashIdx) : "";
              return /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("span", { className: "font-bold text-white text-sm leading-snug block break-words", children: name }),
                tag && /* @__PURE__ */ jsx("span", { className: "text-[11px] text-gray-500 block mt-0.5", children: tag })
              ] });
            })(),
            batchLoading && /* @__PURE__ */ jsx("span", { className: "w-16 h-4 bg-gray-700 rounded animate-pulse inline-block mt-1" })
          ] })
        ] }),
        batchLoading ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 animate-pulse", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-gray-700 rounded" }),
          /* @__PURE__ */ jsx("div", { className: "h-5 w-20 bg-gray-700 rounded" }),
          /* @__PURE__ */ jsx("div", { className: "h-8 w-14 bg-gray-700 rounded ml-auto" })
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            queue ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx(
                "img",
                {
                  src: rankEmblem(queue.tier),
                  alt: queue.tier,
                  className: "w-12 h-12 object-contain shrink-0",
                  loading: "lazy"
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxs("div", { className: `text-sm font-bold leading-tight ${TIER_COLOR[queue.tier] ?? "text-gray-400"}`, children: [
                  queue.tier,
                  " ",
                  queue.rank
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-400 mt-0.5", children: [
                  queue.leaguePoints,
                  " LP"
                ] })
              ] })
            ] }) : /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-1 text-gray-600 text-sm", children: [
              /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded bg-gray-700/50 flex items-center justify-center", children: /* @__PURE__ */ jsx("span", { className: "text-gray-600 text-sm", children: "—" }) }),
              /* @__PURE__ */ jsx("span", { children: "Unranked" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "text-right shrink-0", children: wr !== null ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs("div", { className: `text-2xl font-extrabold leading-none ${wrColor(wr)}`, children: [
                wr,
                "%"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-[10px] text-gray-500 uppercase tracking-wider mt-0.5", children: "Ranked" })
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("div", { className: "text-2xl font-extrabold leading-none text-gray-600", children: "—" }),
              /* @__PURE__ */ jsx("div", { className: "text-[10px] text-gray-500 uppercase tracking-wider mt-0.5", children: "Ranked" })
            ] }) })
          ] }),
          champWR !== null && champGames >= 3 && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-950/30 border border-blue-500/15", children: [
            champ && /* @__PURE__ */ jsx(
              "img",
              {
                src: champIcon(ddragon.version, champ.image),
                alt: champ.name,
                className: "w-5 h-5 rounded",
                loading: "lazy"
              }
            ),
            /* @__PURE__ */ jsxs("span", { className: `text-sm font-bold ${wrColor(champWR)}`, children: [
              champWR,
              "%"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-gray-500", children: [
              champGames,
              " partidas"
            ] })
          ] })
        ] }),
        queue && !batchLoading && /* @__PURE__ */ jsxs("div", { className: "text-xs text-gray-500 flex items-center gap-2.5 border-t border-gray-700/40 pt-2.5 mt-auto", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-emerald-400 font-semibold", children: [
            queue.wins,
            "W"
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-gray-600", children: "/" }),
          /* @__PURE__ */ jsxs("span", { className: "text-red-400 font-semibold", children: [
            queue.losses,
            "L"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-gray-500 ml-auto", children: [
            total,
            " jugadas"
          ] })
        ] })
      ]
    }
  );
}

function countSmurfs(puuids, map) {
  let confirmed = 0, possible = 0;
  for (const id of puuids) {
    const s = map.get(id);
    if (!s) continue;
    if (s.smurf.severity === "confirmed") confirmed++;
    else if (s.smurf.severity === "possible") possible++;
  }
  return { confirmed, possible };
}
function TeamSection({
  label,
  color,
  participants,
  ddragon,
  summaries,
  loading
}) {
  const accentBorder = color === "blue" ? "border-blue-500" : "border-red-500";
  const accentText = color === "blue" ? "text-blue-400" : "text-red-400";
  const accentBg = color === "blue" ? "bg-blue-500" : "bg-red-500";
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
      /* @__PURE__ */ jsx("span", { className: `w-3 h-3 rounded-full ${accentBg}` }),
      /* @__PURE__ */ jsx("h3", { className: `text-base font-bold uppercase tracking-wider ${accentText}`, children: label }),
      /* @__PURE__ */ jsx("div", { className: `flex-1 h-px ${accentBorder} opacity-30` })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-5 gap-3", children: participants.map((p) => {
      const data = summaries.get(p.puuid);
      const summary = data ? {
        summonerLevel: data.summonerLevel,
        profileIconId: data.profileIconId,
        soloQueue: data.soloQueue,
        flexQueue: data.flexQueue,
        championWinrate: data.championWinrate ?? null,
        championSampleSize: data.championSampleSize ?? 0
      } : void 0;
      return /* @__PURE__ */ jsx(
        PlayerCard,
        {
          participant: p,
          ddragon,
          smurfData: data?.smurf,
          summary,
          batchLoading: loading
        },
        p.puuid
      );
    }) })
  ] });
}
function MatchView({ game, ddragon, platform = "LA2" }) {
  const elapsed = Math.max(0, Math.floor((Date.now() - game.gameStartTime) / 1e3 / 60));
  const [summaries, setSummaries] = useState(/* @__PURE__ */ new Map());
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState(null);
  const allParticipants = [...game.teams.blue, ...game.teams.red];
  useEffect(() => {
    let cancelled = false;
    async function fetchBatch() {
      setLoading(true);
      setWarning(null);
      try {
        const res = await fetch("/api/player-summaries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform,
            players: allParticipants.map((p) => ({
              puuid: p.puuid,
              teamId: p.teamId,
              championId: p.championId
            }))
          })
        });
        const json = await res.json();
        if (!cancelled && json.ok) {
          const map = /* @__PURE__ */ new Map();
          for (const p of json.data.players) map.set(p.puuid, p);
          setSummaries(map);
          if (json.data.warning) setWarning(json.data.warning);
        }
      } catch (e) {
        console.error("[MatchView] batch fetch failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchBatch();
    return () => {
      cancelled = true;
    };
  }, [game.gameId, platform]);
  const blueCount = countSmurfs(game.teams.blue.map((p) => p.puuid), summaries);
  const redCount = countSmurfs(game.teams.red.map((p) => p.puuid), summaries);
  const totalConfirmed = blueCount.confirmed + redCount.confirmed;
  const totalPossible = blueCount.possible + redCount.possible;
  return /* @__PURE__ */ jsx("div", { className: "flex justify-center w-full", children: /* @__PURE__ */ jsxs("div", { className: "space-y-6 min-w-[1400px]", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center space-y-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 mb-2", children: [
        /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-red-400 uppercase tracking-wider", children: "En vivo" })
      ] }),
      /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-bold text-white", children: [
        "Partida ",
        game.gameMode,
        " — ~",
        elapsed,
        " min"
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-gray-500 text-sm", children: [
        "Game ID: ",
        game.gameId
      ] })
    ] }),
    warning && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-4 py-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm", children: [
      /* @__PURE__ */ jsxs("svg", { className: "w-5 h-5 shrink-0", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
        /* @__PURE__ */ jsx("path", { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" }),
        /* @__PURE__ */ jsx("line", { x1: "12", y1: "9", x2: "12", y2: "13" }),
        /* @__PURE__ */ jsx("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
      ] }),
      /* @__PURE__ */ jsx("span", { children: warning })
    ] }),
    /* @__PURE__ */ jsx(
      TeamSection,
      {
        label: "Equipo Azul",
        color: "blue",
        participants: game.teams.blue,
        ddragon,
        summaries,
        loading
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 py-2", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-1 h-px bg-gradient-to-r from-blue-500/30 to-transparent" }),
      /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-gray-500 uppercase tracking-widest", children: "VS" }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 h-px bg-gradient-to-l from-red-500/30 to-transparent" })
    ] }),
    /* @__PURE__ */ jsx(
      TeamSection,
      {
        label: "Equipo Rojo",
        color: "red",
        participants: game.teams.red,
        ddragon,
        summaries,
        loading
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "border-t border-gray-700/50 pt-6", children: /* @__PURE__ */ jsx("div", { className: "flex flex-col sm:flex-row items-center justify-center gap-4", children: loading ? /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 text-sm text-gray-500 animate-pulse", children: /* @__PURE__ */ jsx("div", { className: "w-40 h-6 bg-gray-700 rounded" }) }) : totalConfirmed === 0 && totalPossible === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-base text-gray-500", children: [
      /* @__PURE__ */ jsx(IconCheckCircle, { className: "w-6 h-6 text-emerald-500" }),
      /* @__PURE__ */ jsx("span", { children: "Sin smurfs detectados en esta partida" })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { "data-testid": "blue-smurf-counter", className: "flex items-center gap-4 px-5 py-3 rounded-lg bg-blue-950/30 border border-blue-500/20", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-blue-400 uppercase", children: "Azul" }),
        blueCount.confirmed > 0 && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-sm font-bold text-red-400", children: [
          /* @__PURE__ */ jsx(IconShield, { className: "w-4 h-4" }),
          "Smurfs: ",
          blueCount.confirmed
        ] }),
        blueCount.possible > 0 && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-sm font-semibold text-yellow-400", children: [
          /* @__PURE__ */ jsx(IconWarning, { className: "w-4 h-4" }),
          "Posibles: ",
          blueCount.possible
        ] }),
        blueCount.confirmed === 0 && blueCount.possible === 0 && /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-500", children: "Limpios" })
      ] }),
      /* @__PURE__ */ jsxs("div", { "data-testid": "red-smurf-counter", className: "flex items-center gap-4 px-5 py-3 rounded-lg bg-red-950/30 border border-red-500/20", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-red-400 uppercase", children: "Rojo" }),
        redCount.confirmed > 0 && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-sm font-bold text-red-400", children: [
          /* @__PURE__ */ jsx(IconShield, { className: "w-4 h-4" }),
          "Smurfs: ",
          redCount.confirmed
        ] }),
        redCount.possible > 0 && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 text-sm font-semibold text-yellow-400", children: [
          /* @__PURE__ */ jsx(IconWarning, { className: "w-4 h-4" }),
          "Posibles: ",
          redCount.possible
        ] }),
        redCount.confirmed === 0 && redCount.possible === 0 && /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-500", children: "Limpios" })
      ] })
    ] }) }) })
  ] }) });
}

const REASON_MESSAGES = {
  NOT_IN_GAME: "Este jugador no está en una partida actualmente.",
  KEY_INVALID: "La API key de Riot es inválida o expiró. Contacta al administrador.",
  SPECTATOR_UNAVAILABLE: "El servicio de espectador no está disponible temporalmente.",
  SPECTATOR_DISABLED: "La función de espectador está deshabilitada.",
  RATE_LIMITED: "Demasiadas solicitudes a la API de Riot. Intentá de nuevo en unos segundos."
};
function OfflineView({ account, reason }) {
  const message = REASON_MESSAGES[reason] ?? `No se puede obtener la partida: ${reason}`;
  const isError = reason === "KEY_INVALID" || reason === "RATE_LIMITED";
  return /* @__PURE__ */ jsxs("div", { className: "max-w-lg mx-auto text-center py-16", children: [
    /* @__PURE__ */ jsx("div", { className: "text-7xl mb-6", children: isError ? "⚠️" : "😴" }),
    /* @__PURE__ */ jsxs("h2", { className: "text-2xl font-bold text-white mb-2", children: [
      account?.riotId?.gameName ?? "Jugador",
      " no está en partida"
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-gray-400 mb-8 leading-relaxed", children: message }),
    /* @__PURE__ */ jsx(
      "a",
      {
        href: "/",
        className: "inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors",
        children: "← Volver al dashboard"
      }
    )
  ] });
}

function SkeletonLoader() {
  return /* @__PURE__ */ jsxs("div", { className: "animate-pulse space-y-6 py-4", children: [
    /* @__PURE__ */ jsx("div", { className: "h-8 bg-gray-700 rounded w-1/3 mx-auto" }),
    /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-700/60 rounded w-1/5 mx-auto" }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6", children: [0, 1].map((col) => /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsx("div", { className: "h-6 bg-gray-700 rounded w-1/4 mx-auto" }),
      [...Array(5)].map((_, i) => /* @__PURE__ */ jsx("div", { className: "h-20 bg-gray-800 rounded-lg border border-gray-700" }, i))
    ] }, col)) })
  ] });
}

const colors = {
  error: "bg-red-900/50 border-red-500/50 text-red-300",
  warning: "bg-yellow-900/50 border-yellow-500/50 text-yellow-300",
  info: "bg-blue-900/50 border-blue-500/50 text-blue-300"
};
function ErrorBanner({ message, type = "error" }) {
  return /* @__PURE__ */ jsx("div", { className: `border rounded-lg p-4 ${colors[type]}`, children: /* @__PURE__ */ jsx("p", { className: "font-medium text-sm", children: message }) });
}

export { ErrorBanner as E, IconRefresh as I, MatchView as M, OfflineView as O, SkeletonLoader as S };
