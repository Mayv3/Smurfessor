/**
 * Mock data for TWO test accounts:
 *   - "test"       → basic 10-player game (old behavior, no smurf data)
 *   - "smurf-test" → 10 players with stats that trigger all smurf rules
 *
 * Distribution for smurf-test (mandatory for e2e assertions):
 *   Blue (100): 2 confirmed + 1 possible + 2 none
 *   Red  (200): 1 confirmed + 2 possible + 2 none
 */

import { computeSmurfAssessment } from "../lib/smurf/rules";
import type { SmurfAssessment } from "../lib/smurf/rules";

/* ══════════════════════════════════════════════════════════
   Shared helpers
   ══════════════════════════════════════════════════════════ */

interface RankedEntry {
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
}

function rEntry(
  queue: "RANKED_SOLO_5x5" | "RANKED_FLEX_SR",
  tier: string,
  rank: string,
  lp: number,
  w: number,
  l: number,
): RankedEntry {
  return { queueType: queue, tier, rank, leaguePoints: lp, wins: w, losses: l, hotStreak: false, veteran: false, freshBlood: false, inactive: false };
}

export interface MockSummary {
  puuid: string;
  riotId: string;
  profileIconId: number;
  summonerLevel: number;
  soloQueue: RankedEntry | null;
  flexQueue: RankedEntry | null;
  topMasteries: { championId: number; championLevel: number; championPoints: number }[];
}

function buildTeamParticipants(
  players: readonly { name: string; champId: number; spells: readonly [number, number]; team: number; perks?: readonly [number, number, number]; fullPerks?: { perkIds: number[]; perkStyle: number; perkSubStyle: number } }[],
  prefix: string,
) {
  const blue = players.filter((p) => p.team === 100);
  const red = players.filter((p) => p.team === 200);
  return {
    blue: blue.map((p, i) => ({
      puuid: `${prefix}-BLUE-${i}`,
      riotId: p.name,
      championId: p.champId,
      spell1Id: p.spells[0],
      spell2Id: p.spells[1],
      teamId: p.team,
      perkKeystone: p.fullPerks?.perkIds?.[0] ?? p.perks?.[0] ?? 8112,
      perkPrimaryStyle: p.fullPerks?.perkStyle ?? p.perks?.[1] ?? 8100,
      perkSubStyle: p.fullPerks?.perkSubStyle ?? p.perks?.[2] ?? 8300,
      perks: p.fullPerks ?? {
        perkIds: [p.perks?.[0] ?? 8112, 8139, 8138, 8135, 8233, 8237],
        perkStyle: p.perks?.[1] ?? 8100,
        perkSubStyle: p.perks?.[2] ?? 8300,
      },
    })),
    red: red.map((p, i) => ({
      puuid: `${prefix}-RED-${i}`,
      riotId: p.name,
      championId: p.champId,
      spell1Id: p.spells[0],
      spell2Id: p.spells[1],
      teamId: p.team,
      perkKeystone: p.fullPerks?.perkIds?.[0] ?? p.perks?.[0] ?? 8112,
      perkPrimaryStyle: p.fullPerks?.perkStyle ?? p.perks?.[1] ?? 8100,
      perkSubStyle: p.fullPerks?.perkSubStyle ?? p.perks?.[2] ?? 8300,
      perks: p.fullPerks ?? {
        perkIds: [p.perks?.[0] ?? 8112, 8139, 8138, 8135, 8233, 8237],
        perkStyle: p.perks?.[1] ?? 8100,
        perkSubStyle: p.perks?.[2] ?? 8300,
      },
    })),
  };
}

/* ══════════════════════════════════════════════════════════
   LEGACY "test" account (unchanged behavior)
   ══════════════════════════════════════════════════════════ */

export const TEST_PUUID = "TEST-PUUID-0000-0000-000000000000";

