import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5173' },
  timeout: 60000,
  webServer: {
    command: 'npx vite --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    { name: 'mobile', use: { browserName: 'chromium', channel: 'chrome', viewport: { width: 360, height: 800 } } },
    { name: 'desktop', use: { browserName: 'chromium', channel: 'chrome', viewport: { width: 1440, height: 900 } } },
  ],
})
