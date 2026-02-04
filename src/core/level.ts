import type { LevelJson, ParsedLevel } from "../types";

/**
 * Parse classic Sokoban ASCII map:
 *  # wall
 *  . goal
 *  $ box
 *  @ player
 *  * box on goal
 *  + player on goal
 *    floor
 */
export function parseLevel(level: LevelJson): ParsedLevel {
  const h = level.map.length;
  const w = Math.max(...level.map.map((r) => r.length));
  const walls = new Uint8Array(w * h);
  const goals = new Uint8Array(w * h);
  const boxes = new Uint8Array(w * h);
  let player = -1;

  for (let y = 0; y < h; y++) {
    const row = level.map[y].padEnd(w, " ");
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      const i = y * w + x;
      if (ch === "#") walls[i] = 1;
      if (ch === "." || ch === "*" || ch === "+") goals[i] = 1;
      if (ch === "$" || ch === "*") boxes[i] = 1;
      if (ch === "@" || ch === "+") player = i;
    }
  }
  if (player < 0) throw new Error(`Level '${level.id}' has no player '@'`);

  return { w, h, walls, goals, boxes, player };
}

export function cloneLevel(p: ParsedLevel): ParsedLevel {
  return {
    w: p.w,
    h: p.h,
    walls: p.walls.slice(),
    goals: p.goals.slice(),
    boxes: p.boxes.slice(),
    player: p.player,
  };
}

export function countBoxes(boxes: Uint8Array): number {
  let c = 0;
  for (let i = 0; i < boxes.length; i++) c += boxes[i] ? 1 : 0;
  return c;
}
