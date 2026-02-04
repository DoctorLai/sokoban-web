import { describe, it, expect } from "vitest";
import { applyMove, isWin, History } from "./state";
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
