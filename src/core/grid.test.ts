import { describe, it, expect } from "vitest";
import { idx, xy, DIRS, step, inBounds } from "./grid";

describe("grid: idx / xy", () => {
  it("idx and xy are inverse of each other", () => {
    const w = 7;
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < w; x++) {
        const i = idx(x, y, w);
        expect(i).toBe(y * w + x);
        expect(xy(i, w)).toEqual({ x, y });
      }
    }
  });
});

describe("grid: DIRS", () => {
  it("maps each direction to the expected unit delta", () => {
    expect(DIRS.U).toEqual({ dx: 0, dy: -1 });
    expect(DIRS.D).toEqual({ dx: 0, dy: 1 });
    expect(DIRS.L).toEqual({ dx: -1, dy: 0 });
    expect(DIRS.R).toEqual({ dx: 1, dy: 0 });
  });
});

describe("grid: step", () => {
  it("moves the index by one cell in each direction", () => {
    const w = 5;
    const start = idx(2, 2, w);
    expect(step(start, "U", w)).toBe(idx(2, 1, w));
    expect(step(start, "D", w)).toBe(idx(2, 3, w));
    expect(step(start, "L", w)).toBe(idx(1, 2, w));
    expect(step(start, "R", w)).toBe(idx(3, 2, w));
  });
});

describe("grid: inBounds", () => {
  it("returns true for indices inside the grid", () => {
    expect(inBounds(0, 4, 4)).toBe(true);
    expect(inBounds(15, 4, 4)).toBe(true);
  });

  it("returns false for negative or overflowing indices", () => {
    expect(inBounds(-1, 4, 4)).toBe(false);
    expect(inBounds(16, 4, 4)).toBe(false);
  });
});
