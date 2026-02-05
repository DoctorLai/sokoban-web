import type { Dir, GameState, LevelJson } from "../types";
import { cloneLevel, countBoxes } from "../core/level";
import { DIRS, xy } from "../core/grid";
import { reachable } from "../solver/reach";
import { solveMinPushes } from "../solver/solver";

/**
 * Generate solvable levels using reverse moves (pulling boxes).
 *
 * High-level:
 * 1) Start from a "solved" configuration: boxes placed on goals.
 * 2) Do many random reverse-push moves (i.e., "pull" a box) to create a start state.
 * 3) Verify and score using the solver.
 *
 * Note: This is fine for small levels in the browser. For large batch generation,
 * run the Node script in /scripts to generate JSON files offline.
 */

// A simple fixed "arena" layout you can tweak.
// '.' are goals, '#' walls, ' ' floors.
export const DEFAULT_ARENA: LevelJson = {
  id: "gen-arena",
  title: "Generator Arena",
  map: [
    "###############",
    "#      .      #",
    "#   #####     #",
    "#   #   #  .  #",
    "#   #   #     #",
    "#   #####     #",
    "#      .      #",
    "#             #",
    "###############",
  ],
};

export async function generateOne(
  arena: LevelJson,
  boxCount: number,
  reverseSteps: number,
  targetPushRange: [number, number] = [8, 30],
): Promise<{ level: LevelJson; solution: string; pushes: number } | null> {
  const solved = makeSolvedState(arena, boxCount);

  // random reverse moves
  let cur = solved;
  for (let i = 0; i < reverseSteps; i++) {
    const next = randomReversePull(cur);
    if (next) cur = next;
  }

  // Ensure not already solved
  if (isAllOnGoals(cur)) return null;

  // Solve & filter difficulty
  const result = await solveMinPushes(cur, 120_000);
  if (!result.ok || !result.steps) return null;
  const pushes = result.minPushes ?? 0;
  if (pushes < targetPushRange[0] || pushes > targetPushRange[1]) return null;

  const level = toLevelJson(
    cur,
    `gen-${Date.now()}`,
    `Generated (${pushes} pushes)`,
  );
  const solution = result.steps
    .map((s) => (s.pushed ? dirToChar(s.dir).toUpperCase() : dirToChar(s.dir)))
    .join("");
  return { level, solution, pushes };
}

function dirToChar(d: Dir): string {
  return ({ U: "u", D: "d", L: "l", R: "r" } as const)[d];
}

function makeSolvedState(arena: LevelJson, boxCount: number): GameState {
  // Parse arena manually (no @ or $ inside).
  const h = arena.map.length;
  const w = Math.max(...arena.map.map((r) => r.length));
  const walls = new Uint8Array(w * h);
  const goals: number[] = [];
  const boxes = new Uint8Array(w * h);

  for (let y = 0; y < h; y++) {
    const row = arena.map[y].padEnd(w, " ");
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      const i = y * w + x;
      if (ch === "#") walls[i] = 1;
      if (ch === ".") goals.push(i);
    }
  }

  if (goals.length < boxCount)
    throw new Error("Arena has fewer goals than requested boxCount.");

  // Place boxes on a subset of goals
  shuffle(goals);
  for (let i = 0; i < boxCount; i++) boxes[goals[i]] = 1;

  // Place player on a reachable empty floor (choose first).
  // We temporarily set a player somewhere and then use reachable to find free space.
  let player = findAnyFloor(walls, boxes);
  const s: GameState = {
    w,
    h,
    walls,
    goals: goalsToArray(goals, w * h),
    boxes,
    player,
  };
  const reach = reachable(s);
  const reachableFloors: number[] = [];
  for (let i = 0; i < reach.length; i++) {
    if (reach[i] && !walls[i] && !boxes[i]) reachableFloors.push(i);
  }
  shuffle(reachableFloors);
  s.player = reachableFloors[0] ?? player;
  return s;
}

function goalsToArray(goals: number[], n: number): Uint8Array {
  const g = new Uint8Array(n);
  for (const i of goals) g[i] = 1;
  return g;
}

function findAnyFloor(walls: Uint8Array, boxes: Uint8Array): number {
  for (let i = 0; i < walls.length; i++) {
    if (!walls[i] && !boxes[i]) return i;
  }
  throw new Error("No floor cell found.");
}

function shuffle<T>(a: T[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
}

/**
 * Reverse action: pull a box.
 * Equivalent to: player stands adjacent to a box, and pulls it into player's current cell,
 * while player steps one cell away (opposite direction).
 *
 * Implementation:
 * - Pick a direction.
 * - Let box be at (player + dir). Must exist.
 * - Let back be at (player - dir). Must be empty floor.
 * - Then move box into player cell, move player to back cell.
 */
function randomReversePull(s: GameState): GameState | null {
  const { w, h } = s;

  // where can the player actually stand (ignoring boxes as walls)? reachable() already does that.
  const reach = reachable(s);
  const candidates: number[] = [];
  for (let i = 0; i < reach.length; i++) {
    if (!reach[i]) continue;
    if (s.walls[i] || s.boxes[i]) continue; // must be standable
    candidates.push(i);
  }
  if (candidates.length === 0) return null;

  shuffle(candidates);

  const dirs: Dir[] = ["U", "D", "L", "R"];

  for (const p of candidates) {
    const { x, y } = xy(p, w);

    shuffle(dirs);
    for (const dir of dirs) {
      const dd = DIRS[dir];
      const bx = x + dd.dx;
      const by = y + dd.dy;
      const backx = x - dd.dx;
      const backy = y - dd.dy;
      if (bx < 0 || bx >= w || by < 0 || by >= h) continue;
      if (backx < 0 || backx >= w || backy < 0 || backy >= h) continue;

      const bi = by * w + bx;
      const backi = backy * w + backx;

      // Pull preconditions
      if (!s.boxes[bi]) continue;                 // must have a box to pull
      if (s.walls[backi] || s.boxes[backi]) continue; // back cell must be empty

      const ns = cloneLevel(s);
      ns.player = p;          // player must be at p (reachable)
      ns.boxes[bi] = 0;
      ns.boxes[p] = 1;
      ns.player = backi;
      return ns;
    }
  }

  return null;
}

function isAllOnGoals(s: GameState): boolean {
  for (let i = 0; i < s.boxes.length; i++) {
    if (s.boxes[i] && !s.goals[i]) return false;
  }
  return true;
}

function toLevelJson(s: GameState, id: string, title: string): LevelJson {
  const rows: string[] = [];
  for (let y = 0; y < s.h; y++) {
    let row = "";
    for (let x = 0; x < s.w; x++) {
      const i = y * s.w + x;
      const wall = s.walls[i] === 1;
      const goal = s.goals[i] === 1;
      const box = s.boxes[i] === 1;
      const player = s.player === i;

      let ch = " ";
      if (wall) ch = "#";
      else if (goal) ch = ".";
      if (box && goal) ch = "*";
      else if (box) ch = "$";
      if (player && goal) ch = "+";
      else if (player) ch = "@";

      row += ch;
    }
    rows.push(row.replace(/\s+$/g, "")); // trim right
  }

  return { id, title, map: rows };
}
