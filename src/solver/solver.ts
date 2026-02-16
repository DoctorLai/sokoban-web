import type { Dir, GameState, SolveResult, StepInfo } from "../types";
import { cloneLevel } from "../core/level";
import { DIRS, xy } from "../core/grid";
import { isWin } from "../core/state";
import { isCornerDeadlock } from "./deadlock";
import { reachable, shortestWalkPath } from "./reach";

/**
 * Optimized push-minimizing Sokoban solver.
 * Improvements:
 * - State key = boxes only (BigInt bitboard)
 * - No string encoding
 * - Reuse scratch GameState
 * - Avoid repeated cloning
 */

export async function solveMinPushes(
  initial: GameState,
  maxExpanded = 200_000,
): Promise<SolveResult> {
  const t0 = performance.now();

  if (isCornerDeadlock(initial)) {
    return {
      ok: false,
      reason: "Immediate deadlock detected (corner).",
      timeMs: performance.now() - t0,
    };
  }

  if (isWin(initial)) {
    return {
      ok: true,
      minPushes: 0,
      steps: [],
      expanded: 0,
      timeMs: performance.now() - t0,
    };
  }

  const w = initial.w;
  const h = initial.h;
  const N = w * h;

  // ---------- Bitboard encoding (boxes only) ----------
  const encodeBoxes = (boxes: Uint8Array): bigint => {
    let bits = 0n;
    for (let i = 0; i < N; i++) {
      if (boxes[i]) bits |= 1n << BigInt(i);
    }
    return bits;
  };

  type Node = {
    key: bigint;
    player: number;
    boxes: Uint8Array;
    parent: Node | null;
    walk: string;
    pushDir: Dir | null;
  };

  const queue: Node[] = [];
  let qs = 0;
  let expanded = 0;

  const seen = new Map<bigint, Node>();

  const root: Node = {
    key: encodeBoxes(initial.boxes),
    player: initial.player,
    boxes: initial.boxes.slice(),
    parent: null,
    walk: "",
    pushDir: null,
  };

  queue.push(root);
  seen.set(root.key, root);

  // ---------- Reusable scratch state ----------
  const scratch = cloneLevel(initial);

  const DIR_LIST: Dir[] = ["U", "D", "L", "R"];

  while (qs < queue.length) {
    const cur = queue[qs++];
    expanded++;

    if (expanded > maxExpanded) {
      return {
        ok: false,
        reason: `Search limit exceeded (expanded>${maxExpanded}).`,
        expanded,
        timeMs: performance.now() - t0,
      };
    }

    // Reuse scratch instead of cloning
    scratch.player = cur.player;
    scratch.boxes.set(cur.boxes);

    const reach = reachable(scratch);

    for (let bi = 0; bi < N; bi++) {
      if (!cur.boxes[bi]) continue;

      const { x, y } = xy(bi, w);

      for (const dir of DIR_LIST) {
        const dd = DIRS[dir];

        const behindX = x - dd.dx;
        const behindY = y - dd.dy;
        const aheadX = x + dd.dx;
        const aheadY = y + dd.dy;

        if (behindX < 0 || behindX >= w || behindY < 0 || behindY >= h)
          continue;

        if (aheadX < 0 || aheadX >= w || aheadY < 0 || aheadY >= h) continue;

        const behind = behindY * w + behindX;
        const ahead = aheadY * w + aheadX;

        if (!reach[behind]) continue;
        if (initial.walls[ahead]) continue;
        if (cur.boxes[ahead]) continue;

        const walkPath = shortestWalkPath(scratch, cur.player, behind);
        if (!walkPath) continue;

        // ---- Apply push into scratch ----
        scratch.boxes[bi] = 0;
        scratch.boxes[ahead] = 1;

        const nextPlayer = bi;
        scratch.player = nextPlayer;

        if (isCornerDeadlock(scratch)) {
          // revert
          scratch.boxes[bi] = 1;
          scratch.boxes[ahead] = 0;
          continue;
        }

        const nextBoxes = scratch.boxes.slice();
        const nextKey = encodeBoxes(nextBoxes);

        if (!seen.has(nextKey)) {
          const node: Node = {
            key: nextKey,
            player: nextPlayer,
            boxes: nextBoxes,
            parent: cur,
            walk: walkPath,
            pushDir: dir,
          };

          if (isWin(scratch)) {
            const steps = reconstructSteps(node, initial);
            return {
              ok: true,
              minPushes: countPushes(steps),
              steps,
              expanded,
              timeMs: performance.now() - t0,
            };
          }

          seen.set(nextKey, node);
          queue.push(node);
        }

        // revert push
        scratch.boxes[bi] = 1;
        scratch.boxes[ahead] = 0;
      }
    }
  }

  return {
    ok: false,
    reason: "No solution found.",
    expanded,
    timeMs: performance.now() - t0,
  };
}

function countPushes(steps: StepInfo[]): number {
  return steps.reduce((acc, s) => acc + (s.pushed ? 1 : 0), 0);
}

function reconstructSteps(goalNode: any, initial: GameState): StepInfo[] {
  const chain: any[] = [];
  let n = goalNode;

  while (n) {
    chain.push(n);
    n = n.parent;
  }

  chain.reverse();

  const out: StepInfo[] = [];
  const s = cloneLevel(initial);

  for (let i = 1; i < chain.length; i++) {
    const node = chain[i];

    for (const ch of node.walk) {
      const dir = chToDir(ch);
      out.push({ dir, pushed: false });
      applyWalkOnly(s, dir);
    }

    if (node.pushDir) {
      out.push({ dir: node.pushDir, pushed: true });
      applyPush(s, node.pushDir);
    }
  }

  return out;
}

function chToDir(ch: string): Dir {
  switch (ch) {
    case "u":
      return "U";
    case "d":
      return "D";
    case "l":
      return "L";
    case "r":
      return "R";
    default:
      throw new Error(`Invalid walk dir: ${ch}`);
  }
}

function applyWalkOnly(s: GameState, dir: Dir) {
  const w = s.w;
  const { x, y } = xy(s.player, w);
  const dd = DIRS[dir];
  s.player = (y + dd.dy) * w + (x + dd.dx);
}

function applyPush(s: GameState, dir: Dir) {
  const w = s.w;
  const { x, y } = xy(s.player, w);
  const dd = DIRS[dir];

  const boxI = (y + dd.dy) * w + (x + dd.dx);
  const aheadI = (y + 2 * dd.dy) * w + (x + 2 * dd.dx);

  s.boxes[boxI] = 0;
  s.boxes[aheadI] = 1;
  s.player = boxI;
}
