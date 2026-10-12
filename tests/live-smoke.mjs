// Checks the running app against the real GBIF, iNaturalist, Wikipedia and PBDB services and
// captures documentation screenshots (full pages, plus viewport-sized preview-* images for the README).
// Separate from the deterministic suite on purpose.
//   npm run dev            (or any server)   then   npm run smoke
//   BIOTAXA_URL=http://127.0.0.1:8085 npm run smoke
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = (process.env.BIOTAXA_URL || 'http://127.0.0.1:8085').replace(/\/$/, '');
const chrome =
  process.env.CHROME_PATH || (existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined);
const shots = 'docs/screenshots';
await mkdir(shots, { recursive: true });

const browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] });
const report = {
  time: new Date().toISOString(),
  base,
  searches: [],
  galleries: [],
  dossiers: [],
  checks: {},
  errors: [],
};

async function newPage({ level = 'smp', lang = 'id', width = 1440, height = 1000 } = {}) {
  const context = await browser.newContext({ viewport: { width, height } });
  await context.addInitScript(
    ([l, g]) => {
      localStorage.setItem('biotaxa-level', JSON.stringify(l));
      localStorage.setItem('biotaxa-language', JSON.stringify(g));
    },
    [level, lang]
  );
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', e => report.errors.push(`${e.message}`));
  return page;
}
/** Hash navigation keeps the old page for a moment; clear it so waits never see stale content. */
async function go(page, hash) {
  await page
    .evaluate(() => {
      const main = document.querySelector('#main');
      if (main) main.innerHTML = '';
    })
    .catch(() => {});
  await page.goto(`${base}/${hash.replace(/^\//, '')}`);
  await page.locator('#main h1').first().waitFor();
}
async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page
    .locator('main img')
    .evaluateAll(imgs =>
      Promise.all(
        imgs.filter(i => i.getBoundingClientRect().top < innerHeight * 2).map(i => i.decode().catch(() => {}))
      )
    );
}
async function shot(page, name, fullPage = true) {
  await settle(page);
  // Badge toasts are transient; keep them out of documentation images.
  await page
    .waitForFunction(() => !document.querySelector('#toast.show'), {}, { timeout: 6000 })
    .catch(() => {});
  await page.screenshot({ path: `${shots}/${name}.png`, fullPage });
}

