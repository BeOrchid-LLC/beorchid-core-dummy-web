import { defineConfig } from '@playwright/test';

const baseURL = process.env['ACCEPTANCE_BASE_URL'] ?? 'http://localhost:3200';
const storageState = process.env['PLAYWRIGHT_AUTH_STATE'];

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL,
    storageState: storageState || undefined,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
