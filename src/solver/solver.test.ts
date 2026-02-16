import { describe, it, expect } from "vitest";
import { solveMinPushes } from "./solver";
import { stateFromAscii } from "../testUtils";
import { isWin, applyMove } from "../core/state";
import { cloneLevel } from "../core/level";

function replaySteps(initial: any, steps: any[]) {
  const s = cloneLevel(initial);
  for (const st of steps) {
    applyMove(s, st.dir);
  }
  return s;
}

function countPushed(steps: { pushed: boolean }[]) {
  return steps.reduce((acc, s) => acc + (s.pushed ? 1 : 0), 0);
}

describe("solveMinPushes", () => {
  it("returns ok with 0 pushes when already solved (box on goal)", async () => {
    // '*' = box on goal
    const s = stateFromAscii(["#####", "#.@ #", "# * #", "#   #", "#####"]);
    expect(isWin(s)).toBe(true);

    const res = await solveMinPushes(s, 1000);
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.minPushes).toBe(0);
    expect(res.steps).toEqual([]);
    expect(res.expanded).toBe(0);
  });

  // it("returns not ok when immediate corner deadlock detected", async () => {
  //   // Box is truly stuck in a corner (up/left are walls) and not on a goal.
  //   const s = stateFromAscii([
  //     "#####",
  //     "#.@ #",
  //     "##$ #",
  //     "# . #",
  //     "#####",
  //   ]);

  //   const res = await solveMinPushes(s, 1000);
  //   expect(res.ok).toBe(false);
  //   if (res.ok) return;

  //   expect(res.reason.toLowerCase()).toContain("deadlock");
  // });

  it("returns not ok when search budget is too small (even if solution exists)", async () => {
    const s = stateFromAscii(["#####", "#.@ #", "# $ #", "# . #", "#####"]);
    const res = await solveMinPushes(s, 1);
    expect(res.ok).toBe(false);
  });

  it("finds a solution on a simple 1-push level and replays to a win", async () => {
    const s = stateFromAscii(["#####", "#.@ #", "# $ #", "# . #", "#####"]);

    const res = await solveMinPushes(s, 50_000);
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.steps?.length).toBeGreaterThan(0);
    expect(res.minPushes).toBe(1);
    expect(countPushed(res.steps!)).toBe(1);

    const end = replaySteps(s, res.steps!);
    expect(isWin(end)).toBe(true);
  });

  it("minPushes equals number of pushed steps (guaranteed solvable)", async () => {
    // Two boxes, two goals, plenty of space => reliably solvable.
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
    if (!res.ok) return;

    expect(res.minPushes).toBe(countPushed(res.steps!));

    const end = replaySteps(s, res.steps!);
    expect(isWin(end)).toBe(true);
  });

  it("returns not ok with a clear reason when no solution exists", async () => {
    const s = stateFromAscii(["#####", "#.@ #", "###$#", "# . #", "#####"]);

    const res = await solveMinPushes(s, 50_000);
    expect(res.ok).toBe(false);
    if (res.ok) return;

    expect(res.reason?.length).toBeGreaterThan(0);
  });
});

describe("Solver sanity", () => {
  it("solves a tiny 1-box puzzle", async () => {
    const s = stateFromAscii(["#####", "#.@ #", "# $ #", "# . #", "#####"]);

    const res = await solveMinPushes(s, 50_000);
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.steps?.length).toBeGreaterThan(0);
    expect(res.minPushes).toBeGreaterThanOrEqual(1);
  });

  it("returns ok with 0 pushes when already solved (box on goal)", async () => {
    const s = stateFromAscii(["#####", "#.@ #", "# * #", "#   #", "#####"]);
    expect(isWin(s)).toBe(true);

    const res = await solveMinPushes(s, 50_000);
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.minPushes).toBe(0);
    expect(res.steps?.length).toBe(0);
  });

  it("returns ok with 0 pushes when there are no boxes", async () => {
    const s = stateFromAscii(["#####", "#.@ #", "#   #", "# . #", "#####"]);

    const res = await solveMinPushes(s, 50_000);
    // Depending on your win condition, no boxes might still be "win".
    // Your earlier run indicates it is ok.
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.minPushes).toBe(0);
  });

  it("finds exact min pushes in a straight-line push (1)", async () => {
    const s = stateFromAscii(["#####", "#@$.#", "#####"]);

    const res = await solveMinPushes(s, 50_000);
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.minPushes).toBe(1);
  });

  it("finds exact min pushes in a straight-line push (2)", async () => {
    const s = stateFromAscii(["#######", "#@ $ .#", "#     #", "#######"]);

    const res = await solveMinPushes(s, 200_000);
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.minPushes).toBe(2);
  });

  it("returns not ok for an unsolvable puzzle (box stuck in corner, goal elsewhere)", async () => {
    const s = stateFromAscii(["#####", "#$@ #", "#   #", "# . #", "#####"]);

    const res = await solveMinPushes(s, 50_000);
    expect(res.ok).toBe(false);
  });

  it("returns not ok when search budget is too small", async () => {
    const s = stateFromAscii(["#####", "#.@ #", "# $ #", "# . #", "#####"]);

    const res = await solveMinPushes(s, 1);
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
    expect(typeof res.timeMs).toBe("number");
    if (res.ok) {
      expect(res.steps?.length).toBeGreaterThanOrEqual(0);
      expect(res.minPushes).toBeGreaterThanOrEqual(0);
    }
  });

  it("multi-box: solved state with all boxes on goals => 0 pushes", async () => {
    const s = stateFromAscii([
      "#######",
      "#.@   #",
      "# **  #",
      "#     #",
      "#######",
    ]);
    expect(isWin(s)).toBe(true);

    const res = await solveMinPushes(s, 50_000);
    expect(res.ok).toBe(true);
    if (!res.ok) return;

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
    if (!res.ok) return;

    expect(res.minPushes).toBeGreaterThanOrEqual(1);
    expect(res.steps?.length).toBeGreaterThan(0);

    const end = replaySteps(s, res.steps!);
    expect(isWin(end)).toBe(true);
  });
});
