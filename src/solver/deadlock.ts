import type { GameState } from "../types";
import { xy, idx } from "../core/grid";

/**
 * Simple (but effective) deadlock checks:
 * 1) Corner deadlock: a box not on a goal stuck in a corner (two perpendicular blocking cells).
 * You can extend this module later with taboo cell precomputation.
 */
export function isCornerDeadlock(s: GameState): boolean {
  const { w, h } = s;

  const blocked = (i: number): boolean => {
    if (i < 0 || i >= w * h) return true;
    return s.walls[i] === 1;
  };

  for (let i = 0; i < w * h; i++) {
    if (!s.boxes[i]) continue;
    if (s.goals[i]) continue; // OK to be stuck on a goal

    const { x, y } = xy(i, w);
    const up = y === 0 ? -1 : idx(x, y - 1, w);
    const down = y === h - 1 ? -1 : idx(x, y + 1, w);
    const left = x === 0 ? -1 : idx(x - 1, y, w);
    const right = x === w - 1 ? -1 : idx(x + 1, y, w);

    const upB = blocked(up);
    const downB = blocked(down);
    const leftB = blocked(left);
    const rightB = blocked(right);

    // box stuck in a corner formed by walls/bounds
    if ((upB && leftB) || (upB && rightB) || (downB && leftB) || (downB && rightB)) {
      return true;
    }
  }
  return false;
}
