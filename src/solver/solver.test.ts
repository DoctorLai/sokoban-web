import { describe, it, expect } from "vitest";
import { solveMinPushes } from "./solver";
import { stateFromAscii } from "../testUtils";

describe("Solver sanity", () => {
  it("solves a tiny 1-box puzzle", async () => {
    const s = stateFromAscii(["#####", "#.@ #", "# $ #", "# . #", "#####"]);

    // This puzzle might be solvable in a few pushes depending on layout
    const res = await solveMinPushes(s, 50_000);
    expect(res.ok).toBe(true);
    expect(res.steps && res.steps.length).toBeGreaterThan(0);
    expect(res.minPushes).toBeGreaterThanOrEqual(1);
  });
});
