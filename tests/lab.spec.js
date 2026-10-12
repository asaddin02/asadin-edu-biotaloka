import { test, expect } from '@playwright/test';
import { setPrefs } from './helpers.js';

test.beforeEach(async ({ page }) => setPrefs(page, { level: 'sma' }));

test('lever model uses newtons and records experiments that survive reload and language change', async ({
  page,
}) => {
  await page.goto('/lab/lever');
  await expect(page.locator('#lab-output')).toContainText('5 N');
  await page.locator('#armOut').fill('20');
  await expect(page.locator('#lab-output')).toContainText('2,5 N');
  await page.locator('#prediction').fill('Lengan beban lebih panjang mengurangi gaya.');
  await page.getByRole('button', { name: 'Catat hasil model' }).click();
  await expect(page.locator('#experiment-log')).toContainText('2,5 N');
  await page.reload();
  await expect(page.locator('#armOut')).toHaveValue('20');
  await expect(page.locator('#prediction')).toHaveValue('Lengan beban lebih panjang mengurangi gaya.');
  await expect(page.locator('#experiment-log')).toContainText('2,5 N');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.locator('#main')).toContainText('Where curiosity meets experiments.');
  await expect(page.locator('#lab-output')).toContainText('2.5 N');
});

test('photosynthesis names the limiting factor', async ({ page }) => {
  await page.goto('/lab/photosynthesis');
  await page.locator('#light').fill('10');
  await expect(page.locator('#lab-output')).toContainText('cahaya');
  await page.locator('#light').fill('100');
  await page.locator('#co2').fill('15');
  await expect(page.locator('#lab-output')).toContainText('karbon dioksida');
  await page.locator('#temp').fill('48');
  await expect(page.locator('#lab-output strong').first()).toHaveText('0');
});

test('energy flow bars and the food chain game', async ({ page }) => {
  await page.goto('/lab/food');
  await expect(page.locator('#lab-output')).toContainText('100');
  const names = ['Padi', 'Belalang', 'Katak', 'Ular sawah', 'Elang'];
  for (const name of names) await page.locator('[data-chain-pick]').filter({ hasText: name }).click();
  await expect(page.locator('.food-game')).toContainText('Rantai makanan tersusun benar');
});

test('osmosis direction and Mendelian cross', async ({ page }) => {
  await page.goto('/lab/osmosis');
  await expect(page.locator('#lab-output')).toContainText('ke dalam sel');
  await page.locator('#outside').fill('6');
  await expect(page.locator('#lab-output')).toContainText('ke luar sel');
  await page.getByRole('button', { name: /Pewarisan sifat/ }).click();
  await expect(page.locator('.punnett td')).toHaveCount(4);
  await expect(page.locator('#lab-output')).toContainText('ungu 3 : ⚪ putih 1');
  await page.locator('#p2').selectOption('aa');
  await expect(page.locator('#lab-output')).toContainText('ungu 2 : ⚪ putih 2');
  await page.getByRole('button', { name: /Simulasikan/ }).click();
  await expect(page.locator('.sim-result')).toContainText('harapan');
});

test('natural selection runs generations and the scale of life names the tool', async ({ page }) => {
  await page.goto('/lab/selection');
  await page.getByRole('button', { name: 'Jalankan 10 generasi' }).click();
  await expect(page.locator('.lab-headline')).toContainText('Generasi 10');
  await expect(page.locator('.selection-chart circle')).toHaveCount(11);
  await page.getByRole('button', { name: /Skala kehidupan/ }).click();
  await page.locator('#zoom').fill('-6');
  await expect(page.locator('.scale-now')).toContainText('Mikroskop cahaya');
  await page.locator('#zoom').fill('0');
  await expect(page.locator('.scale-now')).toContainText('Mata telanjang');
});
