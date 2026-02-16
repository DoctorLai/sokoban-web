import { describe, it, expect } from "vitest";
import { stateFromAscii } from "../testUtils";
import { isCornerDeadlock } from "./deadlock";

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
