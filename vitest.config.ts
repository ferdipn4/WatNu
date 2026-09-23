import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/** Unit tests for the logic that can break quietly (tests/); the smoke test in scripts/ covers the routes end to end. */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
  },
});
