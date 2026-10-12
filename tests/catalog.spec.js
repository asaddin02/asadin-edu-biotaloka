import { test, expect } from '@playwright/test';
import { setPrefs, mockAPIs, noOverflow, wideFont } from './helpers.js';

for (const route of ['learn?all=1', 'quiz']) {
  test(`${route}: filters combine, survive navigation and language changes, and reset from no results`, async ({
    page,
  }) => {
    await setPrefs(page, { level: 'sma' });
    await mockAPIs(page);
    await page.goto(`/${route}`);
    const query = page.getByLabel('Cari materi', { exact: true });
    await page.getByLabel('Bidang biologi', { exact: true }).selectOption('sel');
    await query.fill('DNA');
    await expect(query).toBeFocused();
    const card = page.locator('[data-topic="dna-protein"]');
    await expect(card).toBeVisible();
    await expect(page.locator('#bidang-tubuh')).toBeHidden();
    await card.click();
    await expect(page.locator('#main h1')).toContainText('DNA');
    await page.goBack();
    await expect(query).toHaveValue('DNA');
    await expect(page.locator('#catalog-field')).toHaveValue('sel');
    await page.reload();
    await expect(card).toBeVisible();
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.getByLabel('Find a lesson', { exact: true })).toHaveValue('DNA');
    await expect(page.locator('#catalog-field')).toHaveValue('sel');
    await page.locator('#catalog-q').fill('zzzzzz');
    await expect(page.locator('.catalog-empty')).toBeVisible();
    await expect(page.locator('[data-topic]:visible')).toHaveCount(0);
    await expect(page.locator('.catalog-count')).toContainText('0 of');
    await page.locator('.catalog-empty').getByRole('button', { name: 'Reset' }).click();
    await expect(page.locator('#catalog-q')).toBeFocused();
    await expect(page.locator('#catalog-field')).toHaveValue('');
    await expect(page.locator('.catalog-empty')).toBeHidden();
    await expect(page).not.toHaveURL(/[?&](q|field)=/);
  });
}

test('lesson scope keeps the selected field and search', async ({ page }) => {
  await setPrefs(page);
  await page.goto('/learn?all=1&field=sel&q=DNA');
  await page.getByRole('link', { name: /Hanya materi jenjangku/ }).click();
  await expect(page.locator('#catalog-q')).toHaveValue('DNA');
  await expect(page.locator('#catalog-field')).toHaveValue('sel');
  await expect(page.locator('[data-topic="dna-protein"]')).toBeVisible();
});

test('catalogs fit wide fonts on phones and tablets; the active mobile lab stays in view', async ({
  page,
}) => {
  await setPrefs(page, { level: 'sd' });
  await wideFont(page);
  await mockAPIs(page);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['learn?all=1', 'quiz']) {
      await page.goto(`/${route}`);
      await expect(page.locator('#catalog-q')).toBeVisible();
      expect(await noOverflow(page), `${width}: ${route}`).toBe(true);
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/lab/genetic');
  const active = page.locator('[data-lab="genetic"]');
  await expect(active).toHaveAttribute('aria-pressed', 'true');
  const rect = await active.boundingBox();
  expect(rect.x).toBeGreaterThanOrEqual(0);
  expect(rect.x + rect.width).toBeLessThanOrEqual(390);
  const menu = await page.locator('.lab-tabs').boundingBox();
  expect(menu.height).toBeLessThan(120);
  expect(rect.y + rect.height).toBeLessThan(760);
  await active.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/lab\/selection$/);
  await expect(page.locator('[data-lab="selection"]')).toBeFocused();
});
