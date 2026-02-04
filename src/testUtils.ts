import type { GameState } from "./types";

/**
 * Build a GameState from ASCII Sokoban map.
 * Supports: # . $ @ * +
 */
export function stateFromAscii(map: string[]): GameState {
  const h = map.length;
  const w = Math.max(...map.map((r: string) => r.length));

  const walls = new Uint8Array(w * h);
  const goals = new Uint8Array(w * h);
  const boxes = new Uint8Array(w * h);
  let player = -1;

  for (let y = 0; y < h; y++) {
    const row = map[y].padEnd(w, " ");
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      const i = y * w + x;
      if (ch === "#") walls[i] = 1;
      if (ch === "." || ch === "*" || ch === "+") goals[i] = 1;
      if (ch === "$" || ch === "*") boxes[i] = 1;
      if (ch === "@" || ch === "+") player = i;
    }
  }

  if (player < 0) throw new Error("Map missing player '@'");
  return { w, h, walls, goals, boxes, player };
}
