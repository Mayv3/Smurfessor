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

/* ── Internal helpers for normalizeRunes ──────────────── */
function lookupTree(runeTrees: Record<string, RuneTree>, id: number): NormalizedRuneSlot {
  const tree = runeTrees[String(id)];
  return tree
    ? { id: tree.id, name: tree.name, icon: tree.icon }
    : { id, name: "Unknown", icon: "" };
}

function lookupRune(runeData: Record<string, RuneData>, id: number): NormalizedRuneSlot {
  const rd = runeData[String(id)];
  return rd
    ? { id: rd.id, name: rd.name, icon: rd.icon }
    : { id: id ?? 0, name: "Unknown", icon: "" };
}

function extractRuneSlots(
  perkIds: number[], start: number, end: number,
  runeData: Record<string, RuneData>,
): NormalizedRuneSlot[] {
  const result: NormalizedRuneSlot[] = [];
  for (let i = start; i <= end && i < perkIds.length; i++) {
    const rid = perkIds[i];
    if (rid && !STAT_SHARDS[rid]) {
      result.push(lookupRune(runeData, rid));
    }
  }
  return result;
}

function toShardSlot(val: number): NormalizedRuneSlot {
  const shard = STAT_SHARDS[val];
  return shard
    ? { id: shard.id, name: shard.name, icon: shard.icon }
    : { id: val, name: `Shard ${val}`, icon: "" };
}

function resolveShards(
  statPerks: RawStatPerks | null | undefined,
  allPerkIds: number[],
): NormalizedRuneSlot[] {
  const shards: NormalizedRuneSlot[] = [];
  if (statPerks) {
    for (const val of [statPerks.offense, statPerks.flex, statPerks.defense]) {
      if (val != null) shards.push(toShardSlot(val));
    }
  } else {
    for (let i = 6; i < allPerkIds.length && shards.length < 3; i++) {
      const shard = STAT_SHARDS[allPerkIds[i]];
      if (shard) shards.push({ id: shard.id, name: shard.name, icon: shard.icon });
    }
  }
  return shards;
}

/**
 * Normalize raw spectator perks into a structured runes object.
 */
export function normalizeRunes(
  perks: RawPerks,
  statPerks: RawStatPerks | null | undefined,
  runeTrees: Record<string, RuneTree>,
  runeData: Record<string, RuneData>,
): NormalizedRunes {
  const allPerkIds = perks.perkIds ?? [];

  return {
    primaryStyle: lookupTree(runeTrees, perks.perkStyle),
    subStyle: lookupTree(runeTrees, perks.perkSubStyle),
    keystone: lookupRune(runeData, allPerkIds[0]),
    primaryRunes: extractRuneSlots(allPerkIds, 1, 3, runeData),
    secondaryRunes: extractRuneSlots(allPerkIds, 4, 5, runeData),
    shards: resolveShards(statPerks, allPerkIds),
  };
}
