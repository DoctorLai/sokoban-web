import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      reporter: ["text", "html"],
      // Basic minimums (start low, raise over time)
      thresholds: {
        statements: 83,
        branches: 77,
        functions: 77,
        lines: 86,
      },
      // Optional: don't count trivial files
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/scripts/**",
      ],
    },
  },
});
