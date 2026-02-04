import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      reporter: ["text", "html"],
      // Basic minimums (start low, raise over time)
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 60,
        lines: 70,
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
