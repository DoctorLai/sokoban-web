import { describe, it, expect } from "vitest";
import { parseLevel, cloneLevel, countBoxes } from "./level";
import type { LevelJson } from "../types";

const idx = (x: number, y: number, w: number) => y * w + x;

describe("parseLevel", () => {
  it("computes width from the longest row and pads short rows", () => {
    const level: LevelJson = {
      id: "t1",
      title: "pad",
      map: ["#####", "#@ #", "###"],
    };
    const p = parseLevel(level);

    expect(p.w).toBe(5);
    expect(p.h).toBe(3);
    expect(p.walls.length).toBe(15);

    // Padded cell (4,1) is empty floor, not a wall.
    expect(p.walls[idx(4, 1, p.w)]).toBe(0);
  });

  it("parses walls, goals, boxes and player from all glyphs", () => {
    const level: LevelJson = {
      id: "t2",
      title: "glyphs",
      map: ["#####", "#.$ #", "# *+#", "#####"],
    };
    const p = parseLevel(level);
    const w = p.w;

    // wall
    expect(p.walls[idx(0, 0, w)]).toBe(1);
    // '.' goal
    expect(p.goals[idx(1, 1, w)]).toBe(1);
    // '$' box (not goal)
    expect(p.boxes[idx(2, 1, w)]).toBe(1);
    expect(p.goals[idx(2, 1, w)]).toBe(0);
    // '*' box on goal
    expect(p.boxes[idx(2, 2, w)]).toBe(1);
    expect(p.goals[idx(2, 2, w)]).toBe(1);
    // '+' player on goal
    expect(p.player).toBe(idx(3, 2, w));
    expect(p.goals[idx(3, 2, w)]).toBe(1);
  });

  it("sets player from a plain '@'", () => {
    const p = parseLevel({ id: "t3", title: "p", map: ["###", "#@#", "###"] });
    expect(p.player).toBe(idx(1, 1, p.w));
    expect(p.goals[p.player]).toBe(0);
  });

  it("throws (with the level id) when there is no player", () => {
    expect(() =>
      parseLevel({ id: "missing", title: "x", map: ["###", "#.#", "###"] }),
    ).toThrow(/missing/);
  });
});

describe("cloneLevel", () => {
  it("produces a deep, independent copy of the typed arrays", () => {
    const original = parseLevel({
      id: "c1",
      title: "clone",
      map: ["#####", "#@$.#", "#####"],
    });
    const copy = cloneLevel(original);

    expect(copy).not.toBe(original);
    expect(copy.walls).not.toBe(original.walls);
    expect(copy.boxes).not.toBe(original.boxes);
    expect(copy.goals).not.toBe(original.goals);

    expect(Array.from(copy.walls)).toEqual(Array.from(original.walls));
    expect(copy.w).toBe(original.w);
    expect(copy.h).toBe(original.h);
    expect(copy.player).toBe(original.player);

    // Mutating the copy must not affect the original.
    copy.boxes[0] = 1;
    copy.player = 0;
    expect(original.boxes[0]).toBe(0);
    expect(original.player).not.toBe(0);
  });
});

describe("countBoxes", () => {
  it("counts the number of set cells", () => {
    const p = parseLevel({
      id: "n1",
      title: "boxes",
      map: ["#####", "#$$.#", "#@*.#", "#####"],
    });
    expect(countBoxes(p.boxes)).toBe(3);
  });

  it("returns 0 when there are no boxes", () => {
    const p = parseLevel({
      id: "n0",
      title: "none",
      map: ["###", "#@#", "###"],
    });
    expect(countBoxes(p.boxes)).toBe(0);
  });
});
