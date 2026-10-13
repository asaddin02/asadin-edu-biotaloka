// Deterministic fixtures for GBIF, iNaturalist, Wikipedia, PBDB and photos.
export const pixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1sAAAAASUVORK5CYII=',
  'base64'
);

// Same shape as iNaturalist: default_photo has no large_url, taxon_photos entries do.
export const photo = id => ({
  id,
  license_code: 'cc-by',
  attribution: 'CC BY · Example photographer',
  url: `https://images.test/photos/${id}/square.png`,
  square_url: `https://images.test/photos/${id}/square.png`,
  medium_url: `https://images.test/photos/${id}/medium.png`,
});
const taxonPhoto = id => ({ ...photo(id), large_url: `https://images.test/photos/${id}/large.png` });

const ANCESTORS = [
  { id: 1, name: 'Animalia', rank: 'kingdom' },
  { id: 2, name: 'Chordata', rank: 'phylum' },
  { id: 3, name: 'Mammalia', rank: 'class' },
  { id: 4, name: 'Carnivora', rank: 'order' },
  { id: 5, name: 'Felidae', rank: 'family' },
];

export const SPECIAL = {
  39449: {
    name: 'Varanus komodoensis',
    preferred_common_name: 'Biawak Komodo',
    iconic_taxon_name: 'Reptilia',
    conservation_status: { status: 'EN', iucn: 40, authority: 'IUCN Red List' },
  },
  41967: {
    name: 'Panthera tigris',
    preferred_common_name: 'Harimau',
    ancestors: [...ANCESTORS, { id: 6, name: 'Panthera', rank: 'genus' }],
  },
  118552: {
    name: 'Felis catus',
    preferred_common_name: 'Kucing',
    ancestors: [...ANCESTORS, { id: 7, name: 'Felis', rank: 'genus' }],
  },
};

export const taxon = (id, extra = {}) => ({
  id,
  name: `Example species${id}`,
  rank: 'species',
  preferred_common_name: `Creature ${id}`,
  observations_count: 200,
  iconic_taxon_name: 'Mammalia',
  default_photo: photo(id),
  taxon_photos: [{ photo: taxonPhoto(id) }, { photo: taxonPhoto(id + 1) }],
  ancestors: [...ANCESTORS, { id: 9, name: 'Example', rank: 'genus' }],
  ...SPECIAL[id],
  ...extra,
});

export const chain = [
  { key: 1, canonicalName: 'Animalia', rank: 'KINGDOM' },
  { key: 44, canonicalName: 'Chordata', rank: 'PHYLUM' },
  { key: 359, canonicalName: 'Mammalia', rank: 'CLASS' },
  { key: 732, canonicalName: 'Carnivora', rank: 'ORDER' },
  { key: 9703, canonicalName: 'Felidae', rank: 'FAMILY' },
  { key: 2435194, canonicalName: 'Panthera', rank: 'GENUS' },
  { key: 5219416, canonicalName: 'Panthera tigris', rank: 'SPECIES' },
].map(x => ({
  ...x,
  scientificName: x.canonicalName,
  kingdomKey: 1,
  kingdom: 'Animalia',
  taxonomicStatus: 'ACCEPTED',
}));

