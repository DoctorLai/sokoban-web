import type { Dir, GameState, StepInfo } from "../types";
import { step, DIRS, xy } from "./grid";

/**
 * Apply one move to the game state.
 * Returns whether the state changed, and if a push happened.
 */
export function applyMove(
  s: GameState,
  dir: Dir,
): { changed: boolean; pushed: boolean } {
  const w = s.w;
  const h = s.h;
  const p1 = step(s.player, dir, w);

  // Guard: out-of-bounds or wall
  const { x: px, y: py } = xy(s.player, w);
  const dd = DIRS[dir];
  const nx = px + dd.dx;
  const ny = py + dd.dy;
  if (nx < 0 || nx >= w || ny < 0 || ny >= h)
    return { changed: false, pushed: false };
  if (s.walls[p1]) return { changed: false, pushed: false };

  // If next is a box, attempt to push
  if (s.boxes[p1]) {
    const p2 = step(p1, dir, w);
    const nnx = nx + dd.dx;
    const nny = ny + dd.dy;
    if (nnx < 0 || nnx >= w || nny < 0 || nny >= h)
      return { changed: false, pushed: false };
    if (s.walls[p2]) return { changed: false, pushed: false };
    if (s.boxes[p2]) return { changed: false, pushed: false };

    // push
    s.boxes[p1] = 0;
    s.boxes[p2] = 1;
    s.player = p1;
    return { changed: true, pushed: true };
  }

  // Otherwise just walk
  s.player = p1;
  return { changed: true, pushed: false };
}

export function isWin(s: GameState): boolean {
  // All boxes must be on goals (classic: number of boxes == number of goals is assumed by level design).
  for (let i = 0; i < s.boxes.length; i++) {
    if (s.boxes[i] && !s.goals[i]) return false;
  }
  return true;
}

/**
 * History stack for Undo / Redo.
 */
export class History {
  private past: { player: number; boxes: Uint8Array }[] = [];
  private future: { player: number; boxes: Uint8Array }[] = [];

  push(s: GameState) {
    this.past.push({ player: s.player, boxes: s.boxes.slice() });
    this.future.length = 0;
  }

  undo(s: GameState): boolean {
    if (this.past.length <= 1) return false; // keep at least initial
    const cur = this.past.pop()!;
    this.future.push(cur);
    const prev = this.past[this.past.length - 1]!;
    s.player = prev.player;
    s.boxes = prev.boxes.slice();
    return true;
  }

  redo(s: GameState): boolean {
    const next = this.future.pop();
    if (!next) return false;
    this.past.push({ player: next.player, boxes: next.boxes.slice() });
    s.player = next.player;
    s.boxes = next.boxes.slice();
    return true;
  }

  reset(s: GameState) {
    if (this.past.length === 0) return;
    const first = this.past[0]!;
    this.past = [first];
    this.future = [];
    s.player = first.player;
    s.boxes = first.boxes.slice();
  }

  init(s: GameState) {
    this.past = [{ player: s.player, boxes: s.boxes.slice() }];
    this.future = [];
  }

  stats() {
    return { undo: this.past.length - 1, redo: this.future.length };
  }
}

export function formatSteps(steps: StepInfo[]): string {
  // Display as a compact string. Uppercase = push, lowercase = walk
  const toChar = (st: StepInfo) => {
    const map: Record<Dir, string> = { U: "u", D: "d", L: "l", R: "r" };
    const c = map[st.dir];
    return st.pushed ? c.toUpperCase() : c;
  };
  return steps.map(toChar).join("");
}
