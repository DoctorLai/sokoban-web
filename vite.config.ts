import { defineConfig } from "vite";

export default defineConfig({
  base: "./", // Important for GitHub Pages
  build: { outDir: "docs" }
});