try {
  const page = await newPage();
  await go(page, `/home`);
  await page.locator('.hero h1').waitFor();
  await page.locator('.today-card h2').waitFor();
  await shot(page, 'home-desktop');
  await shot(page, 'preview-home', false);

  // Search relevance for words children actually type.
  for (const [q, expected] of [
    ['hiu', /hiu/i],
    ['sapi', /sapi/i],
    ['harimau', /harimau/i],
    ['kupu-kupu', /kupu/i],
  ]) {
    await go(page, `/search?q=${encodeURIComponent(q)}`);
    await page.locator('.discovery-card').first().waitFor();
    const first = await page.locator('.discovery-card h3').first().innerText();
    report.searches.push({ q, first });
    assert.match(first, expected, `search "${q}" should rank a matching name first`);
  }
  await go(page, `/search?q=nyamuk`);
  await page.locator('.matched-groups').waitFor();
  report.checks.nyamukGroup = await page.locator('.matched-groups').innerText();
  assert.match(report.checks.nyamukGroup, /Nyamuk/);
  await shot(page, 'search-nyamuk');

  for (const [group, scope] of [
    ['all', 'id'],
    ['birds', 'id'],
    ['plants', 'id'],
    ['fungi', 'world'],
    ['bacteria', 'world'],
    ['archaea', 'world'],
  ]) {
    await go(page, `/search?group=${group}&scope=${scope}`);
    await page.locator('.discovery-card').first().waitFor();
    await page.waitForFunction(() => document.querySelector('#results')?.dataset.hydrating !== 'true');
    await settle(page);
    const result = {
      group,
      scope,
      shown: await page.locator('.discovery-card').count(),
      summary: await page.locator('.result-head').innerText(),
      first: await page.locator('.discovery-link').first().getAttribute('href'),
      loadedImages: await page
        .locator('.discovery-card img')
        .evaluateAll(imgs => imgs.filter(i => i.complete && i.naturalWidth > 0).length),
    };
    assert.equal(result.shown, 24, `${group}: expected a full page`);
    report.galleries.push(result);
    if (group === 'all') await shot(page, 'gallery-indonesia');
  }

  const firsts = Object.fromEntries(report.galleries.map(g => [g.group, g.first]));
  for (const [label, hash] of [
    ['tiger', '/species/inat-41967'],
    ['komodo', '/species/inat-39449'],
    ['plant', firsts.plants],
    ['fungus', firsts.fungi],
    ['bacterium', firsts.bacteria],
  ]) {
    await go(page, hash);
    await page.locator('.species-intro h1').waitFor();
    await page.locator('#dossier-status').waitFor({ state: 'detached', timeout: 60000 });
    await settle(page);
    const data = {
      label,
      name: await page.locator('h1').innerText(),
      curated: await page.locator('.curated-block').count(),
      heroLoaded: await page
        .locator('.species-visual .gallery-stage img')
        .evaluateAll(imgs => imgs.some(i => i.complete && i.naturalWidth > 0)),
    };
    if (label === 'komodo') {
      await shot(page, 'species-komodo');
      await shot(page, 'preview-species', false);
    }
    await page.getByRole('tab', { name: 'Peta temuan', exact: true }).click();
    await page.waitForFunction(
      () => {
        const m = document.querySelector('#occurrence-map');
        return m?.dataset.points !== undefined || m?.dataset.mapError === 'true';
      },
      {},
      { timeout: 45000 }
    );
    data.mapPoints = Number(await page.locator('#occurrence-map').getAttribute('data-points'));
    data.mapSource = await page.locator('#occurrence-map').getAttribute('data-source');
    assert.ok(data.mapPoints > 0, `${label}: expected occurrence points`);
    report.dossiers.push(data);
    if (label === 'tiger') await shot(page, 'species-map');
  }
  assert.equal(
    report.dossiers.find(d => d.label === 'komodo').curated,
    1,
    'Komodo should show its curated card'
  );

  await go(page, `/purba`);
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[data-pbdb]')].some(d => /–/.test(d.textContent))
  );
  report.checks.pbdb = await page.locator('#fosil-tyrannosaurus [data-pbdb]').innerText();
  await shot(page, 'prehistoric');

  await go(page, `/learn/ekosistem`);
  await shot(page, 'lesson-ecosystem');
  await shot(page, 'preview-lesson', false);
  await go(page, `/lab/selection`);
  await page.getByRole('button', { name: 'Jalankan 10 generasi' }).click();
  await shot(page, 'lab-selection');
  await go(page, `/compare?a=41967&b=118552`);
  await page.locator('.compare-table').waitFor();
  await shot(page, 'compare');
  await go(page, `/guru`);
  await shot(page, 'teacher');
  await page.context().close();

  // A printable lesson plan (teacher notes open), generated on a fresh page.
  const printer = await newPage({ role: 'teacher' });
  await go(printer, '/learn/klasifikasi');
  await printer.emulateMedia({ media: 'print' });
  await printer.locator('.teacher-notes').evaluate(d => (d.open = true));
  await printer.pdf({ path: 'docs/lesson-plan-sample.pdf', format: 'A4', printBackground: true });
  await printer.context().close();

  // Primary-school mode on a phone.
  const kid = await newPage({ level: 'sd', width: 390, height: 844 });
  await go(kid, `/home`);
  await kid.locator('.today-card h2').waitFor();
  await shot(kid, 'home-sd-mobile');
  await shot(kid, 'preview-sd-mobile', false);
  await go(kid, `/tree/1`);
  await kid.locator('.taxon-card').first().waitFor();
  report.checks.sdTreeFirst = await kid.locator('.taxon-card h3').first().innerText();
  assert.match(report.checks.sdTreeFirst, /Hewan bertulang belakang/);
  await shot(kid, 'tree-sd-mobile');
  await go(kid, `/species/inat-569678`);
  await kid.locator('.curated-block').waitFor();
  await shot(kid, 'species-sd-mobile');
  await shot(kid, 'preview-sd-species', false);
  await go(kid, `/quiz/foto`);
  await kid.locator('.game-photo img').waitFor();
  await shot(kid, 'photo-quiz-sd-mobile');
  await kid.context().close();

  const en = await newPage({ lang: 'en', level: 'kuliah' });
  await go(en, `/species/inat-41967`);
  await en.locator('#dossier-status').waitFor({ state: 'detached', timeout: 60000 });
  await en.getByRole('tab', { name: 'Data & references' }).click();
  await en.locator('#synonyms li').first().waitFor();
  await shot(en, 'species-university-en');
  await en.context().close();
} catch (error) {
  report.errors.push(error.message);
  console.error(error);
  process.exitCode = 1;
} finally {
  await writeFile('docs/live-report.json', JSON.stringify(report, null, 2));
  await browser.close();
}
if (report.errors.length) {
  console.error('Errors:', report.errors);
  process.exitCode = 1;
} else
  console.log(
    `Live smoke OK: ${report.searches.length} searches, ${report.galleries.length} galleries, ${report.dossiers.length} dossiers.`
  );