const legacyPlayers = [
  { name: "xXMidGodXx#TEST",      champId: 238,  spells: [4, 14] as const,  team: 100, fullPerks: { perkIds: [8112, 8139, 8138, 8135, 8009, 8299], perkStyle: 8100, perkSubStyle: 8000 } },
  { name: "JungleDiff99#TEST",     champId: 64,   spells: [4, 11] as const,  team: 100, fullPerks: { perkIds: [8010, 9111, 9104, 8299, 8139, 8135], perkStyle: 8000, perkSubStyle: 8100 } },
  { name: "ADCarryMe#TEST",        champId: 51,   spells: [4, 7] as const,   team: 100, fullPerks: { perkIds: [8005, 9111, 9104, 8299, 8233, 8237], perkStyle: 8000, perkSubStyle: 8200 } },
  { name: "HookCityBaby#TEST",     champId: 412,  spells: [4, 14] as const,  team: 100, fullPerks: { perkIds: [8439, 8446, 8429, 8451, 8345, 8347], perkStyle: 8400, perkSubStyle: 8300 } },
  { name: "TopDiffGG#TEST",        champId: 86,   spells: [4, 12] as const,  team: 100, fullPerks: { perkIds: [8437, 8446, 8429, 8451, 9111, 9104], perkStyle: 8400, perkSubStyle: 8000 } },
  { name: "DarkMage666#TEST",      champId: 45,   spells: [4, 14] as const,  team: 200, fullPerks: { perkIds: [8214, 8226, 8210, 8237, 8139, 8135], perkStyle: 8200, perkSubStyle: 8100 } },
  { name: "GankMachine#TEST",      champId: 254,  spells: [4, 11] as const,  team: 200, fullPerks: { perkIds: [8010, 9111, 9104, 8299, 8446, 8451], perkStyle: 8000, perkSubStyle: 8400 } },
  { name: "PewPewBot#TEST",        champId: 222,  spells: [4, 7] as const,   team: 200, fullPerks: { perkIds: [9923, 8139, 8138, 8135, 8233, 8237], perkStyle: 8100, perkSubStyle: 8200 } },
  { name: "WardBot9000#TEST",      champId: 117,  spells: [4, 3] as const,   team: 200, fullPerks: { perkIds: [8351, 8313, 8345, 8347, 8233, 8237], perkStyle: 8300, perkSubStyle: 8200 } },
  { name: "SplitPusher#TEST",      champId: 24,   spells: [4, 12] as const,  team: 200, fullPerks: { perkIds: [8010, 9111, 9104, 8299, 8446, 8451], perkStyle: 8000, perkSubStyle: 8400 } },
];

export const MOCK_RESOLVE = {
  account: {
    key: "test",
    riotId: { gameName: "Test Account", tagLine: "0000" },
    platform: "LA2" as const,
    label: "🧪 Test",
  },
  puuid: TEST_PUUID,
};

export const MOCK_LIVE_GAME = {
  available: true as const,
  gameId: 9999999,
  gameMode: "CLASSIC",
  gameStartTime: Date.now() - 14 * 60 * 1000,
  teams: buildTeamParticipants(legacyPlayers, "TEST-PUUID"),
};

