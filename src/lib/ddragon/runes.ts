/**
 * Rune normalization — maps raw Spectator perks to structured rune data
 * using Data Dragon's runesReforged dataset.
 */
import type { RuneTree, RuneData } from "./types";

/* ── Stat Shard mapping (IDs → display info) ─────────── */
export interface StatShard {
  id: number;
  name: string;
  icon: string;
  description: string;
}

/**
 * Stat mod (shard) IDs are fixed and not in runesReforged.json.
 * This is the canonical mapping used by the game client.
 */
const STAT_SHARDS: Record<number, StatShard> = {
  5008: { id: 5008, name: "Adaptive Force",  icon: "perk-images/StatMods/StatModsAdaptiveForceIcon.png",    description: "+9 Adaptive Force" },
  5005: { id: 5005, name: "Attack Speed",    icon: "perk-images/StatMods/StatModsAttackSpeedIcon.png",     description: "+10% Attack Speed" },
  5007: { id: 5007, name: "Ability Haste",   icon: "perk-images/StatMods/StatModsCDRScalingIcon.png",      description: "+8 Ability Haste" },
  5013: { id: 5013, name: "Tenacity",        icon: "perk-images/StatMods/StatModsTenacityIcon.png",        description: "+10% Tenacity and Slow Resist" },
  5001: { id: 5001, name: "Health Scaling",   icon: "perk-images/StatMods/StatModsHealthScalingIcon.png",   description: "+15-140 Health (based on level)" },
  5002: { id: 5002, name: "Armor",            icon: "perk-images/StatMods/StatModsArmorIcon.png",           description: "+6 Armor" },
  5003: { id: 5003, name: "Magic Resist",     icon: "perk-images/StatMods/StatModsMagicResIcon.png.png",    description: "+8 Magic Resist" },
  5010: { id: 5010, name: "Move Speed",       icon: "perk-images/StatMods/StatModsMovementSpeedIcon.png",   description: "+2% Move Speed" },
  5011: { id: 5011, name: "Health",           icon: "perk-images/StatMods/StatModsHealthScalingIcon.png",   description: "+65 Health" },
};

export function getStatShard(id: number): StatShard | undefined {
  return STAT_SHARDS[id];
}

/* ── Normalized runes structure for UI ───────────────── */
export interface NormalizedRuneSlot {
  id: number;
  name: string;
  icon: string;
}

export interface NormalizedRunes {
  primaryStyle: NormalizedRuneSlot;
  subStyle: NormalizedRuneSlot;
  keystone: NormalizedRuneSlot;
  primaryRunes: NormalizedRuneSlot[];
  secondaryRunes: NormalizedRuneSlot[];
  shards: NormalizedRuneSlot[];
}

/* ── Raw perk shapes from Spectator API ──────────────── */
export interface RawPerks {
  perkIds: number[];
  perkStyle: number;
  perkSubStyle: number;
}

export interface RawStatPerks {
  offense?: number;
  flex?: number;
  defense?: number;
}

/**
 * Normalize raw spectator perks into a structured runes object.
 *
 * @param perks      Raw perks from Spectator API participant
 * @param statPerks  Stat mod selections (shards), if available
 * @param runeTrees  Map of tree ID → RuneTree from DDragon
 * @param runeData   Map of individual rune ID → RuneData from DDragon
 */
export function normalizeRunes(
  perks: RawPerks,
  statPerks: RawStatPerks | null | undefined,
  runeTrees: Record<string, RuneTree>,
  runeData: Record<string, RuneData>,
): NormalizedRunes {
  /* Primary tree */
  const primaryTree = runeTrees[String(perks.perkStyle)];
  const primaryStyle: NormalizedRuneSlot = primaryTree
    ? { id: primaryTree.id, name: primaryTree.name, icon: primaryTree.icon }
    : { id: perks.perkStyle, name: "Unknown", icon: "" };

  /* Secondary tree */
  const subTree = runeTrees[String(perks.perkSubStyle)];
  const subStyle: NormalizedRuneSlot = subTree
    ? { id: subTree.id, name: subTree.name, icon: subTree.icon }
    : { id: perks.perkSubStyle, name: "Unknown", icon: "" };

  /* Classify perkIds into keystone, primary minor, secondary */
  const primaryTreeRuneIds = new Set<number>();
  const subTreeRuneIds = new Set<number>();

  /* Build sets of rune IDs that belong to each tree */
  for (const [, rd] of Object.entries(runeData)) {
    /* We check if the rune belongs to a tree by seeing if its id is listed in that tree's slots. 
       Since we already mapped all runes in ddragon/index.ts, we can check tree membership differently.
       The simplest heuristic: the rune's perkStyle determines which tree it belongs to.
       We'll use the perkIds list: [0] = keystone, [1-3] = primary minors, [4-5] = secondary picks */
    void rd; // we use positional logic instead
  }

  /* Spectator perkIds layout:
     [0] = keystone
     [1] = primary row 1
     [2] = primary row 2
     [3] = primary row 3
     [4] = secondary pick 1
     [5] = secondary pick 2
     (indices 6+ may be stat shards in some versions)
  */
  const allPerkIds = perks.perkIds ?? [];

  const keystoneId = allPerkIds[0];
  const keystoneData = runeData[String(keystoneId)];
  const keystone: NormalizedRuneSlot = keystoneData
    ? { id: keystoneData.id, name: keystoneData.name, icon: keystoneData.icon }
    : { id: keystoneId ?? 0, name: "Unknown", icon: "" };

  /* Primary minor runes (positions 1-3) */
  const primaryRunes: NormalizedRuneSlot[] = [];
  for (let i = 1; i <= 3 && i < allPerkIds.length; i++) {
    const rid = allPerkIds[i];
    const rd = runeData[String(rid)];
    if (rd) {
      primaryRunes.push({ id: rd.id, name: rd.name, icon: rd.icon });
    } else if (rid && !STAT_SHARDS[rid]) {
      primaryRunes.push({ id: rid, name: "Unknown", icon: "" });
    }
  }

  /* Secondary runes (positions 4-5) */
  const secondaryRunes: NormalizedRuneSlot[] = [];
  for (let i = 4; i <= 5 && i < allPerkIds.length; i++) {
    const rid = allPerkIds[i];
    const rd = runeData[String(rid)];
    if (rd) {
      secondaryRunes.push({ id: rd.id, name: rd.name, icon: rd.icon });
    } else if (rid && !STAT_SHARDS[rid]) {
      secondaryRunes.push({ id: rid, name: "Unknown", icon: "" });
    }
  }

  /* Stat shards — from explicit statPerks object or perkIds tail */
  const shards: NormalizedRuneSlot[] = [];

  if (statPerks) {
    for (const val of [statPerks.offense, statPerks.flex, statPerks.defense]) {
      if (val != null) {
        const shard = STAT_SHARDS[val];
        if (shard) {
          shards.push({ id: shard.id, name: shard.name, icon: shard.icon });
        } else {
          shards.push({ id: val, name: `Shard ${val}`, icon: "" });
        }
      }
    }
  } else {
    /* Some spectator versions put shards at perkIds[6..8] */
    for (let i = 6; i < allPerkIds.length && shards.length < 3; i++) {
      const sid = allPerkIds[i];
      const shard = STAT_SHARDS[sid];
      if (shard) {
        shards.push({ id: shard.id, name: shard.name, icon: shard.icon });
      }
    }
  }

  void primaryTreeRuneIds;
  void subTreeRuneIds;

  return {
    primaryStyle,
    subStyle,
    keystone,
    primaryRunes,
    secondaryRunes,
    shards,
  };
}
