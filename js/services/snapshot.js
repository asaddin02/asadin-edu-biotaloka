// Static API snapshot: popular GBIF, iNaturalist and PBDB responses recorded nightly by
// scripts/build-snapshot.mjs and served as plain files from the CDN, so most visits never reach the
// rate-limited APIs. Pure functions only: the build script imports this module in Node as well.
import { config } from '../config.js';

export const SNAPSHOT_DIR = '/data/snapshot/';

/** Proxy URLs (api/inat/v1/...) and direct URLs share one key: the upstream URL. */
export function canonicalURL(url) {
  for (const provider of ['gbif', 'inat']) {
    const proxied = config.proxy[provider];
    if (url.startsWith(proxied)) return config.endpoints[provider] + url.slice(proxied.length);
  }
  return url;
}

/** cyrb53 (public domain): a fast 53-bit string hash, written in base 36 as the file name. */
function cyrb53(text) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** Normalised upstream URL and its file key, or null when the URL cannot be parsed. */
export function snapshotEntry(url) {
  try {
    const href = new URL(canonicalURL(url)).href;
    return { href, key: cyrb53(href).toString(36) };
  } catch {
    return null;
  }
}

/**
 * Responses worth recording: shared by many visitors and small enough to ship.
 * Location-based lookups and large occurrence lists stay live.
 */
export function recordable(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  const path = u.pathname;
  if (u.hostname === 'api.inaturalist.org') {
    if (/^\/v1\/taxa(\/[\d,]+|\/autocomplete)?$/.test(path)) return true;
    return path === '/v1/observations/species_counts' && !u.searchParams.has('lat');
  }
  if (u.hostname === 'api.gbif.org')
    return /^\/v1\/species\/(\d+(\/(parents|children|vernacularNames|descriptions|distributions|synonyms))?|match)$/.test(
      path
    );
  if (u.hostname === 'paleobiodb.org') return path === '/data1.2/taxa/list.json';
  return false;
}

// iNaturalist taxon fields the app never reads. They are dropped from recorded responses to keep the
// snapshot small; remove a name here as soon as the app starts using that field.
const UNUSED_TAXON_FIELDS = ['listed_taxa', 'conservation_statuses', 'children'];
const MAX_TAXON_PHOTOS = 12; // photosOf() shows at most 8, some may be filtered out by license

/** A recorded response as stored in the snapshot: unchanged except for unused iNaturalist fields. */
export function slim(url, data) {
  if (!url.startsWith('https://api.inaturalist.org/v1/taxa') || !Array.isArray(data?.results)) return data;
  const results = data.results.map(taxon => {
    const copy = { ...taxon };
    for (const field of UNUSED_TAXON_FIELDS) delete copy[field];
    if (Array.isArray(copy.taxon_photos)) copy.taxon_photos = copy.taxon_photos.slice(0, MAX_TAXON_PHOTOS);
    return copy;
  });
  return { ...data, results };
}
