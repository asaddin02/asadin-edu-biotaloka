import { test, expect } from '@playwright/test';
import { mockAPIs, setPrefs, chain } from './helpers.js';

test.beforeEach(async ({ page }) => setPrefs(page, { level: 'sma' }));

test('tree keeps family and genus down to species; save, reload and switch language', async ({ page }) => {
  await mockAPIs(page);
  await page.goto('/tree');
  await page.locator('.domain-card').filter({ hasText: 'Eukarya' }).click();
  for (const n of chain)
    await page.locator('.taxon-card').filter({ hasText: n.canonicalName }).first().click();
  await expect(page.getByRole('heading', { name: 'Panthera tigris', exact: true })).toBeVisible();
  await expect(page.locator('.names')).toContainText('Harimau');
  await expect(page.locator('.names')).toContainText('Tiger');
  await expect(page.locator('.taxonomy-list li')).toHaveCount(8);
  await expect(page.locator('.taxonomy-list')).toContainText('Felidae');
  await expect(page.locator('#wiki-summary')).toContainText('Ringkasan Wikipedia belum tersedia');
  expect(await page.evaluate(() => window.pwned)).toBeUndefined();

  await page.getByRole('button', { name: /Simpan ke koleksi/ }).click();
  await expect(page.getByRole('button', { name: /Hapus dari koleksi/ })).toBeVisible();
  await page.getByRole('link', { name: 'Koleksi', exact: true }).click();
  await expect(page.locator('.taxon-card')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.taxon-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { name: 'Little discoveries, your own collection.' })).toBeVisible();
});

test('curated group names lead the tree in SD mode and other groups can be revealed', async ({
  page,
  context,
}) => {
  await context.clearCookies();
  await page.addInitScript(() => localStorage.setItem('biotaloka-level', JSON.stringify('sd')));
  await mockAPIs(page);
  await page.route('https://api.gbif.org/v1/species/1/children**', r =>
    r.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        endOfRecords: true,
        results: [
          { key: 50, canonicalName: 'Acanthocephala', rank: 'PHYLUM' },
          { key: 44, canonicalName: 'Chordata', rank: 'PHYLUM' },
          { key: 51, canonicalName: 'Abelisauridae', rank: 'FAMILY' },
        ],
      }),
    })
  );
  await page.goto('/tree/1');
  await expect(page.locator('h1')).toHaveText('Hewan');
  const cards = page.locator('.taxon-grid').first().locator('.taxon-card');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Hewan bertulang belakang');
  await page.getByText(/Tampilkan 2 kelompok lainnya/).click();
  await expect(page.locator('.more-groups .taxon-card')).toHaveCount(2);
  await expect(page.locator('.rank-ladder [aria-current="step"]')).toContainText('Kingdom');
});

test('GBIF index search paginates and shows HTML input as text', async ({ page }) => {
  await mockAPIs(page);
  await page.goto('/search?source=index');
  await page.locator('#explore-q').fill('tiger');
  await page.getByRole('button', { name: 'Cari', exact: true }).click();
  await expect(page.locator('#results')).toContainText('25');
  await page.getByRole('link', { name: /Berikutnya/ }).click();
  await expect(page.locator('.taxon-card')).toContainText('Panthera leo');
  await page.getByRole('link', { name: /Sebelumnya/ }).click();
  await expect(page.locator('.taxon-card')).toContainText('Panthera tigris');
  await page.locator('#explore-q').fill('<img src=x onerror=alert(1)>');
  await page.getByRole('button', { name: 'Cari', exact: true }).click();
  await expect(page.locator('#results .result-head')).toContainText('<img src=x');
  await expect(page.locator('#results img[src="x"]')).toHaveCount(0);
});

test('a source outage offers retry instead of claiming there is no species', async ({ page }) => {
  await mockAPIs(page, { gbifOutage: true });
  await page.goto('/search?q=tiger&source=index');
  await expect(page.getByRole('alert')).toContainText('Sumber data belum dapat dihubungi');
  await expect(page.getByRole('button', { name: 'Coba lagi' })).toBeVisible();
});

test('slow responses never replace the page the learner moved to', async ({ page }) => {
  await mockAPIs(page);
  await page.route('**/v1/species/search?**', async r => {
    await new Promise(done => setTimeout(done, 700));
    await r.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ count: 1, results: [chain.at(-1)] }),
    });
  });
  await page.goto('/search?q=tiger&source=index');
  await page.goto('/lab');
  await page.waitForTimeout(1000);
  await expect(page.locator('#main h1')).toContainText('Rasa ingin tahu, bertemu eksperimen.');
});

test('Bacteria and Archaea branches, empty children, back and forward', async ({ page }) => {
  await mockAPIs(page);
  await page.goto('/tree');
  for (const name of ['Bacteria', 'Archaea']) {
    await page.locator('.domain-card').filter({ hasText: name }).click();
    await page.locator('.taxon-card').click();
    await expect(page.locator('.status')).toContainText('Tidak ada turunan');
    await page.goBack();
    await expect(page.locator('.taxon-card')).toHaveCount(1);
    await page.goForward();
    await expect(page.locator('.status')).toContainText('Tidak ada turunan');
    await page.goto('/tree');
  }
});

test('unknown routes show a friendly page', async ({ page }) => {
  await page.goto('/tidak-ada');
  await expect(page.locator('#main')).toContainText('Halaman tidak ditemukan');
  await expect(page.getByRole('link', { name: 'Kembali ke beranda' })).toBeVisible();
});
