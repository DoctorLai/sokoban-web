import { describe, it, expect } from "vitest";
import { applyMove, isWin, History, formatSteps } from "./state";
import type { StepInfo } from "../types";
import { stateFromAscii } from "../testUtils";

describe("Sokoban core movement", () => {
  it("walks into empty space", () => {
    const s = stateFromAscii(["#####", "# @ #", "#   #", "#####"]);

    const r = applyMove(s, "D");
    expect(r.changed).toBe(true);
    expect(r.pushed).toBe(false);
  });

  it("cannot walk through walls", () => {
    const s = stateFromAscii(["#####", "#@  #", "#####"]);

    const r = applyMove(s, "U");
    expect(r.changed).toBe(false);
  });

  it("pushes a box when space behind is free", () => {
    const s = stateFromAscii(["######", "#@$  #", "#    #", "######"]);

    const r = applyMove(s, "R");
    expect(r.changed).toBe(true);
    expect(r.pushed).toBe(true);

    // After pushing right, player stands where box was
    // and box moved one cell right.
    // Just verify win is false and there is still 1 box.
    let boxCount = 0;
    for (const v of s.boxes) boxCount += v ? 1 : 0;
    expect(boxCount).toBe(1);
  });

  it("does not push box into another box", () => {
    const s = stateFromAscii(["#######", "#@$$  #", "#     #", "#######"]);

    const r = applyMove(s, "R");
    expect(r.changed).toBe(false);
  });

  it("win condition: all boxes on goals", () => {
    const s = stateFromAscii([
      "#####",
      "#*@ #", // * = box on goal
      "#####",
    ]);
    expect(isWin(s)).toBe(true);
  });

  it("undo/redo works", () => {
    const s = stateFromAscii(["#####", "# @ #", "#   #", "#####"]);

    const hist = new History();
    hist.init(s);

    applyMove(s, "D");
    hist.push(s);

    const posAfter = s.player;
    expect(hist.undo(s)).toBe(true);
    expect(s.player).not.toBe(posAfter);

    expect(hist.redo(s)).toBe(true);
    expect(s.player).toBe(posAfter);
  });
});

describe("applyMove edge cases", () => {
  it("does not push a box into a wall", () => {
    const s = stateFromAscii(["#####", "#@$##", "#   #", "#####"]);
    const r = applyMove(s, "R");
    expect(r.changed).toBe(false);
    expect(r.pushed).toBe(false);
  });

  it("does not walk out of bounds at the grid edge", () => {
    // Player at the very top row with no wall above; moving up leaves the grid.
    const s = stateFromAscii(["@  ", "   ", "   "]);
    const r = applyMove(s, "U");
    expect(r.changed).toBe(false);
  });

  it("moves the player onto the pushed box's former cell", () => {
    const s = stateFromAscii(["######", "#@$  #", "######"]);
    const before = s.player;
    const r = applyMove(s, "R");
    expect(r.changed).toBe(true);
    expect(r.pushed).toBe(true);
    expect(s.player).toBe(before + 1);
    // box advanced two cells from the player's original position
    expect(s.boxes[before + 2]).toBe(1);
  });

  it("isWin is false while a box sits off a goal", () => {
    const s = stateFromAscii(["#####", "#@$.#", "#####"]);
    expect(isWin(s)).toBe(false);
  });
});

describe("History details", () => {
  it("undo refuses to go past the initial state", () => {
    const s = stateFromAscii(["#####", "# @ #", "#####"]);
    const hist = new History();
    hist.init(s);
    expect(hist.undo(s)).toBe(false);
  });

  it("redo returns false when there is nothing to redo", () => {
    const s = stateFromAscii(["#####", "# @ #", "#   #", "#####"]);
    const hist = new History();
    hist.init(s);
    expect(hist.redo(s)).toBe(false);
  });

  it("a fresh move clears the redo branch", () => {
    const s = stateFromAscii(["#####", "# @ #", "#   #", "#   #", "#####"]);
    const hist = new History();
    hist.init(s);

    applyMove(s, "D");
    hist.push(s);
    expect(hist.undo(s)).toBe(true);

    // Redo is available...
    expect(hist.stats().redo).toBe(1);
    // ...until a new move overwrites the future.
    applyMove(s, "R");
    hist.push(s);
    expect(hist.stats().redo).toBe(0);
    expect(hist.redo(s)).toBe(false);
  });

  it("reset returns to the first recorded state and clears history", () => {
    const s = stateFromAscii(["#####", "# @ #", "#   #", "#   #", "#####"]);
    const hist = new History();
    hist.init(s);
    const start = s.player;

    applyMove(s, "D");
    hist.push(s);
    applyMove(s, "D");
    hist.push(s);
    expect(hist.stats().undo).toBe(2);

    hist.reset(s);
    expect(s.player).toBe(start);
    expect(hist.stats()).toEqual({ undo: 0, redo: 0 });
  });

  it("reset is a no-op when the history was never initialized", () => {
    const s = stateFromAscii(["#####", "# @ #", "#####"]);
    const before = s.player;
    const hist = new History();
    hist.reset(s);
    expect(s.player).toBe(before);
  });

  it("stats reports undo and redo depth", () => {
    const s = stateFromAscii(["#####", "# @ #", "#   #", "#   #", "#####"]);
    const hist = new History();
    hist.init(s);
    expect(hist.stats()).toEqual({ undo: 0, redo: 0 });

    applyMove(s, "D");
    hist.push(s);
    expect(hist.stats()).toEqual({ undo: 1, redo: 0 });

    hist.undo(s);
    expect(hist.stats()).toEqual({ undo: 0, redo: 1 });
  });
});

describe("formatSteps", () => {
  it("renders walks lowercase and pushes uppercase", () => {
    const steps: StepInfo[] = [
      { dir: "U", pushed: false },
      { dir: "R", pushed: true },
      { dir: "D", pushed: false },
      { dir: "L", pushed: true },
    ];
    expect(formatSteps(steps)).toBe("uRdL");
  });

  it("returns an empty string for no steps", () => {
    expect(formatSteps([])).toBe("");
  });
});
