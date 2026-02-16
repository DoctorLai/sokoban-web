import { describe, it, expect } from "vitest";
import { stateFromAscii } from "./testUtils";

const idx = (x: number, y: number, w: number) => y * w + x;

describe("stateFromAscii", () => {
  it("parses width/height and pads short rows with spaces", () => {
    const s = stateFromAscii([
      "####",
      "#@ #",
      "###", // shorter row -> should be padded to width 4
    ]);

    expect(s.w).toBe(4);
    expect(s.h).toBe(3);

    // (3,2) is in the padded area; should be empty (no wall/goal/box)
    const i = idx(3, 2, s.w);
    expect(s.walls[i]).toBe(0);
    expect(s.goals[i]).toBe(0);
    expect(s.boxes[i]).toBe(0);
  });

  it("sets walls from '#'", () => {
    const s = stateFromAscii(["###", "#@#", "###"]);
    const w = s.w;

    expect(s.walls[idx(0, 0, w)]).toBe(1);
    expect(s.walls[idx(1, 0, w)]).toBe(1);
    expect(s.walls[idx(2, 2, w)]).toBe(1);

    // player cell is not a wall unless explicitly '#'
    expect(s.walls[s.player]).toBe(0);
  });

  it("sets goals from '.', '+', '*'", () => {
    const s = stateFromAscii(["#####", "#.@ #", "# + #", "# * #", "#####"]);
    const w = s.w;

    expect(s.goals[idx(1, 1, w)]).toBe(1); // '.'
    expect(s.goals[idx(2, 2, w)]).toBe(1); // '+'
    expect(s.goals[idx(2, 3, w)]).toBe(1); // '*'
  });

  it("sets boxes from '$' and '*'", () => {
    const s = stateFromAscii(["#####", "#.$ #", "# * #", "# @ #", "#####"]);
    const w = s.w;

    expect(s.boxes[idx(2, 1, w)]).toBe(1); // '$'
    expect(s.boxes[idx(2, 2, w)]).toBe(1); // '*'

    // '*' implies goal too
    expect(s.goals[idx(2, 2, w)]).toBe(1);
  });

  it("sets player from '@' and '+'", () => {
    const s1 = stateFromAscii(["#####", "# @ #", "#####"]);
    expect(s1.player).toBe(idx(2, 1, s1.w));

    const s2 = stateFromAscii(["#####", "# + #", "#####"]);
    expect(s2.player).toBe(idx(2, 1, s2.w));
    expect(s2.goals[s2.player]).toBe(1); // '+' implies goal
  });

  it("throws if map is missing player", () => {
    expect(() => stateFromAscii(["#####", "# . #", "#####"])).toThrow(
      /missing player/i,
    );
  });

  it("if multiple players exist, last one wins (current behavior)", () => {
    const s = stateFromAscii(["#####", "#@  #", "#  @#", "#####"]);
    expect(s.player).toBe(idx(3, 2, s.w)); // last '@'
  });

  it("produces arrays of size w*h", () => {
    const s = stateFromAscii(["######", "#.@$ #", "######"]);
    const n = s.w * s.h;
    expect(s.walls.length).toBe(n);
    expect(s.goals.length).toBe(n);
    expect(s.boxes.length).toBe(n);
  });
});
