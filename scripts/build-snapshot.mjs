#!/usr/bin/env node
// Records the API responses behind BioTaxa's most visited pages into data/snapshot/, so the deployed
// site can serve them as static files instead of sending every visitor to GBIF and iNaturalist.
// The real app runs in a headless browser; each response is stored under the exact URL the app asked
// for (see js/services/snapshot.js). iNaturalist is asked at most once every 1.1 s.
//
//   npm run snapshot              full run (about 20–30 minutes, needs internet)
//   npm run snapshot -- --quick   a few pages of each kind, to check the recorder itself
//
// The previous snapshot is only replaced when the run succeeds.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, rename, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { SPECIES } from '../js/data/species.js';
import { recordable, slim, snapshotEntry } from '../js/services/snapshot.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const OUT = `${root}data/snapshot`;
const TMP = `${root}data/snapshot.tmp`;
const PORT = Number(process.env.SNAPSHOT_PORT || 18901);
const BASE = `http://127.0.0.1:${PORT}`;
const QUICK = process.argv.includes('--quick');
const CONCURRENCY = 4;
const INAT_GAP = 1100;
const USER_AGENT = 'BioTaxa snapshot builder (+https://github.com/asaddin02/asadin-edu-biotaxa)';

// Words children commonly type, on top of every curated species name.
const EXTRA = {
  id: 'kucing anjing ayam bebek sapi kambing kerbau kuda gajah harimau singa jerapah monyet ular buaya kura-kura penyu katak ikan hiu paus lumba-lumba burung elang merpati kupu-kupu semut lebah nyamuk lalat kecoak capung belalang laba-laba cacing siput kepiting udang cumi-cumi gurita ubur-ubur bintang laut jamur padi jagung pisang mangga kelapa mawar anggrek kaktus bambu lumut paku',
  en: 'cat dog chicken duck cow goat horse elephant tiger lion giraffe monkey snake crocodile turtle frog fish shark whale dolphin bird eagle pigeon butterfly ant bee mosquito fly cockroach dragonfly grasshopper spider worm snail crab shrimp squid octopus jellyfish starfish mushroom rice corn banana mango coconut rose orchid cactus bamboo moss fern',
};
const TREE = ['', 1, 2, 3, 4, 5, 6, 7, 44, 54, 52, 7707728, 359, 212, 216, 358, 131, 204, 220];

const take = list => (QUICK ? list.slice(0, 3) : list);
const unique = list => [...new Map(list.map(x => [x.toLowerCase(), x])).values()];

/* ---------- Upstream access: paced, recorded ---------- */
const recorded = new Map();
let nextINat = 0;
let inatQueue = Promise.resolve();
const inflight = new Map();
const stats = { fetched: 0, failed: 0 };

function paceINat() {
  const turn = inatQueue.then(async () => {
    const wait = Math.max(0, nextINat - Date.now());
    if (wait) await new Promise(r => setTimeout(r, wait));
    nextINat = Date.now() + INAT_GAP;
  });
  inatQueue = turn.catch(() => {});
  return turn;
}

async function upstream(route) {
  const url = route.request().url();
  const host = new URL(url).hostname;
  for (let attempt = 0; attempt < 2; attempt++) {
    if (host === 'api.inaturalist.org') await paceINat();
    const headers = { ...route.request().headers(), 'user-agent': USER_AGENT };
    const response = await route.fetch({ headers, timeout: 30000 });
    if (response.status() === 429 && attempt === 0) {
      console.warn('iNaturalist asked us to slow down; pausing for a minute.');
      nextINat = Date.now() + 60000;
      continue;
    }
    return response;
  }
}

async function handle(route) {
  const page = route.request().frame().page();
  inflight.set(page, (inflight.get(page) || 0) + 1);
  try {
    const response = await upstream(route);
    const body = await response.body();
    const url = route.request().url();
    stats.fetched++;
    if (
      response.status() === 200 &&
      /json/.test(response.headers()['content-type'] || '') &&
      recordable(url)
    ) {
      const entry = snapshotEntry(url);
      if (entry)
        recorded.set(entry.href, {
          key: entry.key,
          data: slim(entry.href, JSON.parse(body.toString('utf8'))),
        });
    }
    await route.fulfill({ response, body });
  } catch {
    stats.failed++;
    await route.abort().catch(() => {});
  } finally {
    inflight.set(page, inflight.get(page) - 1);
    page.lastActivity = Date.now();
  }
}

/** Wait until the page has had no API request in flight for 1.5 s. */
async function settled(page, max = 90000) {
  const start = Date.now();
  while (Date.now() - start < max) {
    if (!inflight.get(page) && Date.now() - (page.lastActivity || start) > 1500) return true;
    await new Promise(r => setTimeout(r, 250));
  }
  return false;
}

