import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockAPIs, setPrefs, noOverflow, wideFont } from './helpers.js';

const PAGES = [
  'home',
  'search',
  'tree/1',
  'species/inat-39449',
  'learn',
  'learn/ekosistem',
  'learn/pencernaan',
  'peta',
  'lab/photosynthesis',
  'lab/genetic',
  'lab/enzyme',
  'quiz',
  'purba',
  'kamus',
  'saved?tab=passport',
  'guru',
  'about',
];

for (const level of ['sd', 'smp']) {
  test(`no serious accessibility violations (${level})`, async ({ page }) => {
    test.setTimeout(120000);
    // Without transitions a toast is measured fully shown or fully hidden, never half-faded.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await setPrefs(page, { level });
    await mockAPIs(page);
    const problems = [];
    for (const route of PAGES) {
      await page.goto(`/${route}`);
      await expect(page.locator('#main h1')).toBeVisible();
      await page.waitForTimeout(400);
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .exclude('.leaflet-container')
        .analyze();
      for (const v of result.violations.filter(v => ['serious', 'critical'].includes(v.impact))) {
        problems.push(`${route}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target?.join(' ')}`);
      }
    }
    expect(problems).toEqual([]);
  });
}

test('no horizontal overflow from 320px to 1440px in SD and SMP modes', async ({ page }) => {
  test.setTimeout(240000);
  await wideFont(page);
  await mockAPIs(page);
  for (const level of ['sd', 'smp']) {
    await page.addInitScript(l => localStorage.setItem('biotaloka-level', JSON.stringify(l)), level);
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of [
        'home',
        'search',
        'species/inat-39449',
        'learn/klasifikasi',
        'learn/dna-protein',
        'peta',
        'lab/mendel',
        'lab/genetic',
        'compare?a=41967&b=118552',
        'purba',
        'guru',
        'kamus',
        'tree/1',
        'saved?tab=passport',
        'about',
      ]) {
        await page.goto(`/${route}`);
        await expect(page.locator('#main')).toHaveAttribute('data-page', route.split(/[/?]/)[0]);
        await expect(page.locator('#main h1')).toBeVisible();
        expect(await noOverflow(page), `${level} ${width}px ${route}`).toBe(true);
      }
    }
  }
});

test('bottom navigation on phones does not cover the header', async ({ page }) => {
  await setPrefs(page, { level: 'sd' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/learn');
  const nav = await page.locator('.nav').boundingBox();
  const brand = await page.locator('.header-inner .brand').boundingBox();
  expect(nav.y).toBeGreaterThan(700);
  expect(brand.y).toBeLessThan(80);
  await expect(page.locator('.nav a')).toHaveCount(6);
  await expect(page.locator('.nav a:visible')).toHaveCount(5);
});

test.describe('with the Content Security Policy enforced', () => {
  test.use({ bypassCSP: false });
  test('pages run without CSP violations', async ({ page }) => {
    const violations = [];
    await page.addInitScript(() => {
      document.addEventListener(
        'securitypolicyviolation',
        e => (window.__csp = [...(window.__csp || []), `${e.violatedDirective} ${e.blockedURI}`])
      );
    });
    page.on(
      'console',
      m => m.type() === 'error' && m.text().includes('Content Security Policy') && violations.push(m.text())
    );
    await setPrefs(page);
    for (const route of [
      'home',
      'learn/fotosintesis',
      'peta',
      'lab/selection',
      'lab/enzyme',
      'kamus',
      'purba',
      'guru',
    ]) {
      await page.goto(`/${route}`);
      await expect(page.locator('#main h1')).toBeVisible();
      violations.push(
        ...((await page.evaluate(() => window.__csp)) || []).filter(v => !v.includes('images.test'))
      );
    }
    expect(violations).toEqual([]);
  });
});

test('keyboard users can skip to content, use dialogs and reduced motion is respected', async ({ page }) => {
  await setPrefs(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/learn');
  const heading = await page.locator('#main h1').innerText();
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  // Skipping moves focus only; it must not route to a page called "main".
  expect(new URL(page.url()).pathname).toBe('/learn');
  await expect(page.locator('#main h1')).toHaveText(heading);
  await page.locator('.mode-chip').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  const animation = await page
    .locator('.spinner')
    .evaluateAll(n => n.map(x => getComputedStyle(x).animationName));
  expect(animation.every(a => a === 'none')).toBe(true);
});

test('both languages render every main page', async ({ page }) => {
  await mockAPIs(page);
  await setPrefs(page, { lang: 'en' });
  for (const [route, heading] of [
    ['home', 'Life on Earth.'],
    ['learn', 'Learn your way.'],
    ['peta', 'Map of Biology'],
    ['learn/imun', 'The immune system: body defences'],
    ['lab', 'Where curiosity meets experiments.'],
    ['kamus', 'Biology glossary'],
    ['purba', 'Explore 3.5 billion years of life.'],
    ['guru', 'Biotaloka teacher space'],
  ]) {
    await page.goto(`/${route}`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('#main h1')).toContainText(heading);
  }
});

for (const width of [390, 768, 1440]) {
  test(`page headings scroll away without covering navigation at ${width}px`, async ({ page }) => {
    await setPrefs(page, { level: 'sd' });
    await mockAPIs(page);
    await page.setViewportSize({ width, height: 844 });
    for (const route of ['tree/1', 'learn', 'learn/ekosistem', 'lab/mendel', 'saved?tab=passport']) {
      await page.goto(`/${route}`);
      await expect(page.locator('#main')).toHaveAttribute('data-page', route.split(/[/?]/)[0]);
      const heading = page.locator('#main .page-head');
      await expect(heading).toBeVisible();
      const before = await heading.boundingBox();
      await page.evaluate(() => window.scrollTo(0, 200));
      const scroll = await page.evaluate(() => scrollY);
      const after = await heading.boundingBox();
      expect(scroll).toBeGreaterThan(100);
      expect(Math.abs(after.y - (before.y - scroll)), route).toBeLessThan(2);
      for (const y of [200, 700, 1200]) {
        await page.evaluate(top => window.scrollTo(0, top), y);
        const clear = await page.locator('#header .brand').evaluate(el => {
          const r = el.getBoundingClientRect();
          const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
          return r.y >= 0 && el.contains(hit);
        });
        expect(clear, `${route} at scroll ${y}`).toBe(true);
      }
      await page.locator('#header .mode-chip').click();
      await expect(page.locator('#mode-dialog')).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });
}
