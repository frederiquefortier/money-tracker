import { defineConfig } from '@playwright/test'
import { STORAGE_STATE } from './e2e/account'

// Runs against a local Supabase stack, in CI (ADR-044). The keys come from
// `supabase status`; e2e/env.ts refuses a non-local URL.
const supabase = {
  SUPABASE_URL: process.env.E2E_SUPABASE_URL ?? '',
  SUPABASE_PUBLISHABLE_KEY: process.env.E2E_PUBLISHABLE_KEY ?? '',
}

export default defineConfig({
  testDir: 'e2e',
  // The import creates what the next test needs, so one worker, in order.
  workers: 1,
  fullyParallel: false,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    // The app picks English from the browser, and the tests read English text.
    locale: 'en-US',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      testMatch: /\.spec\.ts/,
      dependencies: ['setup'],
      use: { browserName: 'chromium', storageState: STORAGE_STATE },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/sign-in',
    reuseExistingServer: !process.env.CI,
    env: supabase,
  },
})
