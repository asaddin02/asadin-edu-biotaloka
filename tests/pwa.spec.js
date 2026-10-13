import { test, expect } from '@playwright/test';

test.use({ serviceWorkers: 'allow' });

test('installable manifest and offline lessons through the service worker', async ({ page, context }) => {
  const manifest = await (await page.request.get('/manifest.webmanifest')).json();
  expect(manifest.short_name).toBe('Biotaloka');
  expect(manifest.icons.some(i => i.purpose === 'maskable')).toBe(true);

  await page.addInitScript(() => {
    localStorage.setItem('biotaloka-force-sw', '1');
    localStorage.setItem('biotaloka-level', JSON.stringify('smp'));
  });
  await page.goto('/learn');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(
      async () =>
        page.evaluate(async () => {
          const keys = await caches.keys();
          const app = keys.find(k => k.startsWith('biotaloka-app-'));
          return app ? (await (await caches.open(app)).keys()).length : 0;
        }),
      { timeout: 20000 }
    )
    .toBeGreaterThan(50);

  await context.setOffline(true);
  await expect(page.locator('#net-status')).toBeVisible();
  // A full reload without network is served by the service worker.
  // (Playwright's offline emulation reports navigator.onLine = true after a reload, so the banner is not re-checked.)
  await page.reload();
  await page.goto('/learn/fotosintesis');
  await expect(page.locator('h1')).toHaveText('Tumbuhan & fotosintesis');
  await page.goto('/lab/photosynthesis');
  await expect(page.locator('#lab-output')).toContainText('gelembung');
  await page.goto('/quiz/klasifikasi');
  await expect(page.locator('.quiz-q').first()).toBeVisible();
  await context.setOffline(false);
});

test('a previously installed waiting update is offered on the next visit', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('biotaloka-force-sw', '1');
    const worker = new EventTarget();
    worker.state = 'installed';
    worker.postMessage = data => (window.updateMessage = data);
    const registration = new EventTarget();
    registration.waiting = worker;
    const serviceWorker = new EventTarget();
    serviceWorker.controller = {};
    serviceWorker.register = async () => registration;
    Object.defineProperty(navigator, 'serviceWorker', { value: serviceWorker });
  });
  await page.goto('/learn');
  await expect(page.locator('#update-status')).toBeVisible();
  await page.locator('#update-status button').click();
  expect(await page.evaluate(() => window.updateMessage)).toEqual({ type: 'SKIP_WAITING' });
});
