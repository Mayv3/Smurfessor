export interface ChampionData {
  id: string; // e.g. "Aatrox"
  name: string; // e.g. "Aatrox"
  key: string; // numeric string e.g. "266"
  image: string; // e.g. "Aatrox.png"
}

export interface SpellData {
  id: string; // e.g. "SummonerFlash"
  name: string; // e.g. "Flash"
  key: string; // numeric string
  image: string; // e.g. "SummonerFlash.png"
}

export interface RuneTree {
  id: number;
  key: string;
  name: string;
  icon: string; // path like "perk-images/Styles/7200_Domination.png"
}

export interface RuneData {
  id: number;
  key: string;
  name: string;
  icon: string; // path like "perk-images/Styles/Precision/PressTheAttack/PressTheAttack.png"
}

export interface DDragonBootstrap {
  version: string;
  champions: Record<string, ChampionData>; // keyed by champion key (numeric)
  spells: Record<string, SpellData>; // keyed by spell key (numeric)
  runes: Record<string, RuneTree>; // keyed by rune tree id (numeric string)
  runeData: Record<string, RuneData>; // keyed by individual rune id (numeric string)
}

/* Re-export rune normalization types for convenience */
export type { NormalizedRunes, NormalizedRuneSlot, StatShard } from "./runes";
