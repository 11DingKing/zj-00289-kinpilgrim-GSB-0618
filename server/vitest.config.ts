import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 10000,
    threads: false,
    fileParallelism: false,
  },
});
