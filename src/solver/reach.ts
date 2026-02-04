import type { GameState } from "../types";
import { DIRS, xy, idx } from "../core/grid";

/**
 * Compute reachable cells for player without moving boxes.
 * Returns a Uint8Array where 1 means reachable.
 */
export function reachable(s: GameState): Uint8Array {
  const { w, h } = s;
  const vis = new Uint8Array(w * h);
  const q = new Int32Array(w * h);
  let qs = 0,
    qe = 0;

  vis[s.player] = 1;
  q[qe++] = s.player;

  while (qs < qe) {
    const cur = q[qs++];
    const { x, y } = xy(cur, w);
    for (const d of Object.values(DIRS)) {
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const ni = idx(nx, ny, w);
      if (vis[ni]) continue;
      if (s.walls[ni]) continue;
      if (s.boxes[ni]) continue;
      vis[ni] = 1;
      q[qe++] = ni;
    }
  }
  return vis;
}

/**
 * Shortest walking path for player from start to goal without moving boxes.
 * Returns directions as a string like "uurrdd" (lowercase).
 */
export function shortestWalkPath(
  s: GameState,
  start: number,
  goal: number,
): string | null {
  if (start === goal) return "";

  const { w, h } = s;
  const prev = new Int32Array(w * h);
  prev.fill(-1);
  const prevDir = new Int8Array(w * h); // 0..3
  const q = new Int32Array(w * h);
  let qs = 0,
    qe = 0;

  q[qe++] = start;
  prev[start] = start;

  const dirs: Array<{ dx: number; dy: number; ch: string }> = [
    { dx: 0, dy: -1, ch: "u" },
    { dx: 0, dy: 1, ch: "d" },
    { dx: -1, dy: 0, ch: "l" },
    { dx: 1, dy: 0, ch: "r" },
  ];

  while (qs < qe) {
    const cur = q[qs++];
    const { x, y } = xy(cur, w);
    for (let k = 0; k < dirs.length; k++) {
      const d = dirs[k];
      const nx = x + d.dx;
      const ny = y + d.dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      const ni = ny * w + nx;
      if (prev[ni] !== -1) continue;
      if (s.walls[ni]) continue;
      if (s.boxes[ni]) continue;
      prev[ni] = cur;
      prevDir[ni] = k;
      if (ni === goal) {
        // reconstruct
        let out = "";
        let t = ni;
        while (t !== start) {
          const kk = prevDir[t];
          out = dirs[kk].ch + out;
          t = prev[t];
        }
        return out;
      }
      q[qe++] = ni;
    }
  }
  return null;
}
