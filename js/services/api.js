// Data access for GBIF, iNaturalist, Wikipedia and the Paleobiology Database.
// Requests are cached in memory, de-duplicated, time-limited and (for iNaturalist) paced. Popular
// responses come from the static snapshot first; the optional proxy falls back to the APIs themselves.
import { config } from '../config.js';
import { lang } from '../core/prefs.js';
import { photosOf } from './media.js';
import { SNAPSHOT_DIR, canonicalURL, snapshotEntry } from './snapshot.js';

const BACKBONE = 'd7dddbf4-2cf0-4f39-9b2a-bb099caae36c';
const MAX_CACHE = 250;
const cache = new Map();
const pending = new Map();
let nextINat = 0;
let proxied = false;
let proxyPausedUntil = 0;
let snapshot = null;
const PROXY_PAUSE = 60000;

export const PAGE_SIZE = config.pageSize;
export const usingProxy = () => proxied;
const proxyActive = () => proxied && Date.now() >= proxyPausedUntil;

export async function initAPI() {
  await Promise.all([detectProxy(), loadSnapshot()]);
}

/**
 * Detect the optional caching proxy (server/server.mjs or the Cloudflare Pages Function).
 * Plain static hosting answers 404. The answer is remembered for the browser session.
 */
async function detectProxy() {
  let known = null;
  try {
    known = sessionStorage.getItem('biotaloka-proxy');
  } catch {
    /* session storage unavailable */
  }
  if (known === '0') return;
  if (known !== '1') {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    try {
      const res = await fetch(config.proxy.health, { signal: controller.signal, cache: 'no-store' });
      const data =
        res.ok && (res.headers.get('content-type') || '').includes('json') ? await res.json() : null;
      known = data?.proxy === true ? '1' : '0';
    } catch {
      known = '0';
    } finally {
      clearTimeout(timer);
    }
    try {
      sessionStorage.setItem('biotaloka-proxy', known);
    } catch {
      /* ignore */
    }
  }
  proxied = known === '1';
}

/** The list of recorded responses (see js/services/snapshot.js). Without it every request goes live. */
async function loadSnapshot() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const res = await fetch(`${SNAPSHOT_DIR}index.json`, { signal: controller.signal, cache: 'no-cache' });
    const index = res.ok ? await res.json() : null;
    if (Array.isArray(index?.keys)) snapshot = new Set(index.keys);
  } catch {
    /* no snapshot on this host */
  } finally {
    clearTimeout(timer);
  }
}

/** The recorded response for a URL, or undefined when the snapshot does not hold it. */
async function fromSnapshot(url) {
  const entry = snapshot && snapshotEntry(url);
  if (!entry || !snapshot.has(entry.key)) return undefined;
  try {
    const res = await fetch(`${SNAPSHOT_DIR}${entry.key}.json`);
    const file = res.ok ? await res.json() : null;
    // Each file names its URL, so a hash collision can never serve another request's data.
    return file?.u === entry.href ? file.d : undefined;
  } catch {
    return undefined;
  }
}

