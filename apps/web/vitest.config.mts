import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Unit tests of the pure logic (`tests/unit`). The end-to-end tests use Playwright (`tests/e2e`). */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
