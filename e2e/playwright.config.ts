import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // GitHub-hosted ubuntu runners have 4 vCPUs; run in parallel (the tests are
  // I/O-bound on page loads). 1 worker serialized all 58 tests (~24 min).
  workers: process.env.CI ? 4 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4321/',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm --filter @bool/web preview',
    cwd: '..',
    url: 'http://localhost:4321/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