async function fetchJSON(url, timeout) {
  if (url.startsWith(config.endpoints.inat)) {
    // iNaturalist asks clients to stay near one request per second.
    const wait = Math.max(0, nextINat - Date.now());
    nextINat = Math.max(nextINat, Date.now()) + 1050;
    if (wait) await new Promise(r => setTimeout(r, wait));
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw Object.assign(new Error(`HTTP ${response.status}`), { status: response.status });
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function live(url, timeout) {
  const direct = canonicalURL(url);
  if (direct === url) return fetchJSON(url, timeout);
  try {
    return await fetchJSON(url, timeout);
  } catch (error) {
    // "Not found" and "bad request" are real answers. Anything else means the proxy is busy, over
    // its quota or down, so ask the source directly for a while.
    if (error.status === 400 || error.status === 404) throw error;
    proxyPausedUntil = Date.now() + PROXY_PAUSE;
    return fetchJSON(direct, timeout);
  }
}

export async function getJSON(url, { ttl = 300000, timeout = 12000 } = {}) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.time < ttl) return hit.data;
  if (pending.has(url)) return pending.get(url);
  const task = (async () => {
    const recorded = await fromSnapshot(url);
    const data = recorded !== undefined ? recorded : await live(url, timeout);
    cache.set(url, { data, time: Date.now() });
    while (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
    return data;
  })();
  pending.set(url, task);
  try {
    return await task;
  } finally {
    pending.delete(url);
  }
}

const query = params => {
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  return new URLSearchParams(clean).toString();
};
const base = provider => (proxyActive() ? config.proxy : config.endpoints)[provider];
const gbifURL = (path, params = {}) => `${base('gbif')}/${path}?${query(params)}`;
const inatURL = (path, params = {}) => `${base('inat')}/${path}?${query(params)}`;
const gbif = (path, params, options) => getJSON(gbifURL(path, params), options);
const inat = (path, params, options) => getJSON(inatURL(path, params), options);

/** Locale options so iNaturalist returns Indonesian names where they exist. */
const names = (l = lang) =>
  l === 'id' ? { locale: 'id', preferred_place_id: config.indonesiaPlaceId } : { locale: 'en' };

export const scientificName = x =>
  x.nameType === 'INFORMAL' ? x.scientificName : x.canonicalName || x.scientificName;
const same = (a, b) => String(a).toLowerCase().trim() === String(b).toLowerCase().trim();

/** Gallery groups. `taxon` is the iNaturalist id, `kingdom` the GBIF key. */
export const groups = [
  { id: 'all', taxon: '', icon: '✳', label: ['Semua', 'All life'] },
  { id: 'mammals', taxon: 40151, kingdom: 1, icon: '🐘', label: ['Mamalia', 'Mammals'] },
  { id: 'birds', taxon: 3, kingdom: 1, icon: '🐦', label: ['Burung', 'Birds'] },
  { id: 'reptiles', taxon: 26036, kingdom: 1, icon: '🦎', label: ['Reptil', 'Reptiles'] },
  { id: 'amphibians', taxon: 20978, kingdom: 1, icon: '🐸', label: ['Amfibi', 'Amphibians'] },
  { id: 'fish', taxon: 47178, kingdom: 1, icon: '🐟', label: ['Ikan', 'Fish'] },
  { id: 'insects', taxon: 47158, kingdom: 1, icon: '🦋', label: ['Serangga', 'Insects'] },
  { id: 'molluscs', taxon: 47115, kingdom: 1, icon: '🐚', label: ['Moluska', 'Molluscs'] },
  { id: 'plants', taxon: 47126, kingdom: 6, icon: '🌿', label: ['Tumbuhan', 'Plants'] },
  { id: 'fungi', taxon: 47170, kingdom: 5, icon: '🍄', label: ['Jamur', 'Fungi'] },
  { id: 'bacteria', taxon: 67333, kingdom: 3, icon: '🦠', label: ['Bakteri', 'Bacteria'] },
  { id: 'archaea', taxon: 151817, kingdom: 2, icon: '♨️', label: ['Arkea', 'Archaea'] },
];
export const KINGDOM_KEYS = {
  Animalia: 1,
  Archaea: 2,
  Bacteria: 3,
  Chromista: 4,
  Fungi: 5,
  Plantae: 6,
  Protozoa: 7,
};

export const API = {
  /* ---------- GBIF ---------- */
  taxon: key => gbif(`species/${key}`),
  parents: key => gbif(`species/${key}/parents`),
  children: (key, page = 1, limit = 100) =>
    gbif(`species/${key}/children`, { limit, offset: (page - 1) * limit }),
  synonyms: key => gbif(`species/${key}/synonyms`, { limit: 50 }),
  search(q, page = 1, kingdom = '') {
    return gbif('species/search', {
      rank: 'SPECIES',
      status: 'ACCEPTED',
      datasetKey: BACKBONE,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      q,
      highertaxonKey: kingdom,
    });
  },
  async exactGBIF(name) {
    const data = await gbif('species/match', { name, strict: true });
    if (data.matchType !== 'EXACT' || !data.usageKey) return null;
    const taxon = await this.taxon(data.acceptedUsageKey || data.usageKey);
    // Reject informal or fuzzy cross-provider joins; keep the original record instead.
    return taxon.rank === 'SPECIES' && taxon.nameType !== 'INFORMAL' && same(scientificName(taxon), name)
      ? taxon
      : null;
  },

  /* ---------- iNaturalist ---------- */
  /** Name search ordered by relevance (not popularity). Returns up to 30 results. */
  autocomplete(q, { rank = '', taxonId = '', perPage = 30 } = {}) {
    return inat('taxa/autocomplete', {
      q,
      rank,
      taxon_id: taxonId,
      per_page: perPage,
      is_active: true,
      ...names(),
    });
  },
  /** Browse species worldwide, most observed first. */
  browseWorld({ taxonId = '', page = 1, perPage = PAGE_SIZE } = {}) {
    return inat('taxa', {
      rank: 'species',
      is_active: true,
      taxon_id: taxonId,
      per_page: perPage,
      page,
      order_by: 'observations_count',
      ...names(),
    });
  },
  /** Species observed in a place or around coordinates, most observed first. */
  speciesCounts({
    placeId = '',
    taxonId = '',
    lat = '',
    lng = '',
    radius = '',
    page = 1,
    perPage = PAGE_SIZE,
  } = {}) {
    return inat('observations/species_counts', {
      place_id: placeId,
      taxon_id: taxonId,
      lat,
      lng,
      radius,
      quality_grade: 'research',
      page,
      per_page: perPage,
      ...names(),
    });
  },
  async inatByIds(ids) {
    const list = [...new Set(ids.map(Number).filter(Number.isSafeInteger))].slice(0, 30);
    if (!list.length) return [];
    return (await inat(`taxa/${list.join(',')}`, names())).results || [];
  },
  async inatTaxon(id) {
    return (await inat(`taxa/${Number(id)}`, { ...names(), all_names: true })).results?.[0] || null;
  },
  async inatChildren(parentId) {
    return (
      (await inat('taxa', { parent_id: parentId, is_active: true, per_page: 200, ...names() })).results || []
    );
  },
  async inatByName(name, rank = '') {
    const data = await this.autocomplete(name, { rank, perPage: 10 });
    return (data.results || []).find(t => same(t.name, name)) || null;
  },
  places: q => inat('places/autocomplete', { q, per_page: 8 }),
  async resolveCommon(q) {
    try {
      const data = await this.autocomplete(q, { rank: 'species', perPage: 5 });
      const match = data.results?.find(t =>
        [t.preferred_common_name, t.matched_term].some(n => n && same(n, q))
      );
      return match?.name || q;
    } catch {
      return q;
    }
  },
  async photo(name, inatId) {
    let taxon = null;
    if (inatId) taxon = await this.inatTaxon(inatId).catch(() => null);
    if (!taxon) {
      const match = await this.inatByName(name).catch(() => null);
      if (match) taxon = (await this.inatTaxon(match.id).catch(() => null)) || match;
    }
    return taxon ? { taxon, photos: photosOf(taxon) } : { photos: [] };
  },

  /* ---------- Species dossier ---------- */
  async seed(id) {
    if (String(id).startsWith('inat-')) {
      const taxon = await this.inatTaxon(id.slice(5));
      if (!taxon) throw new Error('Taxon unavailable');
      const ancestors = taxon.ancestors || [];
      const kingdom = ancestors.find(a => a.rank === 'kingdom')?.name;
      return {
        taxon: {
          key: id,
          canonicalName: taxon.name,
          scientificName: taxon.name,
          rank: String(taxon.rank).toUpperCase(),
          kingdom,
          kingdomKey: KINGDOM_KEYS[kingdom],
          taxonomicStatus: taxon.is_active === false ? 'INACTIVE' : 'ACCEPTED',
          extinct: !!taxon.extinct,
          source: 'iNaturalist',
        },
        parents: ancestors.map(a => ({
          key: `inat-${a.id}`,
          canonicalName: a.name,
          rank: String(a.rank).toUpperCase(),
          inat: a.id,
        })),
        photo: { taxon, photos: photosOf(taxon) },
        failed: [],
        accessed: new Date().toISOString(),
      };
    }
    const taxon = await this.taxon(id);
    return { taxon, failed: [], accessed: new Date().toISOString() };
  },
  async enrich(seed, { inatId } = {}) {
    const data = { ...seed, failed: [] };
    if (data.taxon.source === 'iNaturalist') {
      const match = await this.exactGBIF(data.taxon.canonicalName).catch(() => null);
      if (match) data.gbifKey = match.key;
    } else data.gbifKey = data.taxon.key;
    const key = data.gbifKey;
    const tasks = {};
    if (key) {
      tasks.parents = this.parents(key);
      tasks.names = gbif(`species/${key}/vernacularNames`, { limit: 1000 });
      tasks.descriptions = gbif(`species/${key}/descriptions`, { limit: 100 });
      tasks.distributions = gbif(`species/${key}/distributions`, { limit: 100 });
    }
    if (!data.photo) tasks.photo = this.photo(scientificName(data.taxon), inatId);
    const entries = Object.entries(tasks);
    const results = await Promise.allSettled(entries.map(([, p]) => p));
    results.forEach((r, i) => {
      const name = entries[i][0];
      if (r.status === 'fulfilled') {
        // Keep iNaturalist ancestry when GBIF parents are unavailable.
        if (name === 'parents' && data.parents && !r.value?.length) return;
        data[name] = r.value;
      } else data.failed.push(name);
    });
    return data;
  },
  async occurrences(data) {
    const key = data.gbifKey || (!String(data.taxon.key).startsWith('inat-') ? data.taxon.key : null);
    let failure = false;
    if (key) {
      try {
        const result = await gbif('occurrence/search', {
          taxon_key: key,
          has_coordinate: true,
          has_geospatial_issue: false,
          occurrence_status: 'PRESENT',
          limit: 300,
        });
        if (result.results?.length || !data.photo?.taxon)
          return { ...result, provider: 'GBIF', taxonKey: key };
      } catch {
        failure = true;
      }
    }
    const id = data.photo?.taxon?.id;
    if (id) {
      const result = await inat('observations', {
        taxon_id: id,
        geo: true,
        per_page: 100,
        order_by: 'observed_on',
        quality_grade: 'research',
      });
      return {
        provider: 'iNaturalist',
        count: result.total_results || 0,
        taxonKey: null,
        fallback: failure,
        results: (result.results || [])
          .filter(r => r.geojson?.coordinates)
          .map(r => ({
            key: r.id,
            decimalLongitude: r.geojson.coordinates[0],
            decimalLatitude: r.geojson.coordinates[1],
            country: r.place_guess,
            eventDate: r.observed_on,
            coordinateUncertaintyInMeters: r.positional_accuracy,
          })),
      };
    }
    if (failure) throw new Error('Occurrence source unavailable');
    return { results: [], count: 0, provider: key ? 'GBIF' : 'iNaturalist', taxonKey: key };
  },
  async wikipedia(name, wikiURL, l = lang) {
    let title = name;
    if (wikiURL) {
      try {
        title = decodeURIComponent(new URL(wikiURL).pathname.split('/wiki/')[1] || name);
      } catch {
        /* keep scientific name */
      }
    }
    const summary = async (host, t) => {
      const d = await getJSON(
        `https://${host}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(t)}`,
        { ttl: 3600000 }
      );
      return d.extract && d.type !== 'disambiguation' ? { ...d, language: host } : null;
    };
    if (l === 'id') {
      try {
        const links = await getJSON(
          `https://en.wikipedia.org/w/api.php?${query({ action: 'query', format: 'json', origin: '*', prop: 'langlinks', lllang: 'id', titles: title, redirects: 1 })}`,
          { ttl: 3600000 }
        );
        const page = Object.values(links.query?.pages || {})[0];
        const idTitle = page?.langlinks?.[0]?.['*'];
        if (idTitle) {
          const d = await summary('id', idTitle);
          if (d) return d;
        }
      } catch {
        /* try the scientific name next */
      }
      try {
        const d = await summary('id', name);
        if (d) return d;
      } catch {
        /* fall back to English */
      }
    }
    return summary('en', title);
  },

  /* ---------- Paleobiology Database ---------- */
  async fossils(namesList) {
    const url = `${config.endpoints.pbdb}/taxa/list.json?${query({ name: namesList.join(','), show: 'app,class' })}`;
    const data = await getJSON(url, { ttl: 86400000 });
    return data.records || [];
  },
};

/** Common names from GBIF vernacular records and iNaturalist, most reliable first. */
export function commonNames(data) {
  const entries = data.names?.results || [];
  const taxon = data.photo?.taxon;
  const get = codes => {
    const filtered = entries.filter(n => codes.includes(n.language));
    const frequency = new Map();
    for (const n of filtered)
      frequency.set(n.vernacularName.toLowerCase(), (frequency.get(n.vernacularName.toLowerCase()) || 0) + 1);
    return filtered
      .sort(
        (a, b) =>
          Number(!!b.isPreferredName) - Number(!!a.isPreferredName) ||
          frequency.get(b.vernacularName.toLowerCase()) - frequency.get(a.vernacularName.toLowerCase())
      )
      .map(n => n.vernacularName);
  };
  const result = { id: get(['ind', 'id']), en: get(['eng', 'en']) };
  for (const n of taxon?.names || []) {
    if (n.lexicon === 'Indonesian') result.id.unshift(n.name);
    if (n.lexicon === 'English') result.en.unshift(n.name);
  }
  if (taxon?.preferred_common_name && lang === 'id' && !result.id.length)
    result.id.push(taxon.preferred_common_name);
  return Object.fromEntries(
    Object.entries(result).map(([k, v]) => [
      k,
      [...new Map(v.map(n => [n.toLowerCase(), n])).values()].slice(0, 3),
    ])
  );
}
