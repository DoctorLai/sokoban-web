import type { GameState } from "../types";
import { xy, idx } from "../core/grid";

/**
 * Precompute "dead squares": cells from which a box can never reach any goal,
 * determined by backward reachability (pulling boxes from goals through walls-only topology).
 * Returns a Uint8Array where dead[i] = 1 means a box placed at cell i is a positional deadlock.
 */
export function computeDeadSquares(level: GameState): Uint8Array {
  const { w, h, walls, goals } = level;
  const N = w * h;

  // live[i] = 1: a box at cell i can potentially reach a goal
  const live = new Uint8Array(N);
  const q = new Int32Array(N);
  let qs = 0,
    qe = 0;

  // Seed: all non-wall goal cells are live
  for (let i = 0; i < N; i++) {
    if (goals[i] && !walls[i]) {
      live[i] = 1;
      q[qe++] = i;
    }
  }

  // Backward BFS: a box was at cell B and was pushed (in direction dir) to the live cell D.
  //   B = D - dir  (box's previous position)
  //   P = B - dir  (player position required to make the push)
  // Both B and P must not be walls.
  const DX = [0, 0, -1, 1];
  const DY = [-1, 1, 0, 0];

  while (qs < qe) {
    const D = q[qs++];
    const dx = D % w;
    const dy = (D / w) | 0;

    for (let d = 0; d < 4; d++) {
      const bx = dx - DX[d];
      const by = dy - DY[d];
      if (bx < 0 || bx >= w || by < 0 || by >= h) continue;
      const B = by * w + bx;
      if (walls[B] || live[B]) continue;

      // Player must be reachable at P = B - dir
      const px = bx - DX[d];
      const py = by - DY[d];
      if (px < 0 || px >= w || py < 0 || py >= h) continue;
      const P = py * w + px;
      if (walls[P]) continue;

      live[B] = 1;
      q[qe++] = B;
    }
  }

  const dead = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (!walls[i] && !live[i]) dead[i] = 1;
  }
  return dead;
}

/**
 * Returns true if any non-goal box sits on a precomputed dead square.
 */
export function hasDeadSquare(s: GameState, deadSquares: Uint8Array): boolean {
  for (let i = 0; i < s.boxes.length; i++) {
    if (s.boxes[i] && !s.goals[i] && deadSquares[i]) return true;
  }
  return false;
}

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
    if (
      (upB && leftB) ||
      (upB && rightB) ||
      (downB && leftB) ||
      (downB && rightB)
    ) {
      return true;
    }
  }
  return false;
}
