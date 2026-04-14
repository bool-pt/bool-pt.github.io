import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4321/bool/',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm --filter @bool/web preview',
    cwd: '..',
    url: 'http://localhost:4321/bool/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
