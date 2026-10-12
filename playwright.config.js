import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

// Uses a system Chrome when available (CHROME_PATH or /usr/bin/google-chrome); otherwise Playwright's Chromium.
const chrome =
  process.env.CHROME_PATH || (existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined);

export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.spec\.js/,
  timeout: 45000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:18765',
    headless: true,
    // Fixture images come from a fake host; the CSP test re-enables the policy explicitly.
    bypassCSP: true,
    // Service workers would bypass request interception; the PWA test allows them explicitly.
    serviceWorkers: 'block',
    locale: 'id-ID',
    launchOptions: { executablePath: chrome, args: ['--no-sandbox'] },
  },
  webServer: {
    // The app server without its proxy: static files plus the shell for every page path.
    command: 'PORT=18765 HOST=127.0.0.1 PROXY=0 node server/server.mjs',
    url: 'http://127.0.0.1:18765',
    reuseExistingServer: !process.env.CI,
  },
});
