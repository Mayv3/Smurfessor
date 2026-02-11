/**
 * Data Dragon helpers — champion icons, spell icons, profile icons.
 * Everything is cached for 24 h server-side.
 */
import { getCached, setCached, TTL } from "../cache";
import type { ChampionData, SpellData, RuneTree, RuneData, DDragonBootstrap } from "./types";

const BASE = "https://ddragon.leagueoflegends.com";

/* ─── Latest patch version ───────────────────────────── */
export async function getLatestVersion(): Promise<string> {
  const hit = getCached<string>("ddragon", "version", TTL.DDRAGON);
  if (hit) return hit;

  const res = await fetch(`${BASE}/api/versions.json`);
  const versions: string[] = await res.json();
  const latest = versions[0];
  setCached("ddragon", "version", latest, TTL.DDRAGON);
  return latest;
}

/* ─── Champions (keyed by numeric key) ───────────────── */
export async function getChampions(
  version: string,
): Promise<Record<string, ChampionData>> {
  const hit = getCached<Record<string, ChampionData>>(
    "ddragon",
    "champions",
    TTL.DDRAGON,
  );
  if (hit) return hit;

  const res = await fetch(
    `${BASE}/cdn/${version}/data/en_US/champion.json`,
  );
  const json = await res.json();
  const map: Record<string, ChampionData> = {};

  for (const val of Object.values(
    json.data as Record<string, Record<string, unknown>>,
  )) {
    map[val.key as string] = {
      id: val.id as string,
      name: val.name as string,
      key: val.key as string,
      image: (val.image as Record<string, string>).full,
    };
  }

  setCached("ddragon", "champions", map, TTL.DDRAGON);
  return map;
}

/* ─── Summoner Spells (keyed by numeric key) ─────────── */
export async function getSummonerSpells(
  version: string,
): Promise<Record<string, SpellData>> {
  const hit = getCached<Record<string, SpellData>>(
    "ddragon",
    "spells",
    TTL.DDRAGON,
  );
  if (hit) return hit;

  const res = await fetch(
    `${BASE}/cdn/${version}/data/en_US/summoner.json`,
  );
  const json = await res.json();
  const map: Record<string, SpellData> = {};

  for (const val of Object.values(
    json.data as Record<string, Record<string, unknown>>,
  )) {
    map[val.key as string] = {
      id: val.id as string,
      name: val.name as string,
      key: val.key as string,
      image: (val.image as Record<string, string>).full,
    };
  }

  setCached("ddragon", "spells", map, TTL.DDRAGON);
  return map;
}

/* ─── URL builders ───────────────────────────────────── */
export function getChampionIconUrl(version: string, imageFull: string): string {
  return `${BASE}/cdn/${version}/img/champion/${imageFull}`;
}

export function getProfileIconUrl(
  version: string,
  profileIconId: number,
): string {
  return `${BASE}/cdn/${version}/img/profileicon/${profileIconId}.png`;
}

export function getSpellIconUrl(version: string, imageFull: string): string {
  return `${BASE}/cdn/${version}/img/spell/${imageFull}`;
}

/* ─── Rune Trees + individual runes (keyed by numeric id) ── */
interface RunesFetchResult {
  trees: Record<string, RuneTree>;
  allRunes: Record<string, RuneData>;
}

async function fetchRunes(version: string): Promise<RunesFetchResult> {
  const hitTrees = getCached<Record<string, RuneTree>>("ddragon", "runes", TTL.DDRAGON);
  const hitAll = getCached<Record<string, RuneData>>("ddragon", "runeData", TTL.DDRAGON);
  if (hitTrees && hitAll) return { trees: hitTrees, allRunes: hitAll };

  const res = await fetch(`${BASE}/cdn/${version}/data/en_US/runesReforged.json`);
  const json: Array<{
    id: number; key: string; name: string; icon: string;
    slots: Array<{ runes: Array<{ id: number; key: string; name: string; icon: string }> }>;
  }> = await res.json();

  const trees: Record<string, RuneTree> = {};
  const allRunes: Record<string, RuneData> = {};

  for (const tree of json) {
    trees[String(tree.id)] = {
      id: tree.id, key: tree.key, name: tree.name, icon: tree.icon,
    };
    for (const slot of tree.slots) {
      for (const rune of slot.runes) {
        allRunes[String(rune.id)] = {
          id: rune.id, key: rune.key, name: rune.name, icon: rune.icon,
        };
      }
    }
  }

  setCached("ddragon", "runes", trees, TTL.DDRAGON);
  setCached("ddragon", "runeData", allRunes, TTL.DDRAGON);
  return { trees, allRunes };
}

/* ─── Bootstrap (all-in-one for client) ──────────────── */

/** Internal implementation — always does real work. */
async function _doBootstrap(): Promise<DDragonBootstrap> {
  const version = await getLatestVersion();
  const [champions, spells, runesResult] = await Promise.all([
    getChampions(version),
    getSummonerSpells(version),
    fetchRunes(version),
  ]);
  return { version, champions, spells, runes: runesResult.trees, runeData: runesResult.allRunes };
}

/**
 * Promise-dedup: concurrent callers share a single in-flight bootstrap.
 * Re-created after DEDUP_TTL so DDragon version refreshes eventually.
 */
let _bsPending: Promise<DDragonBootstrap> | null = null;
let _bsTs = 0;
const BS_DEDUP_TTL = 60 * 60 * 1000; // 1 h

export function bootstrap(): Promise<DDragonBootstrap> {
  const now = Date.now();
  if (_bsPending && now - _bsTs < BS_DEDUP_TTL) return _bsPending;
  _bsPending = _doBootstrap().catch((e) => { _bsPending = null; throw e; });
  _bsTs = now;
  return _bsPending;
}

/* Eagerly start DDragon fetch on module load (pre-warm cold start) */
bootstrap().catch(() => {});