const json = (route, body, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

/**
 * Intercept every external request. Options change individual responses.
 * Returns an array that collects requested URLs.
 */
export async function mockAPIs(page, opts = {}) {
  const requests = [];
  // A snapshot built on this machine (npm run snapshot) must not replace the fixtures.
  await page.route('**/data/snapshot/**', route => route.fulfill({ status: 404, body: '' }));
  await page.route('https://**/*', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    requests.push(url.href);
    if (url.hostname === 'images.test') {
      if (opts.broken || path.includes('large')) return route.abort();
      return route.fulfill({ contentType: 'image/png', body: pixel });
    }
    if (url.hostname.endsWith('wikipedia.org')) {
      if (opts.wiki && path.includes('/page/summary/'))
        return json(route, {
          extract: 'Ringkasan Wikipedia contoh.',
          type: 'standard',
          title: 'Contoh',
          content_urls: { desktop: { page: 'https://id.wikipedia.org/wiki/Contoh' } },
        });
      return route.fulfill({ status: 503, body: 'unavailable' });
    }
    if (url.hostname === 'paleobiodb.org') {
      return json(route, {
        records: [
          { nam: 'Tyrannosaurus', fea: 83.6, lla: 66 },
          { nam: 'Trilobita', fea: 538.8, lla: 251.9 },
        ],
      });
    }
    if (url.hostname.endsWith('openstreetmap.org') || url.pathname.startsWith('/v2/map'))
      return route.abort();

    if (url.hostname === 'api.gbif.org') {
      if (opts.gbifOutage) return route.fulfill({ status: 503, body: 'down' });
      if (path === '/v1/species/search') {
        const offset = Number(url.searchParams.get('offset') || 0);
        return json(route, {
          count: 25,
          endOfRecords: offset > 0,
          results:
            offset > 0
              ? [{ ...chain.at(-1), key: 999, canonicalName: 'Panthera leo', scientificName: 'Panthera leo' }]
              : [chain.at(-1)],
        });
      }
      if (path === '/v1/species/match')
        return json(route, opts.mismatch ? { matchType: 'EXACT', usageKey: 99 } : { matchType: 'NONE' });
      if (path === '/v1/species/99')
        return json(route, {
          key: 99,
          rank: 'SPECIES',
          canonicalName: 'Different species',
          scientificName: 'Different species',
          nameType: 'SCIENTIFIC',
        });
      if (path === '/v1/occurrence/search') return json(route, { count: 0, results: [] });
      const m = path.match(/^\/v1\/species\/(\d+)(?:\/(\w+))?$/);
      if (m) {
        const key = Number(m[1]);
        const index = chain.findIndex(x => x.key === key);
        const node = chain[index] || {
          key,
          canonicalName: key === 2 ? 'Archaea' : 'Bacteria',
          scientificName: key === 2 ? 'Archaea' : 'Bacteria',
          rank: 'KINGDOM',
          kingdomKey: key,
        };
        if (!m[2]) return json(route, node);
        if (m[2] === 'parents') return json(route, index >= 0 ? chain.slice(0, index) : []);
        if (m[2] === 'children')
          return json(route, {
            results: index >= 0 && index < chain.length - 1 ? [chain[index + 1]] : [],
            endOfRecords: true,
          });
        if (m[2] === 'vernacularNames')
          return json(route, {
            results: [
              { vernacularName: 'Harimau', language: 'ind' },
              { vernacularName: 'Tiger', language: 'eng' },
            ],
          });
        if (m[2] === 'descriptions')
          return json(route, {
            results: [
              {
                type: 'biology_ecology',
                language: 'eng',
                description:
                  'Forests and grasslands with dense cover near water. <script>window.pwned=true</script>',
                source: 'Fixture source',
              },
              {
                type: 'description',
                language: 'eng',
                description: 'Large striped cat with a long tail and powerful forelimbs used to hold prey.',
                source: 'Fixture source',
              },
              {
                type: 'size',
                language: 'eng',
                description: 'Large striped cat with a long tail and powerful forelimbs used to hold prey.',
                source: 'Fixture source',
              },
              { type: 'description', language: 'eng', description: '(Fig. 151)', source: 'Old paper' },
              {
                type: 'materials_examined',
                language: 'eng',
                description: 'COLLECTOR unknown. Specimen in a museum drawer somewhere in Europe.',
                source: 'Old paper',
              },
            ],
          });
        if (m[2] === 'synonyms')
          return json(route, {
            results: [{ scientificName: 'Felis tigris Linnaeus, 1758', taxonomicStatus: 'SYNONYM' }],
          });
        return json(route, { results: [] });
      }
      return json(route, { results: [] });
    }

    if (url.hostname === 'api.inaturalist.org') {
      if (opts.inatOutage) return route.fulfill({ status: 503, body: 'offline' });
      const page = Number(url.searchParams.get('page') || 1);
      const start = (page - 1) * 24;
      const pageOf = total =>
        Array.from({ length: Math.min(24, total - start) }, (_, i) => taxon(start + i + 777));
      if (path === '/v1/taxa/autocomplete') {
        if (opts.empty) return json(route, { total_results: 0, results: [] });
        const species = url.searchParams.get('rank') === 'species';
        return json(route, {
          total_results: species ? 3 : 4,
          results: species
            ? [taxon(777), taxon(778), taxon(779)]
            : [
                { ...taxon(55), rank: 'family', name: 'Culicidae', preferred_common_name: 'Nyamuk' },
                taxon(777),
              ],
        });
      }
      if (path === '/v1/taxa') {
        if (url.searchParams.get('parent_id')) return json(route, { results: [] });
        const total = opts.empty ? 0 : 75;
        return json(route, { total_results: total, results: opts.empty ? [] : pageOf(total) });
      }
      if (path.startsWith('/v1/taxa/'))
        return json(route, {
          results: path
            .split('/')
            .at(-1)
            .split(',')
            .map(id => taxon(Number(id))),
        });
      if (path === '/v1/observations/species_counts') {
        const total = opts.indonesiaEmpty ? 0 : 60;
        return json(route, {
          total_results: total,
          results: Array.from({ length: Math.max(0, Math.min(24, total - start)) }, (_, i) => ({
            count: 50 - i,
            taxon: taxon(start + i + 500),
          })),
        });
      }
      if (path === '/v1/observations')
        return json(route, {
          total_results: opts.noGeo ? 0 : 2,
          results: opts.noGeo
            ? []
            : [
                {
                  id: 1,
                  geojson: { coordinates: [110, -7] },
                  place_guess: 'Java, Indonesia',
                  observed_on: '2026-01-01',
                },
                {
                  id: 2,
                  geojson: { coordinates: [102, 4] },
                  place_guess: 'Malaysia',
                  observed_on: '2026-02-01',
                },
              ],
        });
      if (path === '/v1/places/autocomplete')
        return json(route, { results: [{ id: 6966, name: 'Indonesia', display_name: 'Indonesia' }] });
      return json(route, { results: [] });
    }
    return json(route, { results: [] });
  });
  return requests;
}

/** Start with a chosen learning level (and optionally language) already stored. */
export async function setPrefs(page, { level = 'smp', lang = 'id', role = 'student' } = {}) {
  await page.addInitScript(
    ([l, g, r]) => {
      if (sessionStorage.getItem('prefs-set')) return;
      sessionStorage.setItem('prefs-set', '1');
      localStorage.setItem('biotaloka-level', JSON.stringify(l));
      localStorage.setItem('biotaloka-language', JSON.stringify(g));
      localStorage.setItem('biotaloka-role', JSON.stringify(r));
    },
    [level, lang, role]
  );
}

export const noOverflow = page => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

/** A wide font (as on the CI runner and many Android phones) finds overflow a narrow one hides. */
export const wideFont = page =>
  page.addInitScript(() =>
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = "* { font-family: 'DejaVu Sans', sans-serif !important; }";
      document.head.append(style);
    })
  );
