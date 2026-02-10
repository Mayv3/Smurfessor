/* ── Raw Riot API response shapes ─────────────────────── */

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface Summoner {
  id: string; // encrypted summoner id
  accountId: string;
  puuid: string;
  profileIconId: number;
  summonerLevel: number;
  name?: string;
}

export interface LeagueEntry {
  queueType: string; // RANKED_SOLO_5x5 | RANKED_FLEX_SR
  tier: string; // IRON … CHALLENGER
  rank: string; // I … IV
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
}

export interface ChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
}

export interface SpectatorPerks {
  perkIds: number[];
  perkStyle: number;
  perkSubStyle: number;
}

export interface SpectatorParticipant {
  puuid: string;
  teamId: number; // 100 = blue, 200 = red
  spell1Id: number;
  spell2Id: number;
  championId: number;
  profileIconId: number;
  riotId: string;
  summonerId: string;
  perks?: SpectatorPerks;
}

export interface SpectatorGame {
  gameId: number;
  gameType: string;
  gameStartTime: number;
  mapId: number;
  gameLength: number;
  platformId: string;
  gameMode: string;
  participants: SpectatorParticipant[];
}

/* ── Normalized shapes for the UI ────────────────────── */

export interface NormalizedParticipant {
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

export interface NormalizedLiveGame {
  available: true;
  gameId: number;
  gameMode: string;
  gameStartTime: number;
  teams: {
    blue: NormalizedParticipant[];
    red: NormalizedParticipant[];
  };
}

export interface LiveGameUnavailable {
  available: false;
  reason: string;
}

export type LiveGameResult = NormalizedLiveGame | LiveGameUnavailable;

export interface PlayerSummary {
  puuid: string;
  riotId: string;
  profileIconId: number;
  summonerLevel: number;
  soloQueue: LeagueEntry | null;
  flexQueue: LeagueEntry | null;
  topMasteries: ChampionMastery[];
}
