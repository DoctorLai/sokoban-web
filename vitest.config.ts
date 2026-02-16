import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      reporter: ["text", "html"],
      // Basic minimums (start low, raise over time)
      thresholds: {
        statements: 82,
        branches: 74,
        functions: 78,
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
