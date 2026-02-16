import { describe, it, expect } from "vitest";
import { solveMinPushes } from "./solver";
import { stateFromAscii } from "../testUtils";

describe("Solver sanity", () => {
  it("solves a tiny 1-box puzzle", async () => {
    const s = stateFromAscii(["#####", "#.@ #", "# $ #", "# . #", "#####"]);

    const res = await solveMinPushes(s, 50_000);
    expect(res.ok).toBe(true);
    expect(res.steps && res.steps.length).toBeGreaterThan(0);
    expect(res.minPushes).toBeGreaterThanOrEqual(1);
  });

  it("returns ok with 0 pushes when already solved (box on goal)", async () => {
    const s = stateFromAscii(["#####", "#.@ #", "# * #", "#   #", "#####"]);

    const res = await solveMinPushes(s, 50_000);
    expect(res.ok).toBe(true);
    expect(res.minPushes).toBe(0);
    if (res.steps) expect(res.steps.length).toBe(0);
  });

  it("returns ok with 0 pushes when there are no boxes", async () => {
    const s = stateFromAscii(["#####", "#.@ #", "#   #", "# . #", "#####"]);

    const res = await solveMinPushes(s, 50_000);
    expect(res.ok).toBe(true);
    expect(res.minPushes).toBe(0);
  });

  it("returns not ok for an unsolvable puzzle (box stuck in corner, goal elsewhere)", async () => {
    // Box in top-left corner interior; cannot be pulled out.
    const s = stateFromAscii(["#####", "#$@ #", "#   #", "# . #", "#####"]);
    const res = await solveMinPushes(s, 50_000);

    expect(res.ok).toBe(false);
  });

  it("returns not ok when search budget is too small", async () => {
    const s = stateFromAscii(["#####", "#.@ #", "# $ #", "# . #", "#####"]);

    const res = await solveMinPushes(s, 1); // absurdly low
    expect(res.ok).toBe(false);
  });

  it("handles tighter corridors (smoke test)", async () => {
    const s = stateFromAscii([
      "########",
      "#.  @  #",
      "#  ##$ #",
      "#     ##",
      "########",
    ]);

    const res = await solveMinPushes(s, 200_000);
    expect(typeof res.ok).toBe("boolean");
    expect(
      typeof res.minPushes === "number" || res.minPushes === undefined,
    ).toBe(true);
  });

  it("multi-box: solved state with all boxes on goals => 0 pushes", async () => {
    const s = stateFromAscii([
      "#######",
      "#.@   #",
      "# **  #",
      "#     #",
      "#######",
    ]);

    const res = await solveMinPushes(s, 50_000);
    expect(res.ok).toBe(true);
    expect(res.minPushes).toBe(0);
  });

  it("multi-box: basic solvable smoke test", async () => {
    const s = stateFromAscii([
      "########",
      "#.@    #",
      "# $$   #",
      "# ..   #",
      "#      #",
      "########",
    ]);

    const res = await solveMinPushes(s, 500_000);
    expect(res.ok).toBe(true);
    expect(res.minPushes).toBeGreaterThanOrEqual(1);
    expect(res.steps && res.steps.length).toBeGreaterThan(0);
  });
});
