import type { Dir, GameState, SolveResult, StepInfo } from "../types";
import { cloneLevel } from "../core/level";
import { DIRS } from "../core/grid";
import { isWin } from "../core/state";
import { computeDeadSquares, hasDeadSquare } from "./deadlock";
import { buildWalkTree, walkPathFromTree } from "./reach";

// ---------------------------------------------------------------------------
// Min-heap priority queue for A*
// ---------------------------------------------------------------------------
class MinHeap<T> {
  private d: [number, T][] = [];

  push(priority: number, val: T): void {
    let i = this.d.push([priority, val]) - 1;
    while (i > 0) {
      const par = (i - 1) >> 1;
      if (this.d[par][0] <= this.d[i][0]) break;
      [this.d[par], this.d[i]] = [this.d[i], this.d[par]];
      i = par;
    }
  }

  pop(): T {
    const top = this.d[0][1];
    const end = this.d.pop()!;
    if (this.d.length > 0) {
      this.d[0] = end;
      let i = 0;
      while (true) {
        const l = 2 * i + 1,
          r = 2 * i + 2,
          n = this.d.length;
        let s = i;
        if (l < n && this.d[l][0] < this.d[s][0]) s = l;
        if (r < n && this.d[r][0] < this.d[s][0]) s = r;
        if (s === i) break;
        [this.d[s], this.d[i]] = [this.d[i], this.d[s]];
        i = s;
      }
    }
    return top;
  }

  get size(): number {
    return this.d.length;
  }
}

// ---------------------------------------------------------------------------
// Admissible heuristic: sum of min Manhattan distances from each box to any goal.
// Precompute a goalDist table once per level for O(numBoxes) evaluation.
// ---------------------------------------------------------------------------
function buildGoalDistTable(initial: GameState): Int32Array {
  const { w, h } = initial;
  const N = w * h;
  const dist = new Int32Array(N).fill(0x7fffffff);
  for (let i = 0; i < N; i++) {
    if (!initial.goals[i]) continue;
    const gx = i % w,
      gy = (i / w) | 0;
    for (let j = 0; j < N; j++) {
      const d = Math.abs((j % w) - gx) + Math.abs(((j / w) | 0) - gy);
      if (d < dist[j]) dist[j] = d;
    }
  }
  return dist;
}

function heuristic(boxes: Uint8Array, N: number, goalDist: Int32Array): number {
  let h = 0;
  for (let i = 0; i < N; i++) {
    if (boxes[i]) h += goalDist[i];
  }
  return h;
}

