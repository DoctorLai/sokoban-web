import { execFileSync } from "node:child_process";
import { defineConfig } from "vite";
import packageJson from "./package.json";

const [year, month, day] = packageJson.version.split(".");
const versionDate = [year, month.padStart(2, "0"), day.padStart(2, "0")].join(
  "-",
);

function getCommitSha(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);

  try {
    return execFileSync("git", ["rev-parse", "--short=7", "HEAD"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}

export default defineConfig({
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(`${versionDate} (${getCommitSha()})`),
  },
});
