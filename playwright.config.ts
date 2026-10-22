import { defineConfig, devices } from "@playwright/test";

// Browser tests: a real (invisible) Chrome clicks through Folio like a person would. They run
// against the production build, as the Next.js docs recommend, so build first: CI's build step
// does that, and locally `npm run e2e` builds before testing. Playwright only starts the server.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