/* ---------- Browser ---------- */
async function newContext(browser, { lang, level }) {
  // Service workers would fetch outside the routes below, so they stay off while recording.
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    serviceWorkers: 'block',
  });
  await context.addInitScript(
    ([g, l]) => {
      localStorage.setItem('biotaxa-language', JSON.stringify(g));
      localStorage.setItem('biotaxa-level', JSON.stringify(l));
    },
    [lang, level]
  );
  // Direct API mode (no proxy), no old snapshot, no images or Wikipedia: only GBIF/iNat/PBDB matter.
  await context.route(/\/api\/health$|\/data\/snapshot\//, r => r.fulfill({ status: 404, body: '' }));
  await context.route(/^https:\/\/(api\.inaturalist\.org|api\.gbif\.org|paleobiodb\.org)\//, handle);
  await context.route(/^https:\/\/[^/]*wikipedia\.org\//, r => r.fulfill({ status: 404, body: '' }));
  await context.route('**/*', r =>
    ['image', 'media'].includes(r.request().resourceType()) ? r.abort() : r.fallback()
  );
  return context;
}

async function visit(page, hash) {
  page.lastActivity = Date.now();
  await page.evaluate(h => {
    document.querySelector('#main')?.replaceChildren();
    history.pushState(null, '', h);
    dispatchEvent(new PopStateEvent('popstate'));
  }, hash);
  await page.locator('#main h1').first().waitFor({ timeout: 30000 });
  if (hash.startsWith('/species/'))
    await page.locator('#dossier-status').waitFor({ state: 'detached', timeout: 90000 });
  if (!(await settled(page))) throw new Error('requests did not settle');
}

async function runBatch(browser, prefs, hashes) {
  const context = await newContext(browser, prefs);
  const queue = [...hashes];
  const failures = [];
  let done = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      const page = await context.newPage();
      page.setDefaultTimeout(30000);
      await page.goto(`${BASE}/about`);
      await page.locator('#main h1').waitFor();
      while (queue.length) {
        const hash = queue.shift();
        try {
          await visit(page, hash);
        } catch (error) {
          failures.push(`${prefs.lang}/${prefs.level} ${hash}: ${error.message.split('\n')[0]}`);
        }
        if (++done % 25 === 0)
          console.log(
            `  ${prefs.lang}/${prefs.level}: ${done}/${hashes.length} pages, ${recorded.size} responses`
          );
      }
    })
  );
  await context.close();
  return failures;
}

async function groupIds(browser) {
  const context = await newContext(browser, { lang: 'id', level: 'smp' });
  const page = await context.newPage();
  await page.goto(`${BASE}/search`);
  await page.locator('#main h1').waitFor();
  const ids = await page
    .locator('a[href*="group="]')
    .evaluateAll(links => links.map(a => new URLSearchParams(a.search).get('group')));
  await context.close();
  return [...new Set(ids.filter(Boolean))];
}

/* ---------- Run ---------- */
function startServer() {
  const child = spawn(process.execPath, ['server/server.mjs'], {
    cwd: root,
    env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1', LOG: '' },
    stdio: 'ignore',
  });
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const poll = async () => {
      try {
        if ((await fetch(`${BASE}/index.html`)).ok) return resolve(child);
      } catch {
        /* not ready */
      }
      if (Date.now() - started > 10000) return reject(new Error('app server did not start'));
      setTimeout(poll, 150);
    };
    poll();
  });
}

const server = await startServer();
const chrome =
  process.env.CHROME_PATH || (existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined);
const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] });
const started = Date.now();
const failures = [];
let visited = 0;
try {
  const groups = await groupIds(browser);
  if (!groups.length) throw new Error('no gallery groups found on the explore page');
  const gallery = [];
  for (const group of take(groups))
    for (const scope of ['id', 'world'])
      for (const page of QUICK ? [1] : [1, 2])
        gallery.push(`/search?group=${group}&scope=${scope}&page=${page}`);
  const species = take(SPECIES).map(s => `/species/${s.id}`);
  const tree = take(TREE).map(k => `/tree${k ? `/${k}` : ''}`);
  const searches = lang =>
    take(unique([...SPECIES.map(s => s.name[lang === 'id' ? 0 : 1]), ...EXTRA[lang].split(' ')])).map(
      q => `/search?q=${encodeURIComponent(q)}`
    );

  const batches = [
    [{ lang: 'id', level: 'smp' }, [...gallery, ...species, ...tree, '/purba', ...searches('id')]],
    [{ lang: 'en', level: 'smp' }, [...gallery, ...species, ...tree, '/purba', ...searches('en')]],
    [{ lang: 'id', level: 'sd' }, tree],
    [{ lang: 'en', level: 'sd' }, tree],
  ];
  for (const [prefs, hashes] of batches) {
    console.log(`${prefs.lang}/${prefs.level}: ${hashes.length} pages`);
    visited += hashes.length;
    failures.push(...(await runBatch(browser, prefs, hashes)));
  }
} finally {
  await browser.close();
  server.kill();
}

const minutes = ((Date.now() - started) / 60000).toFixed(1);
console.log(
  `Visited ${visited} pages in ${minutes} min: ${stats.fetched} API responses, ${recorded.size} recorded, ${failures.length} page failures.`
);
failures.slice(0, 20).forEach(f => console.warn(`  failed ${f}`));
if (failures.length > visited * 0.1 || recorded.size < (QUICK ? 10 : 300)) {
  console.error('Snapshot incomplete; the previous snapshot is kept.');
  process.exit(1);
}

await rm(TMP, { recursive: true, force: true });
await mkdir(TMP, { recursive: true });
for (const [href, { key, data }] of recorded)
  await writeFile(`${TMP}/${key}.json`, JSON.stringify({ u: href, d: data }));
const keys = [...recorded.values()].map(x => x.key);
await writeFile(
  `${TMP}/index.json`,
  JSON.stringify({ version: 1, generated: new Date().toISOString(), count: keys.length, keys })
);
await rm(OUT, { recursive: true, force: true });
await rename(TMP, OUT);
console.log(`Snapshot written to data/snapshot/ (${keys.length} responses).`);
