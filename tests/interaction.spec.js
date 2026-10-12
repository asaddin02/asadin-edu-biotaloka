import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockAPIs, setPrefs, noOverflow, taxon } from './helpers.js';

for (const width of [390, 1440]) {
  test(`teacher picker survives repeated choices and keyboard input at ${width}px`, async ({ page }) => {
    await setPrefs(page);
    await mockAPIs(page);
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await page.locator('.mode-chip').click();
    const dialog = page.locator('#mode-dialog');
    await dialog.locator('[data-set-mode="teacher"]').click();
    const picker = dialog.locator('[data-teacher-level][value=sma]');
    await picker.evaluate(node => (window.originalPicker = node));
    for (const level of ['sd', 'kuliah', 'smp', 'sma']) {
      await dialog.locator(`[data-teacher-level][value=${level}]`).check();
      await expect(page.locator('html')).toHaveAttribute('data-level', level);
      await expect(dialog).toBeVisible();
      expect(await picker.evaluate(node => node === window.originalPicker)).toBe(true);
    }
    await picker.focus();
    await page.keyboard.press('ArrowUp');
    await expect(dialog.locator('[data-teacher-level][value=smp]')).toBeFocused();
    await expect(dialog.locator('[data-teacher-level][value=smp]')).toBeChecked();
    expect(await noOverflow(page)).toBe(true);
    const result = await new AxeBuilder({ page }).include('#mode-dialog').analyze();
    expect(result.violations.filter(v => ['serious', 'critical'].includes(v.impact))).toEqual([]);
    await dialog.getByRole('button', { name: 'Selesai' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.locator('.mode-chip')).toBeFocused();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-role', 'teacher');
    await expect(page.locator('html')).toHaveAttribute('data-level', 'smp');
  });
}

test('first-time teacher selection opens the target level picker', async ({ page }) => {
  await mockAPIs(page);
  await page.goto('/');
  await page.locator('.mode-strip [data-set-mode="teacher"]').click();
  await expect(page.locator('#mode-dialog [data-teacher-level]').first()).toBeVisible();
  await page.locator('#mode-dialog [data-teacher-level][value=sd]').check();
  await page.keyboard.press('Escape');
  await expect(page.locator('.mode-chip')).toBeFocused();
  await expect(page.locator('.learning-welcome')).toContainText('SD');
});

for (const dismiss of ['clear', 'Escape', 'Tab']) {
  test(`late search suggestions stay dismissed after ${dismiss}`, async ({ page }) => {
    await mockAPIs(page);
    let release;
    const response = new Promise(resolve => (release = resolve));
    await page.route('**/v1/taxa/autocomplete*', async route => {
      await response;
      await route.fulfill({ json: { results: [taxon(777)] } });
    });
    await page.goto('/');
    const input = page.locator('#hero-q');
    const requested = page.waitForRequest('**/v1/taxa/autocomplete*');
    await input.fill('orangutan');
    await requested;
    if (dismiss === 'clear') await input.fill('');
    else await input.press(dismiss);
    const received = page.waitForResponse('**/v1/taxa/autocomplete*');
    release();
    await received;
    await page.waitForTimeout(100);
    await expect(input).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#hero-q-list')).toBeHidden();
  });
}

test('teacher draft survives section jumps and changes to teaching level', async ({ page }) => {
  await setPrefs(page, { role: 'teacher' });
  await mockAPIs(page);
  await page.goto('/guru');
  const title = page.locator('#assignment-form [name=t]');
  await title.fill('Pengamatan halaman sekolah');
  await page.locator('#assignment-form [name=i]').fill('Amati tiga tumbuhan.');
  await page.locator('[data-jump="teacher-plans"]').click();
  await expect(page).toHaveURL(/\/guru$/);
  await page.locator('[data-jump="builder"]').click();
  await expect(title).toHaveValue('Pengamatan halaman sekolah');
  await page.locator('.mode-chip').click();
  await page.locator('#mode-dialog [data-teacher-level][value=sd]').check();
  await page.locator('#mode-dialog [data-close-dialog]').last().click();
  await expect(title).toHaveValue('Pengamatan halaman sekolah');
  await expect(page.locator('#assignment-form [name=i]')).toHaveValue('Amati tiga tumbuhan.');
});

test('phone layouts keep filters, experiments and lesson navigation usable', async ({ page }) => {
  await setPrefs(page, { level: 'sd' });
  await mockAPIs(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/search');
  await page.locator('.explore-sidebar .group-pill').last().click();
  await expect(page.locator('.explore-sidebar .group-pill').last()).toHaveClass(/selected/);
  expect(await noOverflow(page)).toBe(true);
  await page.goto('/lab/mendel');
  await page.locator('[data-lab="osmosis"]').click();
  await expect(page.locator('[data-lab="osmosis"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#lab-output')).toBeVisible();
  expect(await noOverflow(page)).toBe(true);
  await page.goto('/learn/ekosistem');
  await page.locator('[data-jump="topic-notes"]').click();
  await expect(page.locator('#topic-notes')).toBeFocused();
  await page.locator('#topic-notes').fill('Padi dimakan belalang.');
  await page.locator('[data-jump="quiz"]').click();
  await expect(page.locator('#quiz')).toBeFocused();
  await expect(page.locator('#topic-notes')).toHaveValue('Padi dimakan belalang.');
  expect(await noOverflow(page)).toBe(true);
});
