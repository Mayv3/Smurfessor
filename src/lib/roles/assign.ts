/**
 * Role assignment for live-game participants.
 *
 * Spectator-V5 does NOT provide roles, so we infer them from:
 *   1. Summoner spells (Smite = Jungle — near-certain)
 *   2. Champion primary role data
 *
 * Uses a greedy best-fit assignment so each team gets exactly
 * one player per role: TOP, JUNGLE, MID, ADC, SUPPORT.
 */

export type Role = "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT";
export const ROLES: Role[] = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"];

export interface RoledParticipant<T> {
  role: Role;
  data: T;
}

interface AssignablePlayer {
  championId: number;
  spell1Id: number;
  spell2Id: number;
}

/** Summoner spell IDs */
const SMITE = 11;

/**
 * Champion → preferred role(s) mapping.
 * Key = championId. Roles ordered: most likely first.
 * Champions not listed default to heuristic scoring.
 */
const CHAMP_ROLES: Record<number, Role[]> = {
  // ─── TOP ───
  2:   ["TOP"],              // Olaf
  10:  ["TOP", "MID"],       // Kayle
  14:  ["TOP", "MID"],       // Sion
  17:  ["TOP", "SUPPORT"],   // Teemo
  23:  ["TOP"],              // Tryndamere
  24:  ["TOP", "JUNGLE"],    // Jax
  27:  ["TOP"],              // Singed
  31:  ["TOP", "JUNGLE"],    // Cho'Gath
  36:  ["TOP"],              // Dr. Mundo
  39:  ["TOP", "MID"],       // Irelia
  41:  ["TOP", "MID"],       // Gangplank
  54:  ["TOP"],              // Malphite
  58:  ["TOP"],              // Renekton
  68:  ["TOP", "MID"],       // Rumble
  75:  ["TOP"],              // Nasus
  78:  ["TOP", "JUNGLE"],    // Poppy
  80:  ["TOP", "JUNGLE"],    // Pantheon
  83:  ["TOP"],              // Yorick
  85:  ["TOP", "MID"],       // Kennen
  86:  ["TOP"],              // Garen
  92:  ["TOP", "MID"],       // Riven
  98:  ["TOP"],              // Shen
  114: ["TOP"],              // Fiora
  122: ["TOP"],              // Darius
  126: ["TOP", "MID"],       // Jayce
  133: ["TOP", "ADC"],       // Quinn
  150: ["TOP"],              // Gnar
  164: ["TOP"],              // Camille
  166: ["TOP", "MID"],       // Akshan
  223: ["TOP"],              // Tahm Kench
  240: ["TOP"],              // Kled
  266: ["TOP"],              // Aatrox
  420: ["TOP"],              // Illaoi
  516: ["TOP"],              // Ornn
  777: ["TOP", "MID"],       // Yone
  799: ["TOP"],              // Ambessa
  875: ["TOP", "JUNGLE"],    // Sett
  897: ["TOP"],              // K'Sante
  901: ["TOP", "MID"],       // Mel

  // ─── JUNGLE ───
  5:   ["JUNGLE"],           // Xin Zhao
  11:  ["JUNGLE"],           // Master Yi
  20:  ["JUNGLE"],           // Nunu
  28:  ["JUNGLE"],           // Evelynn
  32:  ["JUNGLE"],           // Amumu
  33:  ["JUNGLE"],           // Rammus
  35:  ["JUNGLE", "SUPPORT"],// Shaco
  48:  ["JUNGLE", "TOP"],    // Trundle
  56:  ["JUNGLE"],           // Nocturne
  59:  ["JUNGLE"],           // Jarvan IV
  60:  ["JUNGLE"],           // Elise
  62:  ["JUNGLE", "TOP"],    // Wukong
  64:  ["JUNGLE"],           // Lee Sin
  76:  ["JUNGLE"],           // Nidalee
  77:  ["JUNGLE", "TOP"],    // Udyr
  79:  ["JUNGLE", "TOP"],    // Gragas
  102: ["JUNGLE"],           // Shyvana
  104: ["JUNGLE"],           // Graves
  106: ["JUNGLE", "TOP"],    // Volibear
  113: ["JUNGLE"],           // Sejuani
  120: ["JUNGLE"],           // Hecarim
  121: ["JUNGLE"],           // Kha'Zix
  131: ["JUNGLE", "MID"],    // Diana
  141: ["JUNGLE"],           // Kayn
  154: ["JUNGLE"],           // Zac
  159: ["JUNGLE"],           // Rek'Sai
  163: ["JUNGLE", "MID"],    // Taliyah
  176: ["JUNGLE"],           // Skarner
  200: ["JUNGLE"],           // Bel'Veth
  203: ["JUNGLE"],           // Kindred
  233: ["JUNGLE"],           // Briar
  234: ["JUNGLE"],           // Viego
  254: ["JUNGLE"],           // Vi
  421: ["JUNGLE"],           // Rek'Sai
  427: ["JUNGLE"],           // Ivern
  876: ["JUNGLE"],           // Lillia
  887: ["JUNGLE", "TOP"],    // Gwen

  // ─── MID ───
  1:   ["MID", "SUPPORT"],   // Annie
  3:   ["MID", "SUPPORT"],   // Galio
  4:   ["MID"],              // Twisted Fate
  7:   ["MID"],              // LeBlanc
  8:   ["MID", "TOP"],       // Vladimir
  9:   ["MID", "JUNGLE"],    // Fiddlesticks
  13:  ["MID", "TOP"],       // Ryze
  30:  ["MID", "JUNGLE"],    // Karthus
  34:  ["MID"],              // Anivia
  38:  ["MID"],              // Kassadin
  42:  ["MID"],              // Corki
  45:  ["MID"],              // Veigar
  50:  ["MID", "TOP"],       // Swain
  55:  ["MID", "TOP"],       // Katarina
  61:  ["MID"],              // Orianna
  69:  ["MID", "TOP"],       // Cassiopeia
  74:  ["MID", "TOP"],       // Heimerdinger
  84:  ["MID", "TOP"],       // Akali
  91:  ["MID", "JUNGLE"],    // Talon
  103: ["MID"],              // Ahri
  105: ["MID"],              // Fizz
  115: ["MID", "ADC"],       // Ziggs
  127: ["MID"],              // Lissandra
  134: ["MID"],              // Syndra
  136: ["MID"],              // Aurelion Sol
  142: ["MID"],              // Zoe
  157: ["MID", "TOP"],       // Yasuo
  238: ["MID"],              // Zed
  245: ["MID", "JUNGLE"],    // Ekko
  246: ["MID", "JUNGLE"],    // Qiyana
  268: ["MID"],              // Azir
  517: ["MID", "TOP"],       // Sylas
  518: ["MID", "SUPPORT"],   // Neeko
  711: ["MID"],              // Vex
  800: ["MID", "ADC"],       // Smolder
  902: ["MID", "TOP"],       // Aurora
  910: ["MID", "SUPPORT"],   // Hwei
  950: ["MID"],              // Naafiri

  // ─── ADC (BOT CARRY) ───
  15:  ["ADC"],              // Sivir
  18:  ["ADC", "MID"],       // Tristana
  21:  ["ADC"],              // Miss Fortune
  22:  ["ADC"],              // Ashe
  29:  ["ADC"],              // Twitch
  51:  ["ADC"],              // Caitlyn
  67:  ["ADC"],              // Vayne
  96:  ["ADC"],              // Kog'Maw
  110: ["ADC"],              // Varus
  119: ["ADC"],              // Draven
  145: ["ADC"],              // Kai'Sa
  147: ["ADC", "SUPPORT"],   // Seraphine
  202: ["ADC"],              // Jhin
  221: ["ADC"],              // Zeri
  222: ["ADC"],              // Jinx
  235: ["ADC", "SUPPORT"],   // Senna
  236: ["ADC", "MID"],       // Lucian
  360: ["ADC"],              // Samira
  429: ["ADC"],              // Kalista
  498: ["ADC"],              // Xayah
  523: ["ADC"],              // Aphelios
  895: ["ADC"],              // Nilah

  // ─── SUPPORT ───
  12:  ["SUPPORT"],          // Alistar
  16:  ["SUPPORT"],          // Soraka
  25:  ["SUPPORT", "MID"],   // Morgana
  26:  ["SUPPORT", "MID"],   // Zilean
  37:  ["SUPPORT"],          // Sona
  40:  ["SUPPORT"],          // Janna
  43:  ["SUPPORT", "MID"],   // Karma
  44:  ["SUPPORT"],          // Taric
  53:  ["SUPPORT"],          // Blitzcrank
  57:  ["SUPPORT", "TOP"],   // Maokai
  63:  ["SUPPORT", "MID"],   // Brand
  89:  ["SUPPORT"],          // Leona
  90:  ["SUPPORT", "MID"],   // Malzahar
  99:  ["SUPPORT", "MID"],   // Lux
  101: ["SUPPORT", "MID"],   // Xerath
  111: ["SUPPORT"],          // Nautilus
  117: ["SUPPORT", "MID"],   // Lulu
  143: ["SUPPORT"],          // Zyra
  161: ["SUPPORT", "MID"],   // Vel'Koz
  201: ["SUPPORT"],          // Braum
  267: ["SUPPORT"],          // Nami
  350: ["SUPPORT"],          // Yuumi
  412: ["SUPPORT"],          // Thresh
  432: ["SUPPORT"],          // Bard
  497: ["SUPPORT"],          // Rakan
  526: ["SUPPORT"],          // Rell
  555: ["SUPPORT", "MID"],   // Pyke
  685: ["SUPPORT"],          // Renata Glasc
  888: ["SUPPORT"],          // Renata Glasc (alias)
};

