import { execFileSync } from "node:child_process";
import { defineConfig } from "vite";
import packageJson from "./package.json";

const dateVersion = /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/.exec(packageJson.version);
const versionLabel = dateVersion
  ? `${dateVersion[1]}-${dateVersion[2].padStart(2, "0")}-${dateVersion[3].padStart(2, "0")}`
  : packageJson.version;

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
    __APP_VERSION__: JSON.stringify(`${versionLabel} (${getCommitSha()})`),
  },
});
