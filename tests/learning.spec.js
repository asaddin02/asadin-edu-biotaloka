import { test, expect } from '@playwright/test';
import { mockAPIs, setPrefs } from './helpers.js';
import { TOPICS } from '../js/data/topics/index.js';

test('first visit invites choosing a mode; the choice changes text size and persists', async ({ page }) => {
  await mockAPIs(page);
  await page.goto('/');
  await expect(page.locator('.mode-strip')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-level', 'smp');
  await page
    .locator('.mode-strip')
    .getByRole('radio', { name: /Penjelajah Cilik/ })
    .click();
  await expect(page.locator('html')).toHaveAttribute('data-level', 'sd');
  await expect(page.locator('.mode-strip')).toHaveCount(0);
  const size = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
  expect(size).toBeGreaterThan(17);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-level', 'sd');
  await page.locator('.mode-chip').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page
    .getByRole('dialog')
    .getByRole('radio', { name: /Mode Guru/ })
    .click();
  await expect(page.locator('html')).toHaveAttribute('data-role', 'teacher');
  await expect(page.getByRole('dialog').locator('[data-teacher-level]').first()).toBeVisible();
  await page.getByRole('dialog').locator('[data-teacher-level][value=sma]').check();
  await expect(page.locator('html')).toHaveAttribute('data-level', 'sma');
});

test('lessons adapt to the level; quizzes score and award a badge', async ({ page }) => {
  await setPrefs(page, { level: 'sd' });
  await mockAPIs(page);
  await page.goto('/learn');
  const cards = page.locator('.topic-grid .topic-card');
  await expect(cards.first()).toBeVisible();
  const sdCount = await cards.count();
  await page.getByRole('link', { name: /Tampilkan semua materi/ }).click();
  await expect(page.locator('.topic-grid .topic-card')).toHaveCount(TOPICS.length);
  expect(sdCount).toBe(TOPICS.filter(t => t.levels.includes('sd')).length);
  expect(sdCount).toBeLessThan(TOPICS.length);

  await page.goto('/learn/ekosistem');
  await expect(page.locator('h1')).toHaveText('Ekosistem & rantai makanan');
  await expect(page.locator('#topic-text')).toContainText('padi → belalang → katak → ular → elang');
  await page.getByRole('link', { name: 'SMA Lanjutan', exact: true }).click();
  await expect(page.locator('#topic-text')).toContainText('Produktivitas primer');
  const quiz = page.locator('.quiz');
  const total = await quiz.locator('.quiz-q').count();
  for (let i = 0; i < total; i++)
    await quiz.locator('.quiz-q').nth(i).locator('.quiz-option').first().click();
  await expect(quiz.locator('.quiz-result')).toContainText('Skormu');
  await expect(page.locator('#toast')).toContainText('Lencana baru');
  await page.locator('.teacher-notes summary').click();
  await expect(page.locator('.answer-key li')).toHaveCount(total);
});

test('glossary terms open from lessons and the glossary page filters', async ({ page }) => {
  await setPrefs(page);
  await page.goto('/learn/fotosintesis');
  await page.locator('#topic-text .term').first().click();
  const pop = page.locator('#term-pop');
  await expect(pop).toBeVisible();
  await pop.getByRole('link', { name: /Buka di kamus/ }).click();
  await expect(page.locator('h1')).toHaveText('Kamus istilah biologi');
  await page.locator('#glossary-q').fill('endemik');
  await expect(page.locator('.term-entry:not([hidden])')).toHaveCount(1);
  await expect(page.locator('.term-entry:not([hidden])')).toContainText('Hanya ditemukan');
});

test('compare shows the closest shared group, similarities and differences', async ({ page }) => {
  await setPrefs(page);
  await mockAPIs(page);
  await page.goto('/compare?a=41967&b=118552');
  await expect(page.locator('.shared-line')).toContainText('Famili');
  await expect(page.locator('.shared-line')).toContainText('Felidae');
  await expect(page.locator('.ladder-table tr.shared')).toHaveCount(5);
  await expect(page.locator('.compare-lists')).toContainText(/karnivora/i);
  await expect(page.locator('.compare-lists')).toContainText(
    'Mulai berbeda di tingkat Genus: Panthera dan Felis'
  );
});

test('prehistoric life shows the timeline, Indonesian filter and PBDB ranges', async ({ page }) => {
  await setPrefs(page);
  await mockAPIs(page);
  await page.goto('/purba');
  await expect(page.locator('.timeline-marker').first()).toBeVisible();
  await expect(page.locator('#fosil-tyrannosaurus [data-pbdb]')).toContainText('83,6–66');
  await page.getByRole('link', { name: /Hanya yang ada di Indonesia/ }).click();
  await expect(page.locator('#fosil-homo-floresiensis')).toBeVisible();
  await expect(page.locator('#fosil-tyrannosaurus')).toHaveCount(0);
});

test('near me rounds the location before asking iNaturalist', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: -6.914744, longitude: 107.60981 });
  await setPrefs(page);
  await mockAPIs(page);
  await page.goto('/nearby');
  const request = page.waitForRequest(
    r => r.url().includes('/v1/observations/species_counts') && r.url().includes('lat=')
  );
  await page.getByRole('button', { name: /Gunakan lokasiku/ }).click();
  const url = new URL((await request).url());
  expect(url.searchParams.get('lat')).toBe('-6.91');
  expect(url.searchParams.get('lng')).toBe('107.61');
  await expect(page.locator('.discovery-card')).toHaveCount(24);
  await expect(page.locator('.result-head')).toContainText('radius 5 km');
});

test('teachers create a link assignment; pupils answer and keep their work', async ({ page }) => {
  await setPrefs(page, { role: 'teacher' });
  await mockAPIs(page);
  await page.goto('/guru?topic=ekosistem');
  await page.getByRole('button', { name: /Tambahkan spesies dari materi/ }).click();
  await expect(page.locator('.picked-list li')).not.toHaveCount(0);
  await page.getByRole('button', { name: /Buat tautan tugas/ }).click();
  const link = await page.locator('#assignment-url').inputValue();
  expect(link).toContain('/tugas?d=');
  await page.goto(link);
  await expect(page.locator('h1')).toHaveText('Ekosistem & rantai makanan');
  await expect(page.locator('.assignment-species li').first()).toBeVisible();
  const answer = page.locator('.assignment-questions textarea').first();
  await answer.fill('Jawaban siswa');
  await page.locator('.student-fields input').first().fill('Budi');
  await page.reload();
  await expect(page.locator('.assignment-questions textarea').first()).toHaveValue('Jawaban siswa');
  await expect(page.locator('.student-fields input').first()).toHaveValue('Budi');
  await page.goto('/tugas?d=rusak');
  await expect(page.locator('#main')).toContainText('tidak valid');
});

test('passport tracks progress and data can be exported', async ({ page }) => {
  await setPrefs(page);
  await mockAPIs(page);
  await page.goto('/species/inat-39449');
  await expect(page.locator('#toast')).toContainText('Langkah Pertama');
  await page.goto('/saved?tab=passport');
  await expect(page.locator('.badge-card.earned')).toContainText('Langkah Pertama');
  await expect(page.locator('.stat').first()).toContainText('1');
  await page.goto('/saved?tab=data');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /Unduh cadangan/ }).click();
  expect((await download).suggestedFilename()).toMatch(/^biotaxa-backup-.*\.json$/);
});
