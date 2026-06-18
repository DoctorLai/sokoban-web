import { describe, it, expect } from "vitest";
import { stateFromAscii } from "../testUtils";
import {
  reachable,
  shortestWalkPath,
  buildWalkTree,
  walkPathFromTree,
} from "./reach";

// helper: count reachable cells
function count1(a: Uint8Array) {
  let c = 0;
  for (const v of a) c += v ? 1 : 0;
  return c;
}

// helper: simulate walking a path (no pushing)
function walkIndex(
  s: ReturnType<typeof stateFromAscii>,
  start: number,
  path: string,
) {
  let cur = start;
  const w = s.w;

  for (const ch of path) {
    const x = cur % w;
    const y = Math.floor(cur / w);
    let nx = x,
      ny = y;
    if (ch === "u") ny--;
    else if (ch === "d") ny++;
    else if (ch === "l") nx--;
    else if (ch === "r") nx++;
    else throw new Error(`bad step ${ch}`);

    const ni = ny * w + nx;
    // must remain in bounds and not step into wall/box
    expect(nx).toBeGreaterThanOrEqual(0);
    expect(nx).toBeLessThan(w);
    expect(ny).toBeGreaterThanOrEqual(0);
    expect(ny).toBeLessThan(s.h);
    expect(s.walls[ni]).toBeFalsy();
    expect(s.boxes[ni]).toBeFalsy();

    cur = ni;
  }
  return cur;
}

describe("reach: reachable()", () => {
  it("treats boxes as blocked (cannot walk through boxes)", () => {
    const s = stateFromAscii(["#####", "#@  #", "# $ #", "#   #", "#####"]);
    const vis = reachable(s);

    const boxI = 2 * s.w + 2; // (2,2)
    expect(s.boxes[boxI]).toBe(1);
    expect(vis[boxI]).toBe(0);
  });

  it("reaches all free floor in an open room (no walls/boxes inside)", () => {
    const s = stateFromAscii(["#####", "#@  #", "#   #", "#   #", "#####"]);
    const vis = reachable(s);

    // interior is 3x3 = 9 cells
    expect(count1(vis)).toBe(9);
  });
});

describe("reach: shortestWalkPath()", () => {
  it("returns empty string when start == goal", () => {
    const s = stateFromAscii(["#####", "#@  #", "#   #", "#####"]);
    const start = s.player;
    const path = shortestWalkPath(s, start, start);
    expect(path).toBe("");
  });

  it("avoids walking through boxes", () => {
    const s = stateFromAscii(["#####", "#@  #", "# $ #", "#   #", "#####"]);

    const start = s.player;
    const goal = 3 * s.w + 3; // (3,3)
    const path = shortestWalkPath(s, start, goal);
    expect(path).not.toBeNull();

    const end = walkIndex(s, start, path!);
    expect(end).toBe(goal);
  });

  it("returns a shortest path in an open room (Manhattan distance)", () => {
    const s = stateFromAscii(["#####", "#@  #", "#   #", "#   #", "#####"]);

    const start = s.player; // (1,1)
    const goal = 3 * s.w + 3; // (3,3)
    const path = shortestWalkPath(s, start, goal);
    expect(path).not.toBeNull();

    // In open space shortest length should equal Manhattan distance = 4
    expect(path!.length).toBe(4);

    const end = walkIndex(s, start, path!);
    expect(end).toBe(goal);
  });

  it("respects walls by routing around them", () => {
    const s = stateFromAscii([
      "#######",
      "#@ #  #",
      "#  #  #",
      "#     #",
      "#######",
    ]);
    // start @ at (1,1); goal at (5,1)
    const start = s.player;
    const goal = 1 * s.w + 5;

    const path = shortestWalkPath(s, start, goal);
    expect(path).not.toBeNull();

    // ensure it actually reaches the goal without stepping into walls/boxes
    const end = walkIndex(s, start, path!);
    expect(end).toBe(goal);

    // there is a wall column at x=3 forcing a detour, so path must be > 4
    expect(path!.length).toBeGreaterThan(4);
  });

  it("returns null when the goal is walled off", () => {
    // The right room is sealed off from the player by a full wall column.
    const s = stateFromAscii(["#######", "#@ # .#", "#  #  #", "#######"]);
    const start = s.player;
    const goal = 1 * s.w + 5; // the goal cell inside the sealed room

    expect(shortestWalkPath(s, start, goal)).toBeNull();
  });
});

describe("reach: buildWalkTree / walkPathFromTree", () => {
  it("marks the start cell as reached with itself as predecessor", () => {
    const s = stateFromAscii(["#####", "#@  #", "#   #", "#####"]);
    const tree = buildWalkTree(s, s.player);
    expect(tree.reach[s.player]).toBe(1);
    expect(tree.prev[s.player]).toBe(s.player);
  });

  it("does not expand through boxes", () => {
    const s = stateFromAscii(["#####", "#@  #", "# $ #", "#   #", "#####"]);
    const tree = buildWalkTree(s, s.player);
    const boxI = 2 * s.w + 2;
    expect(tree.reach[boxI]).toBe(0);
    expect(tree.prev[boxI]).toBe(-1);
  });

  it("walkPathFromTree returns empty string for start == goal", () => {
    const s = stateFromAscii(["#####", "#@  #", "#   #", "#####"]);
    const tree = buildWalkTree(s, s.player);
    expect(walkPathFromTree(tree, s.player, s.player)).toBe("");
  });

  it("walkPathFromTree returns null for an unreachable goal", () => {
    const s = stateFromAscii(["#######", "#@ # .#", "#  #  #", "#######"]);
    const tree = buildWalkTree(s, s.player);
    const goal = 1 * s.w + 5;
    expect(walkPathFromTree(tree, s.player, goal)).toBeNull();
  });

  it("a single tree reproduces multiple shortest walk paths", () => {
    const s = stateFromAscii(["#####", "#@  #", "#   #", "#   #", "#####"]);
    const tree = buildWalkTree(s, s.player);

    const a = walkPathFromTree(tree, s.player, 1 * s.w + 3); // (3,1)
    const b = walkPathFromTree(tree, s.player, 3 * s.w + 3); // (3,3)
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a!.length).toBe(2); // Manhattan distance from (1,1)
    expect(b!.length).toBe(4);
  });
});
