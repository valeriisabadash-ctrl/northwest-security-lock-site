import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:4173', headless: true, trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:4173', reuseExistingServer: true },
});