const legacySummaries: MockSummary[] = [
  { puuid: "TEST-PUUID-BLUE-0", riotId: "xXMidGodXx#TEST",  profileIconId: 4834, summonerLevel: 247, soloQueue: rEntry("RANKED_SOLO_5x5","DIAMOND","II",67,142,118), flexQueue: rEntry("RANKED_FLEX_SR","PLATINUM","I",45,38,30), topMasteries: [{ championId:238, championLevel:7, championPoints:385200 },{ championId:91, championLevel:7, championPoints:210400 },{ championId:55, championLevel:6, championPoints:142800 }] },
  { puuid: "TEST-PUUID-BLUE-1", riotId: "JungleDiff99#TEST", profileIconId: 4653, summonerLevel: 312, soloQueue: rEntry("RANKED_SOLO_5x5","EMERALD","I",88,201,189), flexQueue: null, topMasteries: [{ championId:64, championLevel:7, championPoints:524000 },{ championId:76, championLevel:7, championPoints:298000 },{ championId:121, championLevel:6, championPoints:175000 }] },
  { puuid: "TEST-PUUID-BLUE-2", riotId: "ADCarryMe#TEST",    profileIconId: 5367, summonerLevel: 189, soloQueue: rEntry("RANKED_SOLO_5x5","PLATINUM","III",22,95,87), flexQueue: null, topMasteries: [{ championId:51, championLevel:7, championPoints:267000 },{ championId:81, championLevel:6, championPoints:189000 },{ championId:236, championLevel:5, championPoints:98000 }] },
  { puuid: "TEST-PUUID-BLUE-3", riotId: "HookCityBaby#TEST", profileIconId: 3587, summonerLevel: 410, soloQueue: rEntry("RANKED_SOLO_5x5","GOLD","I",74,167,160), flexQueue: rEntry("RANKED_FLEX_SR","GOLD","II",30,55,52), topMasteries: [{ championId:412, championLevel:7, championPoints:890000 },{ championId:53, championLevel:7, championPoints:345000 },{ championId:111, championLevel:6, championPoints:220000 }] },
  { puuid: "TEST-PUUID-BLUE-4", riotId: "TopDiffGG#TEST",    profileIconId: 4290, summonerLevel: 156, soloQueue: rEntry("RANKED_SOLO_5x5","SILVER","I",55,78,82), flexQueue: null, topMasteries: [{ championId:86, championLevel:7, championPoints:312000 },{ championId:122, championLevel:6, championPoints:198000 },{ championId:36, championLevel:5, championPoints:112000 }] },
  { puuid: "TEST-PUUID-RED-0",  riotId: "DarkMage666#TEST",  profileIconId: 4812, summonerLevel: 275, soloQueue: rEntry("RANKED_SOLO_5x5","MASTER","I",124,310,265), flexQueue: rEntry("RANKED_FLEX_SR","DIAMOND","IV",10,22,18), topMasteries: [{ championId:45, championLevel:7, championPoints:720000 },{ championId:112, championLevel:7, championPoints:445000 },{ championId:63, championLevel:7, championPoints:310000 }] },
  { puuid: "TEST-PUUID-RED-1",  riotId: "GankMachine#TEST",  profileIconId: 5102, summonerLevel: 198, soloQueue: rEntry("RANKED_SOLO_5x5","DIAMOND","IV",33,155,140), flexQueue: null, topMasteries: [{ championId:254, championLevel:7, championPoints:410000 },{ championId:59, championLevel:7, championPoints:287000 },{ championId:28, championLevel:6, championPoints:165000 }] },
  { puuid: "TEST-PUUID-RED-2",  riotId: "PewPewBot#TEST",    profileIconId: 4501, summonerLevel: 220, soloQueue: rEntry("RANKED_SOLO_5x5","EMERALD","III",56,178,170), flexQueue: rEntry("RANKED_FLEX_SR","PLATINUM","II",67,45,38), topMasteries: [{ championId:222, championLevel:7, championPoints:567000 },{ championId:22, championLevel:7, championPoints:334000 },{ championId:29, championLevel:6, championPoints:201000 }] },
  { puuid: "TEST-PUUID-RED-3",  riotId: "WardBot9000#TEST",  profileIconId: 3890, summonerLevel: 340, soloQueue: rEntry("RANKED_SOLO_5x5","PLATINUM","I",91,225,210), flexQueue: null, topMasteries: [{ championId:117, championLevel:7, championPoints:650000 },{ championId:37, championLevel:7, championPoints:420000 },{ championId:267, championLevel:6, championPoints:280000 }] },
  { puuid: "TEST-PUUID-RED-4",  riotId: "SplitPusher#TEST",  profileIconId: 4111, summonerLevel: 165, soloQueue: rEntry("RANKED_SOLO_5x5","GOLD","III",42,120,125), flexQueue: null, topMasteries: [{ championId:24, championLevel:7, championPoints:478000 },{ championId:23, championLevel:6, championPoints:245000 },{ championId:75, championLevel:6, championPoints:189000 }] },
];

/* ══════════════════════════════════════════════════════════
   "smurf-test" account — triggers all smurf rules
   ══════════════════════════════════════════════════════════
   Blue (100):
     [0] level 30  → confirmed (level < 50)
     [1] WR 72%    → confirmed (ranked WR ≥ 60%)
     [2] level 110 → possible (100–120)
     [3] level 250, WR 52% → none
     [4] level 180, WR 48% → none

   Red (200):
     [0] champWR 90% (10 games) → confirmed
     [1] level 105 → possible (100–120)
     [2] level 115 → possible (100–120)
     [3] level 200, WR 55% → none
     [4] level 300, WR 49% → none
   ══════════════════════════════════════════════════════════ */

export const SMURF_TEST_PUUID = "SMURF-TEST-PUUID-OWNER";

export const SMURF_TEST_RESOLVE = {
  account: {
    key: "smurf-test",
    riotId: { gameName: "SMURF TEST", tagLine: "E2E" },
    platform: "LA2" as const,
    label: "🔍 Smurf Test",
  },
  puuid: SMURF_TEST_PUUID,
};

