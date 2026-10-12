import { test, expect } from '@playwright/test';
import { mockAPIs, setPrefs } from './helpers.js';

test('an iNaturalist record stays accessible without a GBIF match; photos, lightbox and map work', async ({
  page,
}) => {
  await setPrefs(page);
  const requests = await mockAPIs(page, { mismatch: true });
  const strayRequests = [];
  page.on('request', r => /\/(undefined|null)$/.test(r.url()) && strayRequests.push(r.url()));
  await page.goto('/species/inat-777');
  await expect(page.locator('h1')).toHaveText('Example species777');
  await expect(page.locator('#dossier-status')).toHaveCount(0, { timeout: 20000 });
  // The default photo has no large_url, so the hero derives the large size (which the fixture then fails,
  // exercising the fallback) rather than requesting "…/undefined".
  expect(requests).toContain('https://images.test/photos/777/large.png');
  expect(strayRequests).toEqual([]);
  await page.locator('.source-disclosure summary').first().click();
  await expect(page.locator('.source-disclosure').first()).toContainText('Belum ada kecocokan');
  await expect(page.locator('.taxonomy-list')).toContainText('Animalia');
  await page.locator('.species-visual [data-photo="0"]').click();
  await expect(page.locator('#photo-dialog')).toBeVisible();
  await expect(page.locator('#dialog-photo img')).toHaveJSProperty('naturalWidth', 1);
  await page.keyboard.press('Escape');
  await expect(page.locator('#photo-dialog')).not.toBeVisible();
  await page.getByRole('tab', { name: 'Peta temuan', exact: true }).click();
  await expect(page.locator('#occurrence-map')).toHaveAttribute('data-basemap', 'ready');
  await expect(page.locator('#occurrence-map')).toHaveAttribute('data-points', '2');
  await expect(page.locator('#occurrence-map')).toHaveAttribute('data-source', 'iNaturalist');
  expect(await page.locator('.leaflet-atlas-land-pane path').count()).toBeGreaterThan(150);
  await page.locator('.leaflet-overlay-pane .leaflet-interactive').last().click();
  await expect(page.locator('.leaflet-popup-content')).toBeVisible();
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Occurrence map', exact: true })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  await expect(page.locator('#occurrence-map')).toHaveAttribute('data-basemap', 'ready');
});

test('a species without coordinates still shows the atlas and invents no locations', async ({ page }) => {
  await setPrefs(page);
  await mockAPIs(page, { noGeo: true });
  await page.goto('/species/inat-777?tab=map');
  await expect(page.locator('#occurrence-map')).toHaveAttribute('data-basemap', 'ready');
  await expect(page.locator('#occurrence-map')).toHaveAttribute('data-points', '0', { timeout: 20000 });
  await expect(page.locator('.map-status')).toContainText('lokasi tidak direkayasa');
});

test('broken photos show a fallback and dossier tabs support the keyboard', async ({ page }) => {
  await setPrefs(page);
  await mockAPIs(page, { broken: true });
  await page.goto('/species/inat-777');
  await expect(page.locator('.species-visual .gallery-stage')).toHaveClass(/image-unavailable/);
  await expect(page.locator('.species-visual .image-error-text')).toBeVisible();
  await page.getByRole('tab', { name: 'Ringkasan', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Cara hidup', exact: true })).toBeFocused();
  await expect(page.locator('#panel-facts')).toBeVisible();
});

test('curated card, endemic badge and conservation status in plain words', async ({ page }) => {
  await setPrefs(page);
  await mockAPIs(page);
  await page.goto('/species/inat-39449');
  await expect(page.locator('h1')).toHaveText('Varanus komodoensis');
  await expect(page.locator('.curated-block')).toContainText('Kadal terbesar di dunia');
  await expect(page.locator('.endemic-badge')).toContainText('Hanya ada di Indonesia');
  await expect(page.locator('.status-tag')).toContainText('Genting');
  await expect(page.locator('.status-explain').first()).toContainText('Terancam punah');
  await page.locator('.curated-block .term').first().click();
  await expect(page.locator('#term-pop')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#term-pop')).toBeHidden();
});

test('source descriptions are grouped once, without duplicates or fragments', async ({ page }) => {
  await setPrefs(page, { level: 'sma' });
  await mockAPIs(page);
  await page.goto('/species/5219416?tab=facts');
  const facts = page.locator('#panel-facts');
  await expect(facts.locator('.trait-grid .card')).toHaveCount(2);
  await expect(facts).toContainText('Habitat & cara hidup');
  await expect(facts).toContainText('Bentuk & ciri tubuh');
  await expect(facts.getByText('Large striped cat')).toHaveCount(1);
  await expect(facts).not.toContainText('(Fig. 151)');
  await expect(facts).not.toContainText('museum drawer');
  await expect(facts.getByRole('link', { name: /terjemahan mesin/ }).first()).toBeVisible();
});

test('SD mode leads with the common name and child-friendly tabs', async ({ page }) => {
  await setPrefs(page, { level: 'sd' });
  await mockAPIs(page);
  await page.goto('/species/inat-39449');
  await expect(page.locator('h1')).toHaveText('Komodo');
  await expect(page.locator('.sci-title')).toHaveText('Varanus komodoensis');
  await expect(page.getByRole('tab')).toHaveText(['Kenalan', 'Di mana?', 'Foto', 'Aktivitas']);
  await page.getByRole('tab', { name: 'Aktivitas' }).click();
  const quiz = page.locator('.quick-quiz');
  await expect(quiz.locator('.quiz-q')).toHaveCount(3);
  await quiz.locator('.quiz-q').first().locator('.quiz-option').first().click();
  await expect(quiz.locator('.quiz-feedback').first()).not.toBeEmpty();
});

test('worksheet notes persist after a reload', async ({ page }) => {
  await setPrefs(page);
  await mockAPIs(page);
  await page.goto('/species/inat-777?tab=study');
  await page.locator('#study-notes').fill('Catatan pengamatanku');
  // Reload immediately: pending notes must be flushed when the page is left.
  await page.reload();
  await page.getByRole('tab', { name: 'Belajar' }).click();
  await expect(page.locator('#study-notes')).toHaveValue('Catatan pengamatanku');
  await page.goto('/saved?tab=notes');
  await expect(page.locator('.note-item')).toContainText('Catatan pengamatanku');
});

test('university mode adds synonyms, citations and data downloads', async ({ page }) => {
  await setPrefs(page, { level: 'kuliah' });
  await mockAPIs(page);
  await page.goto('/species/5219416');
  await page.getByRole('tab', { name: 'Data & rujukan' }).click();
  await expect(page.locator('#synonyms')).toContainText('Felis tigris');
  await expect(page.locator('.citations')).toContainText('doi.org/10.15468/39omei');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Unduh BibTeX' }).click();
  expect((await download).suggestedFilename()).toBe('Panthera_tigris.bib');
  const csv = page.waitForEvent('download');
  await page.getByRole('button', { name: /Unduh sampel temuan/ }).click();
  expect((await csv).suggestedFilename()).toMatch(/occurrences_sample\.csv$/);
});
