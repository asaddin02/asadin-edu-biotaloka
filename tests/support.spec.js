import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockAPIs, setPrefs, noOverflow, wideFont } from './helpers.js';

test('support is reachable, optional, responsive and honest when no destination is configured', async ({
  page,
}) => {
  await wideFont(page);
  await setPrefs(page, { level: 'sd' });
  await mockAPIs(page);
  await page.goto('/');
  await page.evaluate(async () => {
    const { config } = await import('/js/config.js');
    config.donateURL = '';
    config.donateLocalURL = '';
    config.donateInternationalURL = '';
  });
  await page.locator('.support-banner a').click();
  await expect(page.locator('h1')).toHaveText('Bantu rasa ingin tahu terus tumbuh.');
  await expect(page.locator('.support-donation')).toContainText('Donasi uang belum tersedia.');
  await expect(page.locator('[data-donate]')).toHaveCount(0);
  await expect(page.locator('.support-ways')).toContainText('Gunakan dalam kegiatan belajar');
  await expect(page.locator('.support-ways a[href*="github"]')).toHaveCount(1);
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await noOverflow(page)).toBe(true);
  }
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter(v => ['serious', 'critical'].includes(v.impact))).toEqual([]);
  await page.locator('[data-lang=en]').click();
  await expect(page.locator('.support-donation')).toContainText('Monetary donations are not available yet.');
  await page.locator('.support-promise a').click();
  await expect(page.locator('#main')).toHaveAttribute('data-page', 'learn');
  await page.locator('#footer a[href="/dukung"]').click();
  await expect(page.locator('#main')).toHaveAttribute('data-page', 'dukung');
});

test('configured donations link to the exact HTTPS destination without embedding a checkout', async ({
  page,
}) => {
  await mockAPIs(page);
  await page.goto('/');
  await page.evaluate(async () => {
    const { config } = await import('/js/config.js');
    config.donateLocalURL = '';
    config.donateInternationalURL = '';
    config.donateURL = 'https://example.org/biotaloka?ref=support';
  });
  await page.locator('#footer a[href="/dukung"]').click();
  const link = page.locator('[data-donate]');
  await expect(link).toHaveAttribute('href', 'https://example.org/biotaloka?ref=support');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(page.locator('#main iframe, #main input')).toHaveCount(0);
  await expect(page.locator('.support-donation')).toContainText('example.org');
});

test('invalid payment destinations never produce a donation button', async ({ page }) => {
  await page.goto('/');
  for (const value of [
    'javascript:alert(1)',
    'http://example.org',
    '/donate',
    'https://user:password@example.org',
  ]) {
    await page.evaluate(async url => {
      const { config } = await import('/js/config.js');
      const { render } = await import('/js/core/router.js');
      config.donateLocalURL = '';
      config.donateInternationalURL = '';
      config.donateURL = url;
      history.replaceState(null, '', '/dukung');
      await render();
    }, value);
    await expect(page.locator('.support-donation')).toBeVisible();
    await expect(page.locator('[data-donate]')).toHaveCount(0);
  }
});

test('local and international channels remain explicit, accessible and independent', async ({ page }) => {
  await wideFont(page);
  await setPrefs(page, { level: 'sd' });
  await mockAPIs(page);
  await page.goto('/');
  await page.locator('#footer a[href="/dukung"]').click();
  const local = page.getByRole('link', { name: /halaman donasi.*Indonesia/ });
  const global = page.getByRole('link', { name: /halaman donasi.*internasional/ });
  await expect(local).toHaveAttribute('href', 'https://saweria.co/asadin02');
  await expect(global).toHaveAttribute('href', 'https://ko-fi.com/asadin02');
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await noOverflow(page)).toBe(true);
  }
  await page.getByText('Bukti pembayaran dan kendala transaksi', { exact: true }).click();
  await expect(page.locator('.support-help details')).toHaveAttribute('open', '');
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter(v => ['serious', 'critical'].includes(v.impact))).toEqual([]);
  await page.locator('[data-lang=en]').click();
  await expect(page.getByRole('link', { name: /donation page.*International/ })).toBeVisible();
  await page.evaluate(async () => {
    const { config } = await import('/js/config.js');
    const { render } = await import('/js/core/router.js');
    config.donateLocalURL = 'javascript:alert(1)';
    await render();
  });
  await expect(page.locator('[data-donate]')).toHaveCount(1);
  await expect(page.locator('[data-donate]')).toHaveAttribute('href', 'https://ko-fi.com/asadin02');
});
