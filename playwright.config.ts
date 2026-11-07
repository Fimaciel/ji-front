import { defineConfig, devices } from '@playwright/test'

const usarApiRest = process.env.E2E_REST === 'true'
const urlApi = process.env.VITE_API_URL ?? 'http://127.0.0.1:8080'
const urlFront = usarApiRest ? 'http://localhost:5173' : 'http://127.0.0.1:4173'
const hostFront = usarApiRest ? 'localhost' : '127.0.0.1'
const portaFront = usarApiRest ? 5173 : 4173

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: process.env.CI ? 2 : 3,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: urlFront,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'firefox-tablet', use: { ...devices['Desktop Firefox'], viewport: { width: 820, height: 1180 } } },
    { name: 'webkit-mobile', use: { ...devices['iPhone 13'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `VITE_USAR_MOCK=${usarApiRest ? 'false' : 'true'} VITE_API_URL=${urlApi} npm run dev -- --host ${hostFront} --port ${portaFront}`,
    url: urlFront,
    reuseExistingServer: !process.env.CI,
  },
})