const smurfPlayers = [
  { name: "NewAccSmurf#TEST",    champId: 238,  spells: [4, 14] as const, team: 100, fullPerks: { perkIds: [8112, 8139, 8138, 8135, 8233, 8237], perkStyle: 8100, perkSubStyle: 8200 } },
  { name: "WinrateGod#TEST",     champId: 64,   spells: [4, 11] as const, team: 100, fullPerks: { perkIds: [8010, 9111, 9104, 8299, 8139, 8135], perkStyle: 8000, perkSubStyle: 8100 } },
  { name: "SusLevel110#TEST",    champId: 51,   spells: [4, 7] as const,  team: 100, fullPerks: { perkIds: [8005, 9111, 9104, 8299, 8233, 8237], perkStyle: 8000, perkSubStyle: 8200 } },
  { name: "NormalGuy1#TEST",     champId: 412,  spells: [4, 14] as const, team: 100, fullPerks: { perkIds: [8439, 8446, 8429, 8451, 8345, 8347], perkStyle: 8400, perkSubStyle: 8300 } },
  { name: "NormalGuy2#TEST",     champId: 86,   spells: [4, 12] as const, team: 100, fullPerks: { perkIds: [8437, 8446, 8429, 8451, 9111, 9104], perkStyle: 8400, perkSubStyle: 8000 } },
  { name: "ChampAbuser#TEST",    champId: 45,   spells: [4, 14] as const, team: 200, fullPerks: { perkIds: [8214, 8226, 8210, 8237, 8139, 8135], perkStyle: 8200, perkSubStyle: 8100 } },
  { name: "SusLevel105#TEST",    champId: 254,  spells: [4, 11] as const, team: 200, fullPerks: { perkIds: [8010, 9111, 9104, 8299, 8446, 8451], perkStyle: 8000, perkSubStyle: 8400 } },
  { name: "SusLevel115#TEST",    champId: 222,  spells: [4, 7] as const,  team: 200, fullPerks: { perkIds: [8005, 9111, 9104, 8299, 8233, 8237], perkStyle: 8000, perkSubStyle: 8200 } },
  { name: "CasualPlayer#TEST",   champId: 117,  spells: [4, 3] as const,  team: 200, fullPerks: { perkIds: [8351, 8313, 8345, 8347, 8233, 8237], perkStyle: 8300, perkSubStyle: 8200 } },
  { name: "VeteranDad#TEST",     champId: 24,   spells: [4, 12] as const, team: 200, fullPerks: { perkIds: [8010, 9111, 9104, 8299, 8446, 8451], perkStyle: 8000, perkSubStyle: 8400 } },
];

export const SMURF_MOCK_LIVE_GAME = {
  available: true as const,
  gameId: 8888888,
  gameMode: "CLASSIC",
  gameStartTime: Date.now() - 10 * 60 * 1000,
  teams: buildTeamParticipants(smurfPlayers, "SMURF-TEST"),
};

/* ── Smurf-test summaries with exact stats for rules ── */
export interface SmurfMockSummary extends MockSummary {
  championWinrate: number | null;
  championSampleSize: number;
  smurf: SmurfAssessment;
}

function buildSmurfSummary(
  puuid: string,
  riotId: string,
  level: number,
  soloQ: RankedEntry | null,
  flexQ: RankedEntry | null,
  masteries: MockSummary["topMasteries"],
  champWR: number | null,
  champSample: number,
): SmurfMockSummary {
  const entry = soloQ ?? flexQ;
  let rankedWinrate: number | null = null;
  if (entry) {
    const total = entry.wins + entry.losses;
    rankedWinrate = total > 0 ? entry.wins / total : null;
  }

  const smurf = computeSmurfAssessment({
    summonerLevel: level,
    rankedWinrate,
    championWinrate: champWR,
    championSampleSize: champSample,
  });

  return {
    puuid,
    riotId,
    profileIconId: 4000 + parseInt(puuid.replace(/\D/g, "").slice(-3) || "0"),
    summonerLevel: level,
    soloQueue: soloQ,
    flexQueue: flexQ,
    topMasteries: masteries,
    championWinrate: champWR,
    championSampleSize: champSample,
    smurf,
  };
}

const defaultMasteries: MockSummary["topMasteries"] = [
  { championId: 238, championLevel: 5, championPoints: 50000 },
  { championId: 64, championLevel: 4, championPoints: 30000 },
];

