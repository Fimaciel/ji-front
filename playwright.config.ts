import { defineConfig, devices } from '@playwright/test'

const usarApiRest = process.env.E2E_REST === 'true'
const urlApi = process.env.VITE_API_URL ?? 'http://127.0.0.1:8080'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: process.env.CI ? 2 : 3,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'firefox-tablet', use: { ...devices['Desktop Firefox'], viewport: { width: 820, height: 1180 } } },
    { name: 'webkit-mobile', use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `VITE_USAR_MOCK=${usarApiRest ? 'false' : 'true'} VITE_API_URL=${urlApi} npm run dev -- --host 127.0.0.1 --port 4173`,
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
})
