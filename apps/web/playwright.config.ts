import { defineConfig, devices } from "@playwright/test";

// The tests talk to the Supabase project in .env.local (temporary accounts, deleted after each test).
try {
  process.loadEnvFile(".env.local");
} catch {
  // In CI the variables come from the environment.
}

/** End-to-end tests of the main flows, in Chrome, against the dev server. */
export default defineConfig({
  testDir: "./tests/e2e",
  // One at a time: every test creates real accounts in the shared Supabase project.
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:3000",
    locale: "es-ES",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1280, height: 800 } } }],
  webServer: {
    command: "npm run dev -- --port 3000",
    url: "http://localhost:3000/login",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
