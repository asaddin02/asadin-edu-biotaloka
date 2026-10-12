import { test, expect } from '@playwright/test';
import { mockAPIs, setPrefs, pixel } from './helpers.js';
import { TOPICS, FIELDS } from '../js/data/topics/index.js';
import { ORGANIZATION, BRANCHES } from '../js/data/biomap.js';
import { glossary } from '../js/data/glossary.js';

test('the biology map links levels of organisation, fields and branches, and counts coverage honestly', async ({
  page,
}) => {
  await setPrefs(page);
  await page.goto('/peta');
  await expect(page.locator('h1')).toHaveText('Peta Biologi');
  await expect(page.locator('.org-step')).toHaveCount(ORGANIZATION.length);
  await expect(page.locator('#tingkat-sel .topic-chip').first()).toBeVisible();
  await expect(page.locator('.field-card')).toHaveCount(FIELDS.length);
  await expect(page.locator('.field-topics li')).toHaveCount(TOPICS.length);
  await expect(page.locator('.branch-card')).toHaveCount(BRANCHES.length);
  await expect(page.locator('#cabang-neurosains')).toContainText('Baru dasar-dasarnya');
  await expect(page.locator('.coverage-table tbody tr')).toHaveCount(4);
  await expect(page.locator('.stat-list')).toContainText(String(glossary.length));
  await expect(page.locator('#cakupan')).toContainText('bukan daftar lengkap');
  await page.locator('#tingkat-organ .topic-chip').first().click();
  await expect(page).toHaveURL(/\/learn\//);
});

test('the Learn hub groups lessons by field and every lesson opens', async ({ page }) => {
  test.setTimeout(120000);
  await setPrefs(page, { level: 'kuliah' });
  await page.goto('/learn?all=1');
  await expect(page.locator('.field-group')).toHaveCount(FIELDS.length);
  for (const t of TOPICS) {
    await page.goto(`/learn/${t.id}`);
    await expect(page.locator('#topic-text p').first()).toBeVisible();
    await expect(page.locator('.key-points')).toBeVisible();
    await expect(page.locator('.quiz .quiz-q').first()).toBeVisible();
  }
});

test('lessons are written in four layers with key ideas, and teachers get goals, misconceptions and a differentiation table', async ({
  page,
}) => {
  await setPrefs(page, { level: 'sd', role: 'teacher' });
  await mockAPIs(page);
  await page.goto('/learn/pencernaan');
  const layers = page.locator('.version-switch a');
  await expect(layers).toHaveCount(4);
  await expect(layers.first()).toContainText('Sederhana');
  await expect(page.locator('#topic-text')).toContainText('Usus halus');
  await expect(page.locator('.key-points')).toContainText('mulut → kerongkongan → lambung');
  await page.locator('.version-switch a').filter({ hasText: 'Kuliah' }).click();
  await expect(page.locator('#topic-text')).toContainText('SGLT1');
  const notes = page.locator('.teacher-notes');
  await expect(notes).toHaveAttribute('open', '');
  await expect(notes.locator('.misconception-list li').first()).toContainText('Anggapan keliru');
  await expect(notes.locator('.layer-table tbody tr')).toHaveCount(4);
  await expect(page.locator('.related-list li').first()).toBeVisible();
});

test('lesson lists keep their lead-in line and numbered steps instead of running into one paragraph', async ({
  page,
}) => {
  await setPrefs(page, { level: 'smp' });
  await mockAPIs(page);
  await page.goto('/learn/evolusi');
  const text = page.locator('#topic-text');
  await expect(text.locator('ol li')).toHaveCount(4);
  await expect(text.locator('ol li').first()).toHaveText('Individu dalam satu populasi bervariasi.');
  await page.goto('/learn/sel');
  await expect(text.locator('p', { hasText: 'Ada dua tipe utama sel:' })).toHaveText(
    'Ada dua tipe utama sel:'
  );
  await expect(text.locator('ul li', { hasText: 'Badan Golgi' })).toBeVisible();
  // No bullet marker may survive inside a paragraph.
  for (const p of await text.locator('p').allTextContents()) expect(p).not.toMatch(/\s-\s\S/);
});

test('a curated card photo is shown when the sources have no openly licensed photo', async ({ page }) => {
  await setPrefs(page);
  await mockAPIs(page);
  // Registered after the general mocks, so these win.
  await page.route(
    url => url.pathname === '/v1/taxa/366905',
    route =>
      route.fulfill({
        json: {
          results: [
            { id: 366905, name: 'Toxoplasma gondii', rank: 'species', ancestors: [], taxon_photos: [] },
          ],
        },
      })
  );
  await page.route('https://upload.wikimedia.org/**', route =>
    route.fulfill({ contentType: 'image/jpeg', body: pixel })
  );
  await page.goto('/species/inat-366905');
  await expect(page.locator('h1')).toContainText('Toxoplasma gondii');
  const stage = page.locator('.species-visual .gallery-stage').first();
  await expect(stage.locator('img')).toHaveAttribute('src', /upload\.wikimedia\.org/);
  await expect(stage).toContainText('Wikimedia Commons');
});

test('the new lessons cover protists, arthropods, vertebrates, development, behaviour, parasites, the sea and bioinformatics', async ({
  page,
}) => {
  await setPrefs(page, { level: 'sma' });
  await mockAPIs(page);
  for (const [id, heading, phrase] of [
    ['protista', 'Protista', 'Endosimbiosis sekunder'],
    ['serangga', 'Serangga & artropoda', 'tubulus Malpighi'],
    ['vertebrata', 'Hewan bertulang belakang', 'Telur amniotik'],
    ['pertumbuhan', 'Pertumbuhan & perkembangan', 'Gastrulasi'],
    ['perilaku', 'Perilaku hewan', 'empat pertanyaan'],
    ['parasit', 'Parasit & penyakit tropis', 'Brugia timori'],
    ['laut', 'Kehidupan laut', 'Arus Lintas Indonesia'],
    ['bioinformatika', 'Bioinformatika', 'BLAST'],
  ]) {
    await page.goto(`/learn/${id}`);
    await expect(page.locator('h1')).toContainText(heading);
    await expect(page.locator('#topic-text')).toContainText(phrase);
  }
  await page.goto('/peta');
  await expect(page.locator('#cabang-entomologi')).not.toContainText('Baru dasar-dasarnya');
  await expect(page.locator('#cabang-neurosains')).toContainText('Baru dasar-dasarnya');
});

test('search finds lessons and glossary concepts, not only organisms', async ({ page }) => {
  await setPrefs(page);
  await mockAPIs(page);
  await page.goto('/search?q=mitokondria');
  const knowledge = page.locator('.knowledge-results');
  await expect(knowledge).toBeVisible();
  await expect(knowledge.locator('.knowledge-card').first()).toContainText('Mitokondria');
  await expect(knowledge.locator('.mention-line')).toContainText('Sel: unit kehidupan');

  await page.goto('/');
  const input = page.locator('#hero-q');
  await input.fill('fotosintesis');
  const first = page.getByRole('option').first();
  await expect(first).toContainText('Materi');
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/learn\/fotosintesis$/);
});

