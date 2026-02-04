/**
 * Offline level generator (Node).
 * Generates solvable Sokoban levels using reverse pull moves and stores JSON under src/levels/generated/.
 *
 * Usage:
 *   npm install
 *   npm run gen:levels
 *
 * Notes:
 * - This script reuses the same logic as the browser generator, but runs in Node for batch generation.
 * - You can commit the generated JSON files, then add them to src/levels/index.ts.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { LevelJson } from "../src/types";
import { DEFAULT_ARENA } from "../src/generator/generate";
import { generateOne } from "../src/generator/generate";

async function main() {
  const outDir = join(process.cwd(), "src/levels/generated");
  mkdirSync(outDir, { recursive: true });

  const want = 20;
  let made = 0;

  // You can tune these knobs:
  const boxCount = 3;
  const reverseSteps = 80;
  const targetPushRange: [number, number] = [10, 35];

  for (let i = 0; i < 2000 && made < want; i++) {
    const g = await generateOne(
      DEFAULT_ARENA as LevelJson,
      boxCount,
      reverseSteps,
      targetPushRange,
    );
    if (!g) continue;

    const filename = join(outDir, `${g.level.id}.json`);
    writeFileSync(filename, JSON.stringify(g.level, null, 2), "utf-8");
    made++;
    console.log(`Generated: ${g.level.id}  pushes=${g.pushes}`);
  }

  console.log(`Done. Generated ${made}/${want} levels in ${outDir}`);
  console.log(`Now: import them in src/levels/index.ts to show in UI.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