/**
 * Score how well a champion + spells fits a given role.
 * Higher = better fit. Returns 0..100.
 */
function roleScore(player: AssignablePlayer, role: Role): number {
  const hasSmite = player.spell1Id === SMITE || player.spell2Id === SMITE;

  // Smite is near-certain jungle indicator
  if (role === "JUNGLE" && hasSmite) return 100;
  if (role !== "JUNGLE" && hasSmite) return 0;

  const champRoles = CHAMP_ROLES[player.championId];

  if (champRoles) {
    const idx = champRoles.indexOf(role);
    if (idx === 0) return 90;
    if (idx === 1) return 60;
    if (idx >= 2) return 30;
    return 5;
  }

  // Unknown champion — all roles equally possible (except jungle needs smite)
  if (role === "JUNGLE") return 2;
  return 20;
}

/**
 * Assign roles to a team of 5 using greedy best-match.
 * Returns participants in role order: TOP, JG, MID, ADC, SUP.
 */
export function assignRoles<T extends AssignablePlayer>(
  team: T[],
): RoledParticipant<T>[] {
  if (team.length !== 5) {
    return team.map((p, i) => ({ role: ROLES[i] ?? "MID", data: p }));
  }

  const scores: number[][] = team.map((p) =>
    ROLES.map((role) => roleScore(p, role)),
  );

  const assigned: RoledParticipant<T>[] = new Array(5);
  const usedPlayers = new Set<number>();
  const usedRoles = new Set<number>();

  const candidates: { score: number; pi: number; ri: number }[] = [];
  for (let pi = 0; pi < 5; pi++) {
    for (let ri = 0; ri < 5; ri++) {
      candidates.push({ score: scores[pi][ri], pi, ri });
    }
  }
  candidates.sort((a, b) => b.score - a.score);

  for (const { pi, ri } of candidates) {
    if (usedPlayers.has(pi) || usedRoles.has(ri)) continue;
    assigned[ri] = { role: ROLES[ri], data: team[pi] };
    usedPlayers.add(pi);
    usedRoles.add(ri);
    if (usedPlayers.size === 5) break;
  }

  for (let ri = 0; ri < 5; ri++) {
    if (!assigned[ri]) {
      for (let pi = 0; pi < 5; pi++) {
        if (!usedPlayers.has(pi)) {
          assigned[ri] = { role: ROLES[ri], data: team[pi] };
          usedPlayers.add(pi);
          break;
        }
      }
    }
  }

  return assigned;
}
