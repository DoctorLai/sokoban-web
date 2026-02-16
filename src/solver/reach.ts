import type { GameState } from "../types";
import { DIRS, xy, idx } from "../core/grid";

const DIR_LIST = Object.values(DIRS);

export type WalkTree = {
  /** 1 means reachable from start (without moving boxes) */
  reach: Uint8Array;
  /** predecessor cell index, or -1 if unseen */
  prev: Int32Array;
  /** 0..3 direction index used to arrive here (matches dirs below), meaningless if prev=-1 */
  prevDir: Int8Array;
};

const WALK_DIRS = [
  { dx: 0, dy: -1, ch: "u" },
  { dx: 0, dy: 1, ch: "d" },
  { dx: -1, dy: 0, ch: "l" },
  { dx: 1, dy: 0, ch: "r" },
] as const;

/**
 * Compute BFS tree of walk-reachable cells for player from `start`
 * without moving boxes. Useful to reconstruct shortest walk paths to
 * many targets without running BFS repeatedly.
 */
export function buildWalkTree(s: GameState, start: number): WalkTree {
  const { w, h } = s;
  const N = w * h;

  const reach = new Uint8Array(N);
  const prev = new Int32Array(N);
  const prevDir = new Int8Array(N);

  prev.fill(-1);

  const q = new Int32Array(N);
  let qs = 0;
  let qe = 0;

  reach[start] = 1;
  prev[start] = start;
  q[qe++] = start;

  while (qs < qe) {
    const cur = q[qs++];
    const { x, y } = xy(cur, w);

    for (let k = 0; k < 4; k++) {
      const d = WALK_DIRS[k];
      const nx = x + d.dx;
      const ny = y + d.dy;

      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;

      const ni = idx(nx, ny, w);
      if (prev[ni] !== -1) continue;
      if (s.walls[ni]) continue;
      if (s.boxes[ni]) continue;

      prev[ni] = cur;
      prevDir[ni] = k;
      reach[ni] = 1;

      q[qe++] = ni;
    }
  }

  return { reach, prev, prevDir };
}

/** Backwards-compatible helper (still used elsewhere if you want). */
export function reachable(s: GameState): Uint8Array {
  return buildWalkTree(s, s.player).reach;
}

/**
 * Reconstruct shortest walk path from BFS tree.
 * Returns a string like "uurrdd" or null if unreachable.
 */
export function walkPathFromTree(
  tree: WalkTree,
  start: number,
  goal: number,
): string | null {
  if (start === goal) return "";
  if (tree.prev[goal] === -1) return null;

  let out = "";
  let t = goal;

  while (t !== start) {
    const k = tree.prevDir[t];
    out = WALK_DIRS[k].ch + out;
    t = tree.prev[t];
    if (t === -1) return null;
  }

  return out;
}

/**
 * Kept for compatibility. Uses buildWalkTree internally.
 * (If you want, you can delete this and update call sites.)
 */
export function shortestWalkPath(
  s: GameState,
  start: number,
  goal: number,
): string | null {
  const tree = buildWalkTree(s, start);
  return walkPathFromTree(tree, start, goal);
}
