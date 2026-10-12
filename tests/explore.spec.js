import { test, expect } from '@playwright/test';
import { mockAPIs, setPrefs } from './helpers.js';

test.beforeEach(async ({ page }) => setPrefs(page));

test('gallery defaults to species observed in Indonesia and paginates', async ({ page }) => {
  await mockAPIs(page);
  const request = page.waitForRequest(
    r =>
      r.url().includes('/v1/observations/species_counts') &&
      new URL(r.url()).searchParams.get('place_id') === '6966'
  );
  await page.goto('/search');
  await request;
  await expect(page.locator('.discovery-card')).toHaveCount(24);
  await expect(page.locator('.result-head')).toContainText('60');
  await expect(page.locator('.result-head')).toContainText('tercatat di Indonesia');
  await page.getByRole('link', { name: /Berikutnya/ }).click();
  await expect(page.locator('.discovery-card').first()).toContainText('Creature 524');
});

test('worldwide scope and group filters use the matching iNaturalist taxon', async ({ page }) => {
  await mockAPIs(page);
  await page.goto('/search');
  await page.getByRole('link', { name: /Seluruh dunia/ }).click();
  await expect(page.locator('.result-head')).toContainText('75');
  const request = page.waitForRequest(
    r => r.url().includes('/v1/taxa?') && new URL(r.url()).searchParams.get('taxon_id') === '67333'
  );
  await page.getByRole('link', { name: /Bakteri/ }).click();
  await request;
  await expect(page.locator('.group-pill.selected')).toContainText('Bakteri');
  // The chosen scope is remembered.
  await page.goto('/search');
  await expect(page.locator('.result-head')).toContainText('terindeks di iNaturalist');
});

test('empty Indonesian results fall back to worldwide data with a notice', async ({ page }) => {
  await mockAPIs(page, { indonesiaEmpty: true });
  await page.goto('/search?group=archaea');
  await expect(page.locator('#results')).toContainText('Belum ada catatan dari Indonesia');
  await expect(page.locator('.discovery-card')).toHaveCount(24);
});

test('name search is ordered by relevance and suggests matching groups', async ({ page }) => {
  await mockAPIs(page);
  const request = page.waitForRequest(
    r => r.url().includes('/v1/taxa/autocomplete') && new URL(r.url()).searchParams.get('rank') === 'species'
  );
  await page.goto('/search?q=nyamuk');
  await request;
  await expect(page.locator('.discovery-card')).toHaveCount(3);
  const groups = page.locator('.matched-groups');
  await expect(groups).toContainText('Nyamuk');
  await expect(groups).toContainText('Culicidae');
  await groups.getByRole('link', { name: /Nyamuk/ }).click();
  await expect(page.locator('.filter-chip')).toContainText('Nyamuk');
});

test('empty searches offer the GBIF index; outages remain distinct', async ({ page }) => {
  await mockAPIs(page, { empty: true });
  await page.goto('/search?q=missing');
  await expect(page.locator('#results')).toContainText('Belum ada spesies yang cocok');
  await expect(page.getByRole('link', { name: /indeks taksonomi GBIF/ })).toHaveAttribute(
    'href',
    /source=index/
  );
  await page.unrouteAll();
  await mockAPIs(page, { inatOutage: true });
  await page.goto('/search?q=offline');
  await expect(page.getByRole('alert')).toContainText('Sumber data belum dapat dihubungi');
});

test('typing shows accessible suggestions that open a species page', async ({ page }) => {
  await mockAPIs(page);
  await page.goto('/');
  const input = page.locator('#hero-q');
  await input.fill('ha');
  await expect(page.getByRole('listbox')).toBeVisible();
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('option').first()).toContainText('Kelompok');
  await input.press('ArrowDown');
  await expect(page.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
  await input.press('ArrowDown');
  await expect(page.getByRole('option').nth(1)).toHaveAttribute('aria-selected', 'true');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/species\/inat-777$/);
});
