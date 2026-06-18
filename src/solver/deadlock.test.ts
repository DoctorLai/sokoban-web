import { describe, it, expect } from "vitest";
import { stateFromAscii } from "../testUtils";
import {
  isCornerDeadlock,
  computeDeadSquares,
  hasDeadSquare,
} from "./deadlock";

const idx = (x: number, y: number, w: number) => y * w + x;

describe("deadlock: isCornerDeadlock", () => {
  it("detects a box stuck in a wall-corner (not on goal)", () => {
    // Box at (1,1) has walls above and left -> corner deadlock
    const s = stateFromAscii(["#####", "#$  #", "# @ #", "# . #", "#####"]);

    expect(isCornerDeadlock(s)).toBe(true);
  });

  it("detects 2x2 deadlock", () => {
    const s = stateFromAscii(["@#", "#$"]);

    expect(isCornerDeadlock(s)).toBe(true);
  });

  it("does not flag if it is a valid position", () => {
    const s = stateFromAscii(["###", "@$."]);

    expect(isCornerDeadlock(s)).toBe(false);
  });

  it("does NOT flag a box in a corner if the box is on a goal", () => {
    // '*' = box on goal
    const s = stateFromAscii(["#####", "#*  #", "# @ #", "#   #", "#####"]);

    expect(isCornerDeadlock(s)).toBe(false);
  });

  it("does NOT flag when the box is not in a corner", () => {
    const s = stateFromAscii(["#####", "# @ #", "# $ #", "# . #", "#####"]);

    expect(isCornerDeadlock(s)).toBe(false);
  });

  it("treats level boundary as blocked (corner at boundary)", () => {
    // Put a box at the top edge (y=0). Boundary counts as blocked.
    // Board has no top wall line; boundary should still act blocked.
    const s = stateFromAscii(["  $  ", "  @  ", "  .  "]);

    expect(isCornerDeadlock(s)).toBe(false);
  });
});

describe("deadlock: computeDeadSquares", () => {
  it("marks the corners of an open room as dead", () => {
    // Open 4x4 interior with a single goal: the four corners can never be
    // pushed out (the pusher would have to stand on a wall), so they are dead.
    const s = stateFromAscii([
      "######",
      "# @  #",
      "#    #",
      "#  . #",
      "#    #",
      "######",
    ]);
    const dead = computeDeadSquares(s);
    const w = s.w;

    expect(dead[idx(1, 1, w)]).toBe(1);
    expect(dead[idx(4, 1, w)]).toBe(1);
    expect(dead[idx(1, 4, w)]).toBe(1);
    expect(dead[idx(4, 4, w)]).toBe(1);

    // The goal cell and a reachable interior cell are alive.
    expect(dead[idx(3, 3, w)]).toBe(0);
    expect(dead[idx(2, 2, w)]).toBe(0);
  });

  it("never marks wall cells as dead", () => {
    const s = stateFromAscii(["#####", "#@. #", "#####"]);
    const dead = computeDeadSquares(s);
    for (let i = 0; i < dead.length; i++) {
      if (s.walls[i]) expect(dead[i]).toBe(0);
    }
  });

  it("keeps the pushable corridor cells live but a wall-backed cell dead", () => {
    const s = stateFromAscii(["#######", "#@   .#", "#######"]);
    const dead = computeDeadSquares(s);
    const w = s.w;
    // Cells x=2..5 can be pushed right onto the goal at x=5.
    for (let x = 2; x <= 5; x++) {
      expect(dead[idx(x, 1, w)]).toBe(0);
    }
    // x=1 cannot be pushed right (the pusher cell x=0 is a wall) -> dead.
    expect(dead[idx(1, 1, w)]).toBe(1);
  });
});

describe("deadlock: hasDeadSquare", () => {
  it("flags a non-goal box that sits on a dead square", () => {
    const s = stateFromAscii(["#####", "#$  #", "# . #", "#  @#", "#####"]);
    const dead = computeDeadSquares(s);
    expect(hasDeadSquare(s, dead)).toBe(true);
  });

  it("does not flag a box that rests on a goal", () => {
    const s = stateFromAscii(["#####", "#*  #", "#   #", "#  @#", "#####"]);
    const dead = computeDeadSquares(s);
    expect(hasDeadSquare(s, dead)).toBe(false);
  });

  it("returns false when no box is on a dead square", () => {
    const s = stateFromAscii(["#######", "#@ $ .#", "#######"]);
    const dead = computeDeadSquares(s);
    expect(hasDeadSquare(s, dead)).toBe(false);
  });
});
