import { defineConfig, devices } from "@playwright/test";

try {
  process.loadEnvFile(".env.local");
} catch {
  // The variables can also come from the environment.
}

/**
 * Records the landing video and takes the web screenshots with the demo account:
 *   npm run landing:media
 * Then process.sh trims and encodes the video. Output: public/landing/.
 */
export default defineConfig({
  testDir: ".",
  testMatch: "capture.spec.ts",
  workers: 1,
  timeout: 180_000,
  reporter: "list",
  outputDir: "../../test-results/landing-media",
  use: {
    baseURL: "http://localhost:3000",
    locale: "es-ES",
    colorScheme: "dark",
    // The demo account's real data and its look, with motion.
    reducedMotion: "no-preference",
  },
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
  webServer: {
    command: "npm run dev -- --port 3000",
    url: "http://localhost:3000/login",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
