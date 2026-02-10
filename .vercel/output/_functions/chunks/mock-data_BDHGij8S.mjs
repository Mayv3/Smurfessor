const LEVEL_CONFIRMED_MAX = 50;
const LEVEL_POSSIBLE_MIN = 100;
const LEVEL_POSSIBLE_MAX = 120;
const RANKED_WR_CONFIRMED = 0.6;
const CHAMP_WR_CONFIRMED = 0.8;
const CHAMP_MIN_SAMPLE = 8;
function computeSmurfAssessment(input) {
  const reasons = [];
  let maxProbability = 0;
  let hasPossible = false;
  let hasConfirmed = false;
  if (input.summonerLevel !== null && input.summonerLevel < LEVEL_CONFIRMED_MAX) {
    reasons.push(`Nivel ${input.summonerLevel} (< ${LEVEL_CONFIRMED_MAX}) — cuenta nueva`);
    maxProbability = 100;
    hasConfirmed = true;
  }
  if (input.summonerLevel !== null && input.summonerLevel >= LEVEL_POSSIBLE_MIN && input.summonerLevel <= LEVEL_POSSIBLE_MAX) {
    reasons.push(`Nivel ${input.summonerLevel} (${LEVEL_POSSIBLE_MIN}–${LEVEL_POSSIBLE_MAX}) — cuenta sospechosa`);
    if (maxProbability < 55) maxProbability = 55;
    hasPossible = true;
  }
  if (input.rankedWinrate !== null && input.rankedWinrate >= RANKED_WR_CONFIRMED) {
    const pct = Math.round(input.rankedWinrate * 100);
    reasons.push(`Winrate ranked ${pct}% (≥ ${Math.round(RANKED_WR_CONFIRMED * 100)}%)`);
    maxProbability = 100;
    hasConfirmed = true;
  }
  if (input.championWinrate !== null) {
    if (input.championSampleSize >= CHAMP_MIN_SAMPLE) {
      if (input.championWinrate >= CHAMP_WR_CONFIRMED) {
        const pct = Math.round(input.championWinrate * 100);
        reasons.push(`Winrate con campeón actual ${pct}% (≥ ${Math.round(CHAMP_WR_CONFIRMED * 100)}%) en ${input.championSampleSize} partidas`);
        maxProbability = 100;
        hasConfirmed = true;
      }
    } else if (input.championSampleSize > 0) {
      reasons.push(
        `Muestra campeón insuficiente (${input.championSampleSize} < ${CHAMP_MIN_SAMPLE} partidas)`
      );
    }
  }
  if (hasConfirmed) {
    return {
      probability: 100,
      label: "SMURF 100%",
      severity: "confirmed",
      reasons
    };
  }
  if (hasPossible) {
    return {
      probability: maxProbability,
      label: "Posible smurf",
      severity: "possible",
      reasons
    };
  }
  if (reasons.length === 0 && input.summonerLevel === null && input.rankedWinrate === null) {
    return {
      probability: 0,
      label: "Datos insuficientes",
      severity: "none",
      reasons: ["Sin datos para evaluar"]
    };
  }
  return {
    probability: 0,
    label: "No smurf",
    severity: "none",
    reasons: reasons.length > 0 ? reasons : ["Ninguna regla activada"]
  };
}

