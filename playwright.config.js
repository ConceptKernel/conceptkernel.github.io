// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the CKP Ontology Browser.
 *
 * Starts a VitePress dev server on port 5173 and runs
 * smoke tests against the /browse/ SPA.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },

  /* Fail the build on CI if you accidentally left test.only in the source. */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,

  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npx vitepress dev docs --port 5173',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