// ---------------------------------------------------------------------------
// Compact state key: box positions as 1-indexed char codes + null + player.
// Much shorter than a BigInt decimal string (numBoxes+2 chars vs ~120 chars).
// ---------------------------------------------------------------------------
function makeKey(boxes: Uint8Array, N: number, normPlayer: number): string {
  let s = "";
  for (let i = 0; i < N; i++) {
    if (boxes[i]) s += String.fromCharCode(i + 1); // 1-indexed avoids null char
  }
  return s + "\x00" + String.fromCharCode(normPlayer + 1);
}

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

  // ---- Precompute once per level ----
  const goalDist = buildGoalDistTable(initial);
  const deadSquares = computeDeadSquares(initial);

  if (hasDeadSquare(initial, deadSquares)) {
    return {
      ok: false,
      reason: "Immediate deadlock detected.",
      expanded: 0,
      steps: [],
      timeMs: performance.now() - t0,
    };
  }

  type Node = {
    key: string; // state key (used as closed-set identifier when popped)
    player: number; // normalized player: min reachable cell index
    boxes: Uint8Array;
    parent: Node | null;
    pushBoxFrom: number; // index of box before push (-1 for root)
    pushBoxTo: number; // index of box after push  (-1 for root)
    pushDir: Dir | null;
    g: number; // push cost so far
  };

  const DIR_LIST: Dir[] = ["U", "D", "L", "R"];

  // ---- Reusable scratch state ----
  const scratch = cloneLevel(initial);

  // ---- Lightweight BFS for player normalization (reuses these arrays) ----
  const normVisited = new Uint8Array(N);
  const normQueue = new Int32Array(N);

  /** Find the minimum-index reachable cell from `start` with current scratch board. */
  function computeNormPlayer(start: number): number {
    normVisited.fill(0);
    let qs = 0,
      qe = 0;
    let minIdx = start;
    normVisited[start] = 1;
    normQueue[qe++] = start;
    while (qs < qe) {
      const cur = normQueue[qs++];
      if (cur < minIdx) minIdx = cur;
      const x = cur % w,
        y = (cur / w) | 0;
      let ni: number;
      if (
        x > 0 &&
        !normVisited[(ni = cur - 1)] &&
        !scratch.walls[ni] &&
        !scratch.boxes[ni]
      ) {
        normVisited[ni] = 1;
        normQueue[qe++] = ni;
      }
      if (
        x < w - 1 &&
        !normVisited[(ni = cur + 1)] &&
        !scratch.walls[ni] &&
        !scratch.boxes[ni]
      ) {
        normVisited[ni] = 1;
        normQueue[qe++] = ni;
      }
      if (
        y > 0 &&
        !normVisited[(ni = cur - w)] &&
        !scratch.walls[ni] &&
        !scratch.boxes[ni]
      ) {
        normVisited[ni] = 1;
        normQueue[qe++] = ni;
      }
      if (
        y < h - 1 &&
        !normVisited[(ni = cur + w)] &&
        !scratch.walls[ni] &&
        !scratch.boxes[ni]
      ) {
        normVisited[ni] = 1;
        normQueue[qe++] = ni;
      }
    }
    return minIdx;
  }

  // ---- Build root node ----
  const rootBoxes = initial.boxes.slice();
  scratch.player = initial.player;
  scratch.boxes.set(rootBoxes);
  const normInitPlayer = computeNormPlayer(initial.player);
  const rootKey = makeKey(rootBoxes, N, normInitPlayer);

  const root: Node = {
    key: rootKey,
    player: normInitPlayer,
    boxes: rootBoxes,
    parent: null,
    pushBoxFrom: -1,
    pushBoxTo: -1,
    pushDir: null,
    g: 0,
  };

  // ---- A* ----
  const heap = new MinHeap<Node>();
  let expanded = 0;
  const closed = new Set<string>(); // keys of optimally-processed states

  heap.push(heuristic(rootBoxes, N, goalDist), root);

  while (heap.size > 0) {
    // Budget check before each expansion
    if (expanded >= maxExpanded) {
      return {
        ok: false,
        reason: "Search limit exceeded.",
        expanded,
        steps: [],
        timeMs: performance.now() - t0,
      };
    }

    const cur = heap.pop();

    // With a consistent heuristic, first pop = optimal g.
    // Skip stale duplicates already in closed.
    if (closed.has(cur.key)) continue;
    closed.add(cur.key);
    expanded++;

    // Materialize state into scratch
    scratch.player = cur.player;
    scratch.boxes.set(cur.boxes);

    // Win check on dequeue
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

    // One walk-BFS for all push reachability from normalized player position
    const tree = buildWalkTree(scratch, cur.player);

    for (let bi = 0; bi < N; bi++) {
      if (!cur.boxes[bi]) continue;

      const bx = bi % w;
      const by = (bi / w) | 0;

      for (const dir of DIR_LIST) {
        const dd = DIRS[dir];

        const behindX = bx - dd.dx;
        const behindY = by - dd.dy;
        const aheadX = bx + dd.dx;
        const aheadY = by + dd.dy;

        if (behindX < 0 || behindX >= w || behindY < 0 || behindY >= h)
          continue;
        if (aheadX < 0 || aheadX >= w || aheadY < 0 || aheadY >= h) continue;

        const behind = behindY * w + behindX;
        const ahead = aheadY * w + aheadX;

        if (!tree.reach[behind]) continue;
        if (initial.walls[ahead]) continue;
        if (cur.boxes[ahead]) continue;

        // Fast dead-square prune before applying (no scratch mutation yet)
        if (deadSquares[ahead] && !initial.goals[ahead]) continue;

        // Apply push on scratch
        scratch.boxes[bi] = 0;
        scratch.boxes[ahead] = 1;
        scratch.player = bi;

        // Normalize player position in successor state
        const normNext = computeNormPlayer(bi);
        const nextKey = makeKey(scratch.boxes, N, normNext);

        if (!closed.has(nextKey)) {
          const nextBoxes = scratch.boxes.slice();
          const nextG = cur.g + 1;
          const nextH = heuristic(nextBoxes, N, goalDist);

          const node: Node = {
            key: nextKey,
            player: normNext,
            boxes: nextBoxes,
            parent: cur,
            pushBoxFrom: bi,
            pushBoxTo: ahead,
            pushDir: dir,
            g: nextG,
          };

          heap.push(nextG + nextH, node);
        }

        // Revert push
        scratch.boxes[bi] = 1;
        scratch.boxes[ahead] = 0;
        scratch.player = cur.player;
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

/**
 * Reconstruct step sequence by replaying from the initial state.
 * Walk paths are computed lazily here (not stored in nodes), saving memory during search.
 */
function reconstructSteps(goalNode: any, initial: GameState): StepInfo[] {
  const chain: any[] = [];
  let n = goalNode;
  while (n) {
    chain.push(n);
    n = n.parent;
  }
  chain.reverse();

  const out: StepInfo[] = [];
  const s = cloneLevel(initial); // actual replayed state tracks real player position

  for (let i = 1; i < chain.length; i++) {
    const node = chain[i];
    const dd = DIRS[node.pushDir as Dir];
    const bx = node.pushBoxFrom % s.w;
    const by = (node.pushBoxFrom / s.w) | 0;
    const behindX = bx - dd.dx;
    const behindY = by - dd.dy;
    const behind = behindY * s.w + behindX;

    // Walk from actual current player to the required behind-box position
    const tree = buildWalkTree(s, s.player);
    const walkStr = walkPathFromTree(tree, s.player, behind);
    if (walkStr) {
      for (const ch of walkStr) {
        const dir = chToDir(ch);
        out.push({ dir, pushed: false });
        applyWalkOnly(s, dir);
      }
    }

    // Apply the push
    out.push({ dir: node.pushDir as Dir, pushed: true });
    s.boxes[node.pushBoxFrom] = 0;
    s.boxes[node.pushBoxTo] = 1;
    s.player = node.pushBoxFrom;
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
  const dd = DIRS[dir];
  const x = s.player % s.w;
  const y = (s.player / s.w) | 0;
  s.player = (y + dd.dy) * s.w + (x + dd.dx);
}
