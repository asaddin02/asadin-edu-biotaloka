#!/usr/bin/env node
// Resolve scientific names to iNaturalist and GBIF identifiers plus one openly licensed photo.
// Usage: node scripts/resolve-taxa.mjs "Panthera tigris" "Rafflesia arnoldii" > out.json
//        node scripts/resolve-taxa.mjs --file names.txt
// Photos prefer licenses that also allow commercial use (CC0, CC BY, CC BY-SA).
import { readFile } from 'node:fs/promises';

const INAT = 'https://api.inaturalist.org/v1';
const GBIF = 'https://api.gbif.org/v1';
const SAFE = ['cc0', 'cc-by', 'cc-by-sa'];
const OPEN = [...SAFE, 'cc-by-nc', 'cc-by-nc-sa', 'cc-by-nd', 'cc-by-nc-nd'];
const headers = {
  'User-Agent': 'Biotaloka data tooling (+https://github.com/asaddin02/asadin-edu-biotaloka)',
};
let last = 0;

async function inat(path, params = {}) {
  const wait = Math.max(0, last + 1100 - Date.now());
  if (wait) await new Promise(r => setTimeout(r, wait));
  last = Date.now();
  const res = await fetch(`${INAT}/${path}?${new URLSearchParams(params)}`, { headers });
  if (!res.ok) throw new Error(`iNaturalist ${res.status} ${path}`);
  return res.json();
}
async function gbif(path, params = {}) {
  const res = await fetch(`${GBIF}/${path}?${new URLSearchParams(params)}`, { headers });
  if (!res.ok) throw new Error(`GBIF ${res.status} ${path}`);
  return res.json();
}
function bestPhoto(taxon) {
  const photos = [taxon.default_photo, ...(taxon.taxon_photos || []).map(p => p.photo)].filter(Boolean);
  const rank = p => (SAFE.includes(p.license_code) ? 0 : OPEN.includes(p.license_code) ? 1 : 9);
  const sorted = photos.filter(p => rank(p) < 9).sort((a, b) => rank(a) - rank(b));
  const p = sorted[0];
  if (!p) return null;
  const medium = (p.medium_url || p.url || '').replace(/\/(square|small|large|original)\./, '/medium.');
  return {
    id: p.id,
    url: medium,
    license: p.license_code,
    attribution: p.attribution,
    commercialSafe: SAFE.includes(p.license_code),
  };
}

async function resolve(name) {
  const out = { name };
  try {
    const ac = await inat('taxa/autocomplete', { q: name, per_page: 10 });
    const hit = (ac.results || []).find(t => t.name.toLowerCase() === name.toLowerCase());
    if (hit) {
      const full =
        (await inat(`taxa/${hit.id}`, { locale: 'id', preferred_place_id: 6966 })).results?.[0] || hit;
      out.inat = full.id;
      out.rank = full.rank;
      out.iconic = full.iconic_taxon_name;
      out.commonId = full.preferred_common_name || null;
      out.observations = full.observations_count;
      out.status = full.conservation_status?.status || null;
      out.photo = bestPhoto(full);
    } else out.inatMissing = (ac.results || []).slice(0, 3).map(t => t.name);
  } catch (e) {
    out.inatError = e.message;
  }
  try {
    const m = await gbif('species/match', { name });
    out.gbif = m.acceptedUsageKey || m.usageKey || null;
    out.gbifMatch = m.matchType;
    out.gbifName = m.canonicalName;
    out.kingdom = m.kingdom;
  } catch (e) {
    out.gbifError = e.message;
  }
  return out;
}

const args = process.argv.slice(2);
const names =
  args[0] === '--file'
    ? (await readFile(args[1], 'utf8'))
        .split('\n')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('#'))
    : args;
const results = [];
for (const n of names) {
  const r = await resolve(n);
  results.push(r);
  process.stderr.write(
    `${r.inat ? '✓' : '✗'} ${n} inat=${r.inat} gbif=${r.gbif} ${r.photo?.license || 'no-photo'}\n`
  );
}
console.log(JSON.stringify(results, null, 1));
