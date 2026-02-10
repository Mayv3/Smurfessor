import { g as getCached, s as setCached, T as TTL } from './cache_DWePg6Dm.mjs';

const BASE = "https://ddragon.leagueoflegends.com";
async function getLatestVersion() {
  const hit = getCached("ddragon", "version", TTL.DDRAGON);
  if (hit) return hit;
  const res = await fetch(`${BASE}/api/versions.json`);
  const versions = await res.json();
  const latest = versions[0];
  setCached("ddragon", "version", latest, TTL.DDRAGON);
  return latest;
}
async function getChampions(version) {
  const hit = getCached(
    "ddragon",
    "champions",
    TTL.DDRAGON
  );
  if (hit) return hit;
  const res = await fetch(
    `${BASE}/cdn/${version}/data/en_US/champion.json`
  );
  const json = await res.json();
  const map = {};
  for (const val of Object.values(
    json.data
  )) {
    map[val.key] = {
      id: val.id,
      name: val.name,
      key: val.key,
      image: val.image.full
    };
  }
  setCached("ddragon", "champions", map, TTL.DDRAGON);
  return map;
}
async function getSummonerSpells(version) {
  const hit = getCached(
    "ddragon",
    "spells",
    TTL.DDRAGON
  );
  if (hit) return hit;
  const res = await fetch(
    `${BASE}/cdn/${version}/data/en_US/summoner.json`
  );
  const json = await res.json();
  const map = {};
  for (const val of Object.values(
    json.data
  )) {
    map[val.key] = {
      id: val.id,
      name: val.name,
      key: val.key,
      image: val.image.full
    };
  }
  setCached("ddragon", "spells", map, TTL.DDRAGON);
  return map;
}
async function fetchRunes(version) {
  const hitTrees = getCached("ddragon", "runes", TTL.DDRAGON);
  const hitAll = getCached("ddragon", "runeData", TTL.DDRAGON);
  if (hitTrees && hitAll) return { trees: hitTrees, allRunes: hitAll };
  const res = await fetch(`${BASE}/cdn/${version}/data/en_US/runesReforged.json`);
  const json = await res.json();
  const trees = {};
  const allRunes = {};
  for (const tree of json) {
    trees[String(tree.id)] = {
      id: tree.id,
      key: tree.key,
      name: tree.name,
      icon: tree.icon
    };
    for (const slot of tree.slots) {
      for (const rune of slot.runes) {
        allRunes[String(rune.id)] = {
          id: rune.id,
          key: rune.key,
          name: rune.name,
          icon: rune.icon
        };
      }
    }
  }
  setCached("ddragon", "runes", trees, TTL.DDRAGON);
  setCached("ddragon", "runeData", allRunes, TTL.DDRAGON);
  return { trees, allRunes };
}
async function bootstrap() {
  const version = await getLatestVersion();
  const [champions, spells, runesResult] = await Promise.all([
    getChampions(version),
    getSummonerSpells(version),
    fetchRunes(version)
  ]);
  return { version, champions, spells, runes: runesResult.trees, runeData: runesResult.allRunes };
}

export { bootstrap as b };