const smurfSummaries: SmurfMockSummary[] = [
  /* Blue [0]: NewAccSmurf — level 30 → confirmed */
  buildSmurfSummary("SMURF-TEST-BLUE-0", "NewAccSmurf#TEST", 30,
    rEntry("RANKED_SOLO_5x5", "GOLD", "II", 50, 25, 25),
    null, defaultMasteries, null, 0),

  /* Blue [1]: WinrateGod — WR 72% → confirmed */
  buildSmurfSummary("SMURF-TEST-BLUE-1", "WinrateGod#TEST", 180,
    rEntry("RANKED_SOLO_5x5", "PLATINUM", "I", 80, 72, 28),
    null, defaultMasteries, null, 0),

  /* Blue [2]: SusLevel110 — level 110 → possible */
  buildSmurfSummary("SMURF-TEST-BLUE-2", "SusLevel110#TEST", 110,
    rEntry("RANKED_SOLO_5x5", "SILVER", "II", 30, 40, 50),
    null, defaultMasteries, null, 0),

  /* Blue [3]: NormalGuy1 — level 250, WR 52% → none */
  buildSmurfSummary("SMURF-TEST-BLUE-3", "NormalGuy1#TEST", 250,
    rEntry("RANKED_SOLO_5x5", "GOLD", "I", 60, 130, 120),
    null, defaultMasteries, null, 0),

  /* Blue [4]: NormalGuy2 — level 180, WR 48% → none */
  buildSmurfSummary("SMURF-TEST-BLUE-4", "NormalGuy2#TEST", 180,
    rEntry("RANKED_SOLO_5x5", "SILVER", "III", 40, 60, 65),
    null, defaultMasteries, null, 0),

  /* Red [0]: ChampAbuser — champWR 90% in 10 games → confirmed */
  buildSmurfSummary("SMURF-TEST-RED-0", "ChampAbuser#TEST", 200,
    rEntry("RANKED_SOLO_5x5", "PLATINUM", "III", 55, 100, 100),
    null, defaultMasteries, 0.9, 10),

  /* Red [1]: SusLevel105 — level 105 → possible */
  buildSmurfSummary("SMURF-TEST-RED-1", "SusLevel105#TEST", 105,
    rEntry("RANKED_SOLO_5x5", "BRONZE", "I", 20, 35, 40),
    null, defaultMasteries, null, 0),

  /* Red [2]: SusLevel115 — level 115 → possible */
  buildSmurfSummary("SMURF-TEST-RED-2", "SusLevel115#TEST", 115,
    rEntry("RANKED_SOLO_5x5", "SILVER", "IV", 10, 28, 32),
    null, defaultMasteries, null, 0),

  /* Red [3]: CasualPlayer — level 200, WR 55% → none */
  buildSmurfSummary("SMURF-TEST-RED-3", "CasualPlayer#TEST", 200,
    rEntry("RANKED_SOLO_5x5", "GOLD", "IV", 35, 110, 90),
    null, defaultMasteries, null, 0),

  /* Red [4]: VeteranDad — level 300, WR 49% → none */
  buildSmurfSummary("SMURF-TEST-RED-4", "VeteranDad#TEST", 300,
    rEntry("RANKED_SOLO_5x5", "SILVER", "I", 70, 98, 102),
    null, defaultMasteries, null, 0),
];

/* ══════════════════════════════════════════════════════════
   Public API
   ══════════════════════════════════════════════════════════ */

/** Check if a puuid belongs to any test account */
export function isTestPuuid(puuid: string): boolean {
  return (
    puuid === TEST_PUUID ||
    puuid.startsWith("TEST-PUUID-") ||
    puuid === SMURF_TEST_PUUID ||
    puuid.startsWith("SMURF-TEST-")
  );
}

/** Check if a puuid belongs to the smurf-test account */
export function isSmurfTestPuuid(puuid: string): boolean {
  return puuid === SMURF_TEST_PUUID || puuid.startsWith("SMURF-TEST-");
}

/** Get legacy mock summary (old "test" account) */
export function getMockPlayerSummary(puuid: string): MockSummary | undefined {
  return legacySummaries.find((s) => s.puuid === puuid);
}

/** Get all legacy mock summaries (for batch endpoint) */
export function getAllLegacyMockSummaries(): MockSummary[] {
  return legacySummaries;
}

/** Get smurf-test mock summary (includes smurf assessment) */
export function getSmurfMockPlayerSummary(puuid: string): SmurfMockSummary | undefined {
  return smurfSummaries.find((s) => s.puuid === puuid);
}

/** Get all smurf-test summaries (for batch endpoint) */
export function getAllSmurfMockSummaries(): SmurfMockSummary[] {
  return smurfSummaries;
}
