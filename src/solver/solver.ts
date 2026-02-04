import type { Dir, GameState, SolveResult, StepInfo } from "../types";
import { cloneLevel } from "../core/level";
import { DIRS, xy } from "../core/grid";
import { isWin } from "../core/state";
import { isCornerDeadlock } from "./deadlock";
import { reachable, shortestWalkPath } from "./reach";

/**
 * Sokoban solver that minimizes number of pushes (usually the most practical).
 *
 * State graph:
 * - Node = (playerPos, boxesPositions)
 * - Edge = "one box push"
 *   We first compute all squares the player can reach without moving boxes.
 *   Then any box that has a reachable 'behind' cell and an empty 'ahead' cell is pushable.
 *
 * For each push edge, we also reconstruct a concrete walking path (for UI playback).
 */
export async function solveMinPushes(initial: GameState, maxExpanded = 200_000): Promise<SolveResult> {
  const t0 = performance.now();

  // Quick prune
  if (isCornerDeadlock(initial)) {
    return { ok: false, reason: "Immediate deadlock detected (corner).", timeMs: performance.now() - t0 };
  }
  if (isWin(initial)) {
    return { ok: true, minPushes: 0, steps: [], expanded: 0, timeMs: performance.now() - t0 };
  }

  const w = initial.w, h = initial.h;
  const N = w * h;

  const encode = (player: number, boxes: Uint8Array): string => {
    // Compact-ish key: player + bit positions.
    // For small boards this is fine. You can optimize to BigInt bitsets later.
    let s = player.toString(36) + "|";
    for (let i = 0; i < N; i++) if (boxes[i]) s += i.toString(36) + ",";
    return s;
  };

  type Node = {
    player: number;
    boxes: Uint8Array;
    parentKey: string | null;
    // push metadata to reconstruct (walking path + push dir)
    walk: string; // lower-case walk path before the push
    pushDir: Dir | null; // null for root
  };

  const q: Node[] = [];
  let qs = 0;

  const rootKey = encode(initial.player, initial.boxes);
  const seen = new Map<string, Node>();
  const root: Node = { player: initial.player, boxes: initial.boxes.slice(), parentKey: null, walk: "", pushDir: null };
  seen.set(rootKey, root);
  q.push(root);

  let expanded = 0;

  while (qs < q.length) {
    const cur = q[qs++];
    expanded++;
    if (expanded > maxExpanded) {
      return { ok: false, reason: `Search limit exceeded (expanded>${maxExpanded}).`, expanded, timeMs: performance.now() - t0 };
    }

    // Build a mutable state for reachability + pathfinding
    const s = cloneLevel(initial);
    s.player = cur.player;
    s.boxes = cur.boxes;

    const reach = reachable(s);

    // Enumerate pushable boxes
    for (let bi = 0; bi < N; bi++) {
      if (!cur.boxes[bi]) continue;

      const { x, y } = xy(bi, w);
      for (const [dir, dd] of Object.entries(DIRS) as [Dir, { dx: number; dy: number }][]) {
        const behindX = x - dd.dx;
        const behindY = y - dd.dy;
        const aheadX = x + dd.dx;
        const aheadY = y + dd.dy;

        if (behindX < 0 || behindX >= w || behindY < 0 || behindY >= h) continue;
        if (aheadX < 0 || aheadX >= w || aheadY < 0 || aheadY >= h) continue;

        const behind = behindY * w + behindX;
        const ahead = aheadY * w + aheadX;

        // Need player reachable behind the box, and ahead cell must be empty floor (not wall, not box)
        if (!reach[behind]) continue;
        if (initial.walls[ahead]) continue;
        if (cur.boxes[ahead]) continue;

        // Reconstruct walking path from cur.player to behind
        const walkPath = shortestWalkPath(s, cur.player, behind);
        if (walkPath == null) continue;

        // Create next node by performing the push
        const nextBoxes = cur.boxes.slice();
        nextBoxes[bi] = 0;
        nextBoxes[ahead] = 1;
        const nextPlayer = bi; // after pushing, player stands where the box was

        const nextState = cloneLevel(initial);
        nextState.player = nextPlayer;
        nextState.boxes = nextBoxes;

        if (isCornerDeadlock(nextState)) continue;

        const key = encode(nextPlayer, nextBoxes);
        if (seen.has(key)) continue;

        const node: Node = {
          player: nextPlayer,
          boxes: nextBoxes,
          parentKey: encode(cur.player, cur.boxes),
          walk: walkPath,
          pushDir: dir,
        };
        seen.set(key, node);

        if (isWin(nextState)) {
          const steps = reconstructSteps(seen, key, initial);
          return {
            ok: true,
            minPushes: countPushes(steps),
            steps,
            expanded,
            timeMs: performance.now() - t0,
          };
        }

        q.push(node);
      }
    }
  }

  return { ok: false, reason: "No solution found.", expanded, timeMs: performance.now() - t0 };
}

function countPushes(steps: StepInfo[]): number {
  return steps.reduce((acc, s) => acc + (s.pushed ? 1 : 0), 0);
}

/**
 * Reconstruct full move list (walk + push) from parent pointers.
 */
function reconstructSteps(seen: Map<string, any>, goalKey: string, initial: GameState): StepInfo[] {
  const chain: any[] = [];
  let k: string | null = goalKey;
  while (k) {
    const n = seen.get(k);
    chain.push(n);
    k = n.parentKey;
  }
  chain.reverse(); // root -> goal

  // Now build full steps by simulating each segment:
  const out: StepInfo[] = [];
  const s = cloneLevel(initial);

  for (let i = 1; i < chain.length; i++) {
    const n = chain[i];
    // 1) walk
    for (const ch of n.walk) {
      const dir = chToDir(ch);
      out.push({ dir, pushed: false });
      // simulate on s
      applyWalkOnly(s, dir);
    }
    // 2) push
    if (n.pushDir) {
      out.push({ dir: n.pushDir, pushed: true });
      applyPush(s, n.pushDir);
    }
  }
  return out;
}

function chToDir(ch: string): Dir {
  switch (ch) {
    case "u": return "U";
    case "d": return "D";
    case "l": return "L";
    case "r": return "R";
    default: throw new Error(`Invalid walk dir: ${ch}`);
  }
}

function applyWalkOnly(s: GameState, dir: Dir) {
  // Safe: walk paths were computed without moving boxes
  const w = s.w;
  const { x, y } = xy(s.player, w);
  const dd = DIRS[dir];
  const nx = x + dd.dx;
  const ny = y + dd.dy;
  const ni = ny * w + nx;
  s.player = ni;
}

function applyPush(s: GameState, dir: Dir) {
  const w = s.w;
  const { x, y } = xy(s.player, w);
  const dd = DIRS[dir];
  const boxI = (y + dd.dy) * w + (x + dd.dx);
  const aheadI = (y + 2 * dd.dy) * w + (x + 2 * dd.dx);
  // assume valid push
  s.boxes[boxI] = 0;
  s.boxes[aheadI] = 1;
  s.player = boxI;
}