function rEntry(queue, tier, rank, lp, w, l) {
  return { queueType: queue, tier, rank, leaguePoints: lp, wins: w, losses: l, hotStreak: false, veteran: false, freshBlood: false, inactive: false };
}
function buildTeamParticipants(players, prefix) {
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
      perkKeystone: p.perks?.[0] ?? 8112,
      perkPrimaryStyle: p.perks?.[1] ?? 8100,
      perkSubStyle: p.perks?.[2] ?? 8300
    })),
    red: red.map((p, i) => ({
      puuid: `${prefix}-RED-${i}`,
      riotId: p.name,
      championId: p.champId,
      spell1Id: p.spells[0],
      spell2Id: p.spells[1],
      teamId: p.team,
      perkKeystone: p.perks?.[0] ?? 8112,
      perkPrimaryStyle: p.perks?.[1] ?? 8100,
      perkSubStyle: p.perks?.[2] ?? 8300
    }))
  };
}
const TEST_PUUID = "TEST-PUUID-0000-0000-000000000000";
const legacyPlayers = [
  { name: "xXMidGodXx#TEST", champId: 238, spells: [4, 14], team: 100, perks: [8112, 8100, 8e3] },
  // Electrocute
  { name: "JungleDiff99#TEST", champId: 64, spells: [4, 11], team: 100, perks: [8010, 8e3, 8100] },
  // Conqueror
  { name: "ADCarryMe#TEST", champId: 51, spells: [4, 7], team: 100, perks: [8005, 8e3, 8200] },
  // Press the Attack
  { name: "HookCityBaby#TEST", champId: 412, spells: [4, 14], team: 100, perks: [8439, 8400, 8300] },
  // Aftershock
  { name: "TopDiffGG#TEST", champId: 86, spells: [4, 12], team: 100, perks: [8437, 8400, 8e3] },
  // Grasp of the Undying
  { name: "DarkMage666#TEST", champId: 45, spells: [4, 14], team: 200, perks: [8214, 8200, 8100] },
  // Summon Aery
  { name: "GankMachine#TEST", champId: 254, spells: [4, 11], team: 200, perks: [8010, 8e3, 8400] },
  // Conqueror
  { name: "PewPewBot#TEST", champId: 222, spells: [4, 7], team: 200, perks: [9923, 8e3, 8200] },
  // Hail of Blades
  { name: "WardBot9000#TEST", champId: 117, spells: [4, 3], team: 200, perks: [8351, 8300, 8200] },
  // Glacial Augment
  { name: "SplitPusher#TEST", champId: 24, spells: [4, 12], team: 200, perks: [8010, 8e3, 8400] }
  // Conqueror
];
const MOCK_RESOLVE = {
  account: {
    key: "test",
    riotId: { gameName: "Test Account", tagLine: "0000" },
    platform: "LA2",
    label: "🧪 Test"
  },
  puuid: TEST_PUUID
};
const MOCK_LIVE_GAME = {
  available: true,
  gameId: 9999999,
  gameMode: "CLASSIC",
  gameStartTime: Date.now() - 14 * 60 * 1e3,
  teams: buildTeamParticipants(legacyPlayers, "TEST-PUUID")
};
const legacySummaries = [
  { puuid: "TEST-PUUID-BLUE-0", riotId: "xXMidGodXx#TEST", profileIconId: 4834, summonerLevel: 247, soloQueue: rEntry("RANKED_SOLO_5x5", "DIAMOND", "II", 67, 142, 118), flexQueue: rEntry("RANKED_FLEX_SR", "PLATINUM", "I", 45, 38, 30), topMasteries: [{ championId: 238, championLevel: 7, championPoints: 385200 }, { championId: 91, championLevel: 7, championPoints: 210400 }, { championId: 55, championLevel: 6, championPoints: 142800 }] },
  { puuid: "TEST-PUUID-BLUE-1", riotId: "JungleDiff99#TEST", profileIconId: 4653, summonerLevel: 312, soloQueue: rEntry("RANKED_SOLO_5x5", "EMERALD", "I", 88, 201, 189), flexQueue: null, topMasteries: [{ championId: 64, championLevel: 7, championPoints: 524e3 }, { championId: 76, championLevel: 7, championPoints: 298e3 }, { championId: 121, championLevel: 6, championPoints: 175e3 }] },
  { puuid: "TEST-PUUID-BLUE-2", riotId: "ADCarryMe#TEST", profileIconId: 5367, summonerLevel: 189, soloQueue: rEntry("RANKED_SOLO_5x5", "PLATINUM", "III", 22, 95, 87), flexQueue: null, topMasteries: [{ championId: 51, championLevel: 7, championPoints: 267e3 }, { championId: 81, championLevel: 6, championPoints: 189e3 }, { championId: 236, championLevel: 5, championPoints: 98e3 }] },
  { puuid: "TEST-PUUID-BLUE-3", riotId: "HookCityBaby#TEST", profileIconId: 3587, summonerLevel: 410, soloQueue: rEntry("RANKED_SOLO_5x5", "GOLD", "I", 74, 167, 160), flexQueue: rEntry("RANKED_FLEX_SR", "GOLD", "II", 30, 55, 52), topMasteries: [{ championId: 412, championLevel: 7, championPoints: 89e4 }, { championId: 53, championLevel: 7, championPoints: 345e3 }, { championId: 111, championLevel: 6, championPoints: 22e4 }] },
  { puuid: "TEST-PUUID-BLUE-4", riotId: "TopDiffGG#TEST", profileIconId: 4290, summonerLevel: 156, soloQueue: rEntry("RANKED_SOLO_5x5", "SILVER", "I", 55, 78, 82), flexQueue: null, topMasteries: [{ championId: 86, championLevel: 7, championPoints: 312e3 }, { championId: 122, championLevel: 6, championPoints: 198e3 }, { championId: 36, championLevel: 5, championPoints: 112e3 }] },
  { puuid: "TEST-PUUID-RED-0", riotId: "DarkMage666#TEST", profileIconId: 4812, summonerLevel: 275, soloQueue: rEntry("RANKED_SOLO_5x5", "MASTER", "I", 124, 310, 265), flexQueue: rEntry("RANKED_FLEX_SR", "DIAMOND", "IV", 10, 22, 18), topMasteries: [{ championId: 45, championLevel: 7, championPoints: 72e4 }, { championId: 112, championLevel: 7, championPoints: 445e3 }, { championId: 63, championLevel: 7, championPoints: 31e4 }] },
  { puuid: "TEST-PUUID-RED-1", riotId: "GankMachine#TEST", profileIconId: 5102, summonerLevel: 198, soloQueue: rEntry("RANKED_SOLO_5x5", "DIAMOND", "IV", 33, 155, 140), flexQueue: null, topMasteries: [{ championId: 254, championLevel: 7, championPoints: 41e4 }, { championId: 59, championLevel: 7, championPoints: 287e3 }, { championId: 28, championLevel: 6, championPoints: 165e3 }] },
  { puuid: "TEST-PUUID-RED-2", riotId: "PewPewBot#TEST", profileIconId: 4501, summonerLevel: 220, soloQueue: rEntry("RANKED_SOLO_5x5", "EMERALD", "III", 56, 178, 170), flexQueue: rEntry("RANKED_FLEX_SR", "PLATINUM", "II", 67, 45, 38), topMasteries: [{ championId: 222, championLevel: 7, championPoints: 567e3 }, { championId: 22, championLevel: 7, championPoints: 334e3 }, { championId: 29, championLevel: 6, championPoints: 201e3 }] },
  { puuid: "TEST-PUUID-RED-3", riotId: "WardBot9000#TEST", profileIconId: 3890, summonerLevel: 340, soloQueue: rEntry("RANKED_SOLO_5x5", "PLATINUM", "I", 91, 225, 210), flexQueue: null, topMasteries: [{ championId: 117, championLevel: 7, championPoints: 65e4 }, { championId: 37, championLevel: 7, championPoints: 42e4 }, { championId: 267, championLevel: 6, championPoints: 28e4 }] },
  { puuid: "TEST-PUUID-RED-4", riotId: "SplitPusher#TEST", profileIconId: 4111, summonerLevel: 165, soloQueue: rEntry("RANKED_SOLO_5x5", "GOLD", "III", 42, 120, 125), flexQueue: null, topMasteries: [{ championId: 24, championLevel: 7, championPoints: 478e3 }, { championId: 23, championLevel: 6, championPoints: 245e3 }, { championId: 75, championLevel: 6, championPoints: 189e3 }] }
];
const SMURF_TEST_PUUID = "SMURF-TEST-PUUID-OWNER";
const SMURF_TEST_RESOLVE = {
  account: {
    key: "smurf-test",
    riotId: { gameName: "SMURF TEST", tagLine: "E2E" },
    platform: "LA2",
    label: "🔍 Smurf Test"
  },
  puuid: SMURF_TEST_PUUID
};
const smurfPlayers = [
  { name: "NewAccSmurf#TEST", champId: 238, spells: [4, 14], team: 100, perks: [8112, 8100, 8200] },
  // Electrocute
  { name: "WinrateGod#TEST", champId: 64, spells: [4, 11], team: 100, perks: [8010, 8e3, 8100] },
  // Conqueror
  { name: "SusLevel110#TEST", champId: 51, spells: [4, 7], team: 100, perks: [8005, 8e3, 8200] },
  // Press the Attack
  { name: "NormalGuy1#TEST", champId: 412, spells: [4, 14], team: 100, perks: [8439, 8400, 8300] },
  // Aftershock
  { name: "NormalGuy2#TEST", champId: 86, spells: [4, 12], team: 100, perks: [8437, 8400, 8e3] },
  // Grasp
  { name: "ChampAbuser#TEST", champId: 45, spells: [4, 14], team: 200, perks: [8214, 8200, 8100] },
  // Summon Aery
  { name: "SusLevel105#TEST", champId: 254, spells: [4, 11], team: 200, perks: [8010, 8e3, 8400] },
  // Conqueror
  { name: "SusLevel115#TEST", champId: 222, spells: [4, 7], team: 200, perks: [8005, 8e3, 8200] },
  // Press the Attack
  { name: "CasualPlayer#TEST", champId: 117, spells: [4, 3], team: 200, perks: [8351, 8300, 8200] },
  // Glacial Augment
  { name: "VeteranDad#TEST", champId: 24, spells: [4, 12], team: 200, perks: [8010, 8e3, 8400] }
  // Conqueror
];
const SMURF_MOCK_LIVE_GAME = {
  available: true,
  gameId: 8888888,
  gameMode: "CLASSIC",
  gameStartTime: Date.now() - 10 * 60 * 1e3,
  teams: buildTeamParticipants(smurfPlayers, "SMURF-TEST")
};
function buildSmurfSummary(puuid, riotId, level, soloQ, flexQ, masteries, champWR, champSample) {
  const entry = soloQ ?? flexQ;
  let rankedWinrate = null;
  if (entry) {
    const total = entry.wins + entry.losses;
    rankedWinrate = total > 0 ? entry.wins / total : null;
  }
  const smurf = computeSmurfAssessment({
    summonerLevel: level,
    rankedWinrate,
    championWinrate: champWR,
    championSampleSize: champSample
  });
  return {
    puuid,
    riotId,
    profileIconId: 4e3 + parseInt(puuid.replace(/\D/g, "").slice(-3) || "0"),
    summonerLevel: level,
    soloQueue: soloQ,
    flexQueue: flexQ,
    topMasteries: masteries,
    championWinrate: champWR,
    championSampleSize: champSample,
    smurf
  };
}
const defaultMasteries = [
  { championId: 238, championLevel: 5, championPoints: 5e4 },
  { championId: 64, championLevel: 4, championPoints: 3e4 }
];
const smurfSummaries = [
  /* Blue [0]: NewAccSmurf — level 30 → confirmed */
  buildSmurfSummary(
    "SMURF-TEST-BLUE-0",
    "NewAccSmurf#TEST",
    30,
    rEntry("RANKED_SOLO_5x5", "GOLD", "II", 50, 25, 25),
    null,
    defaultMasteries,
    null,
    0
  ),
  /* Blue [1]: WinrateGod — WR 72% → confirmed */
  buildSmurfSummary(
    "SMURF-TEST-BLUE-1",
    "WinrateGod#TEST",
    180,
    rEntry("RANKED_SOLO_5x5", "PLATINUM", "I", 80, 72, 28),
    null,
    defaultMasteries,
    null,
    0
  ),
  /* Blue [2]: SusLevel110 — level 110 → possible */
  buildSmurfSummary(
    "SMURF-TEST-BLUE-2",
    "SusLevel110#TEST",
    110,
    rEntry("RANKED_SOLO_5x5", "SILVER", "II", 30, 40, 50),
    null,
    defaultMasteries,
    null,
    0
  ),
  /* Blue [3]: NormalGuy1 — level 250, WR 52% → none */
  buildSmurfSummary(
    "SMURF-TEST-BLUE-3",
    "NormalGuy1#TEST",
    250,
    rEntry("RANKED_SOLO_5x5", "GOLD", "I", 60, 130, 120),
    null,
    defaultMasteries,
    null,
    0
  ),
  /* Blue [4]: NormalGuy2 — level 180, WR 48% → none */
  buildSmurfSummary(
    "SMURF-TEST-BLUE-4",
    "NormalGuy2#TEST",
    180,
    rEntry("RANKED_SOLO_5x5", "SILVER", "III", 40, 60, 65),
    null,
    defaultMasteries,
    null,
    0
  ),
  /* Red [0]: ChampAbuser — champWR 90% in 10 games → confirmed */
  buildSmurfSummary(
    "SMURF-TEST-RED-0",
    "ChampAbuser#TEST",
    200,
    rEntry("RANKED_SOLO_5x5", "PLATINUM", "III", 55, 100, 100),
    null,
    defaultMasteries,
    0.9,
    10
  ),
  /* Red [1]: SusLevel105 — level 105 → possible */
  buildSmurfSummary(
    "SMURF-TEST-RED-1",
    "SusLevel105#TEST",
    105,
    rEntry("RANKED_SOLO_5x5", "BRONZE", "I", 20, 35, 40),
    null,
    defaultMasteries,
    null,
    0
  ),
  /* Red [2]: SusLevel115 — level 115 → possible */
  buildSmurfSummary(
    "SMURF-TEST-RED-2",
    "SusLevel115#TEST",
    115,
    rEntry("RANKED_SOLO_5x5", "SILVER", "IV", 10, 28, 32),
    null,
    defaultMasteries,
    null,
    0
  ),
  /* Red [3]: CasualPlayer — level 200, WR 55% → none */
  buildSmurfSummary(
    "SMURF-TEST-RED-3",
    "CasualPlayer#TEST",
    200,
    rEntry("RANKED_SOLO_5x5", "GOLD", "IV", 35, 110, 90),
    null,
    defaultMasteries,
    null,
    0
  ),
  /* Red [4]: VeteranDad — level 300, WR 49% → none */
  buildSmurfSummary(
    "SMURF-TEST-RED-4",
    "VeteranDad#TEST",
    300,
    rEntry("RANKED_SOLO_5x5", "SILVER", "I", 70, 98, 102),
    null,
    defaultMasteries,
    null,
    0
  )
];
function isTestPuuid(puuid) {
  return puuid === TEST_PUUID || puuid.startsWith("TEST-PUUID-") || puuid === SMURF_TEST_PUUID || puuid.startsWith("SMURF-TEST-");
}
function isSmurfTestPuuid(puuid) {
  return puuid === SMURF_TEST_PUUID || puuid.startsWith("SMURF-TEST-");
}
function getMockPlayerSummary(puuid) {
  return legacySummaries.find((s) => s.puuid === puuid);
}
function getSmurfMockPlayerSummary(puuid) {
  return smurfSummaries.find((s) => s.puuid === puuid);
}
function getAllSmurfMockSummaries() {
  return smurfSummaries;
}

export { MOCK_LIVE_GAME as M, SMURF_MOCK_LIVE_GAME as S, isTestPuuid as a, getAllSmurfMockSummaries as b, computeSmurfAssessment as c, getSmurfMockPlayerSummary as d, MOCK_RESOLVE as e, SMURF_TEST_RESOLVE as f, getMockPlayerSummary as g, isSmurfTestPuuid as i };