test('lesson and term suggestions still appear when the organism API is unreachable', async ({ page }) => {
  await setPrefs(page);
  await mockAPIs(page);
  // Registered last, so it wins over the mocked autocomplete.
  await page.route('**/taxa/autocomplete**', route => route.abort());
  await page.goto('/');
  await page.locator('#hero-q').fill('mitokondria');
  await expect(page.getByRole('option').first()).toContainText('Istilah');
});

test('the genetic code lab translates real β-globin variants', async ({ page }) => {
  await setPrefs(page, { level: 'sma' });
  await page.goto('/lab/genetic');
  await expect(page.locator('.genetic-output')).toContainText('30 asam amino');
  await page.locator('[data-lab-select="preset"]').selectOption('sickle');
  await expect(page.locator('.genetic-output')).toContainText('7 (Glu → Val)');
  await page.locator('[data-lab-select="preset"]').selectOption('cd17');
  await expect(page.locator('.genetic-output')).toContainText('terpotong');
  const area = page.locator('#dna-seq');
  await area.fill('ATGAAATAGCCC');
  await expect(page.locator('.genetic-output')).toContainText('2 asam amino');
  await area.blur();
  await expect(page.locator('[data-lab-select="preset"]')).toHaveValue('custom');
});

test('the enzyme lab shows an optimum and denaturation', async ({ page }) => {
  await setPrefs(page, { level: 'sma' });
  await page.goto('/lab/enzyme');
  await expect(page.locator('.mini-chart')).toHaveCount(2);
  await page.locator('#temp').fill('90');
  await expect(page.locator('#lab-output')).toContainText('denaturasi');
  await page.locator('[data-lab-select="enzyme"]').selectOption('pepsin');
  await expect(page.locator('#lab-output')).toContainText('pH 2');
});
