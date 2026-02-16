import type { Dir, GameState, SolveResult, StepInfo } from "../types";
import { cloneLevel } from "../core/level";
import { DIRS, xy } from "../core/grid";
import { isWin } from "../core/state";
import { isCornerDeadlock } from "./deadlock";
import { buildWalkTree, walkPathFromTree } from "./reach";

export async function solveMinPushes(
  initial: GameState,
  maxExpanded = 200_000,
): Promise<SolveResult> {
  const t0 = performance.now();

  if (maxExpanded <= 0) {
    return {
      ok: false,
      reason: "Search limit exceeded.",
      expanded: 0,
      steps: [],
      timeMs: performance.now() - t0,
    };
  }

  if (isCornerDeadlock(initial)) {
    return {
      ok: false,
      reason: "Immediate deadlock detected (corner).",
      expanded: 0,
      steps: [],
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

  // -------- Bitboard encoding (boxes only) --------
  const encodeBoxes = (boxes: Uint8Array): bigint => {
    let bits = 0n;
    for (let i = 0; i < N; i++) {
      if (boxes[i]) bits |= 1n << BigInt(i);
    }
    return bits;
  };

  type Node = {
    key: string;
    player: number;
    boxes: Uint8Array;
    boxesBits: bigint;
    parent: Node | null;
    walk: string; // walk before the push (from parent state)
    pushDir: Dir | null; // push taken from parent to reach this node
  };

  const DIR_LIST: Dir[] = ["U", "D", "L", "R"];

  const queue: Node[] = [];
  let qs = 0;
  let expanded = 0;

  const seen = new Set<string>();

  const rootBoxes = initial.boxes.slice();
  const rootBits = encodeBoxes(rootBoxes);
  const rootKey = rootBits.toString() + "|" + initial.player;

  const root: Node = {
    key: rootKey,
    player: initial.player,
    boxes: rootBoxes,
    boxesBits: rootBits,
    parent: null,
    walk: "",
    pushDir: null,
  };

  queue.push(root);
  seen.add(rootKey);

  // -------- reusable scratch state --------
  const scratch = cloneLevel(initial);

  while (qs < queue.length) {
    // budget check: each dequeue counts as one "expanded"
    if (expanded >= maxExpanded) {
      return {
        ok: false,
        reason: "Search limit exceeded.",
        expanded,
        steps: [],
        timeMs: performance.now() - t0,
      };
    }

    const cur = queue[qs++];
    expanded++;

    // materialize current state into scratch
    scratch.player = cur.player;
    scratch.boxes.set(cur.boxes);

    // win check happens when dequeued/expanded (not when generated)
    if (isWin(scratch)) {
      const steps = reconstructSteps(cur, initial);
      return {
        ok: true,
        minPushes: countPushes(steps),
        steps,
        expanded,
        timeMs: performance.now() - t0,
      };
    }

    // One BFS tree for all candidate pushes from this state
    const tree = buildWalkTree(scratch, cur.player);

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

        if (!tree.reach[behind]) continue;
        if (initial.walls[ahead]) continue;
        if (cur.boxes[ahead]) continue;

        const walkPath = walkPathFromTree(tree, cur.player, behind);
        if (walkPath == null) continue;

        // ----- apply push on scratch -----
        scratch.boxes[bi] = 0;
        scratch.boxes[ahead] = 1;
        scratch.player = bi;

        // deadlock prune
        if (isCornerDeadlock(scratch)) {
          // revert
          scratch.boxes[bi] = 1;
          scratch.boxes[ahead] = 0;
          scratch.player = cur.player; // restore
          continue;
        }

        const nextBoxes = scratch.boxes.slice();
        const nextPlayer = scratch.player;

        // fast bit update
        const nextBits =
          cur.boxesBits ^ (1n << BigInt(bi)) ^ (1n << BigInt(ahead));

        const nextKey = nextBits.toString() + "|" + nextPlayer;

        if (!seen.has(nextKey)) {
          const node: Node = {
            key: nextKey,
            player: nextPlayer,
            boxes: nextBoxes,
            boxesBits: nextBits,
            parent: cur,
            walk: walkPath,
            pushDir: dir,
          };

          seen.add(nextKey);
          queue.push(node);
        }

        // revert push
        scratch.boxes[bi] = 1;
        scratch.boxes[ahead] = 0;
        scratch.player = cur.player; // restore
      }
    }
  }

  return {
    ok: false,
    reason: "No solution found.",
    expanded,
    steps: [],
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
