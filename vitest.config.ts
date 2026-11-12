import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    // The in-memory Postgres and PDF tests take 5-6 s when the machine is busy (a build or install running alongside), which
    // tripped the 5 s default and produced different failures on each run. They pass in ~1 s when idle.
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
})
