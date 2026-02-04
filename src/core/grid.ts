import type { Dir } from "../types";

export function idx(x: number, y: number, w: number): number {
  return y * w + x;
}
export function xy(i: number, w: number): { x: number; y: number } {
  return { x: i % w, y: Math.floor(i / w) };
}

export const DIRS: Record<Dir, { dx: number; dy: number }> = {
  U: { dx: 0, dy: -1 },
  D: { dx: 0, dy: 1 },
  L: { dx: -1, dy: 0 },
  R: { dx: 1, dy: 0 },
};

export function step(i: number, d: Dir, w: number): number {
  const { x, y } = xy(i, w);
  const dd = DIRS[d];
  return (y + dd.dy) * w + (x + dd.dx);
}

export function inBounds(i: number, w: number, h: number): boolean {
  return i >= 0 && i < w * h;
}
