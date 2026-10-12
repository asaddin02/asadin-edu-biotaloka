import { test, expect } from '@playwright/test';
import { mockAPIs, setPrefs, taxon } from './helpers.js';
import { slim, snapshotEntry } from '../js/services/snapshot.js';

// The first page of the Indonesian gallery, exactly as js/services/api.js requests it.
const GALLERY =
  'https://api.inaturalist.org/v1/observations/species_counts?place_id=6966&quality_grade=research&page=1&per_page=24&locale=id&preferred_place_id=6966';
const recorded = {
  total_results: 1,
  results: [{ count: 9, taxon: taxon(4242, { preferred_common_name: 'Dari snapshot' }) }],
};

/** Serves data/snapshot/ with the given [url, response, claimedURL?] entries. Registered after mockAPIs. */
async function serveSnapshot(page, entries) {
  const files = new Map(
    entries.map(([url, data, claimed = url]) => {
      const entry = snapshotEntry(url);
      return [entry.key, { u: snapshotEntry(claimed).href, d: data }];
    })
  );
  await page.route('**/data/snapshot/**', route => {
    const name = new URL(route.request().url()).pathname.split('/').pop();
    const body = name === 'index.json' ? { keys: [...files.keys()] } : files.get(name.replace(/\.json$/, ''));
    return body
      ? route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) })
      : route.fulfill({ status: 404, body: '' });
  });
}

test.beforeEach(async ({ page }) => setPrefs(page));

test('recorded responses come from the snapshot instead of the API', async ({ page }) => {
  const requests = await mockAPIs(page);
  await serveSnapshot(page, [[GALLERY, recorded]]);
  await page.goto('/search');
  await expect(page.locator('.discovery-card')).toHaveCount(1);
  await expect(page.locator('.discovery-card')).toContainText('Dari snapshot');
  expect(requests.filter(u => u.includes('/observations/species_counts'))).toEqual([]);
});

test('a snapshot file that names another URL is ignored', async ({ page }) => {
  const requests = await mockAPIs(page);
  await serveSnapshot(page, [[GALLERY, recorded, `${GALLERY}&page=2`]]);
  await page.goto('/search');
  await expect(page.locator('.discovery-card')).toHaveCount(24);
  expect(requests.filter(u => u.includes('/observations/species_counts'))).toHaveLength(1);
});

test('a busy proxy hands requests to the sources directly for a while', async ({ page, baseURL }) => {
  const requests = await mockAPIs(page);
  const proxied = [];
  const origin = new URL(baseURL).origin;
  await page.route(
    url => url.origin === origin && url.pathname.startsWith('/api/'),
    route => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/health')
        return route.fulfill({ contentType: 'application/json', body: '{"ok":true,"proxy":true}' });
      proxied.push(path);
      return route.fulfill({ status: 429, contentType: 'application/json', body: '{"error":"busy"}' });
    }
  );
  await page.goto('/search');
  await expect(page.locator('.discovery-card')).toHaveCount(24);
  expect(proxied.length).toBeGreaterThan(0);
  expect(requests.some(u => u.startsWith('https://api.inaturalist.org/v1/observations/species_counts'))).toBe(
    true
  );
  // While the proxy rests, new pages go straight to the sources (in-app navigation keeps the session).
  const before = proxied.length;
  await page.evaluate(() => import('/js/core/router.js').then(m => m.navigate('/species/inat-39449')));
  await expect(page.locator('h1')).toHaveText('Varanus komodoensis');
  await expect(page.locator('#dossier-status')).toHaveCount(0, { timeout: 20000 });
  expect(proxied).toHaveLength(before);
});

test('recorded taxa keep every field the app reads and drop the rest', () => {
  const full = taxon(41967, {
    listed_taxa: [{ id: 1 }],
    conservation_statuses: [{ status: 'EN' }],
    children: [{ id: 2 }],
    conservation_status: { status: 'EN' },
    names: [{ name: 'Harimau', lexicon: 'Indonesian' }],
    taxon_photos: Array.from({ length: 30 }, (_, i) => ({ photo: { id: i } })),
  });
  const url = 'https://api.inaturalist.org/v1/taxa/41967?locale=id&all_names=true';
  const [kept] = slim(url, { results: [full] }).results;
  for (const field of ['listed_taxa', 'conservation_statuses', 'children'])
    expect(kept).not.toHaveProperty(field);
  expect(kept.taxon_photos).toHaveLength(12);
  for (const field of [
    'name',
    'ancestors',
    'default_photo',
    'names',
    'conservation_status',
    'preferred_common_name',
  ])
    expect(kept[field]).toEqual(full[field]);
  const other = { results: [{ listed_taxa: [1] }] };
  expect(slim('https://api.gbif.org/v1/species/1', other)).toBe(other);
});
