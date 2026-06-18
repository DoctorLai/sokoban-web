import { describe, it, expect, afterEach } from "vitest";
import { DEFAULT_ARENA, generateOne } from "./generate";
import { parseLevel } from "../core/level";
import { applyMove, isWin } from "../core/state";
import { solveMinPushes } from "../solver/solver";
import type { Dir } from "../types";

// Deterministic RNG so the (randomised) generator is reproducible in CI.
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const realRandom = Math.random;
afterEach(() => {
  Math.random = realRandom;
});

const charToDir: Record<string, Dir> = {
  u: "U",
  d: "D",
  l: "L",
  r: "R",
  U: "U",
  D: "D",
  L: "L",
  R: "R",
};

describe("DEFAULT_ARENA", () => {
  it("is a rectangular arena with goal cells and no player/boxes", () => {
    expect(DEFAULT_ARENA.map.length).toBeGreaterThan(0);
    const joined = DEFAULT_ARENA.map.join("");
    expect(joined).toContain("#");
    expect(joined).toContain(".");
    expect(joined).not.toContain("@");
    expect(joined).not.toContain("$");
  });
});

describe("generateOne", () => {
  it("produces a solvable level within the requested push range", async () => {
    Math.random = mulberry32(12345);

    const range: [number, number] = [4, 30];
    let gen = null;
    for (let i = 0; i < 50 && !gen; i++) {
      gen = await generateOne(DEFAULT_ARENA, 2, 60, range);
    }

    expect(gen).not.toBeNull();
    if (!gen) return;

    // Reported difficulty respects the requested range.
    expect(gen.pushes).toBeGreaterThanOrEqual(range[0]);
    expect(gen.pushes).toBeLessThanOrEqual(range[1]);

    // The generated map parses and actually contains a player.
    const parsed = parseLevel(gen.level);
    expect(parsed.player).toBeGreaterThanOrEqual(0);

    // Replaying the reported solution string reaches a win.
    let s = parseLevel(gen.level);
    for (const ch of gen.solution) {
      applyMove(s, charToDir[ch]);
    }
    expect(isWin(s)).toBe(true);

    // The solver independently confirms the same minimum push count.
    const res = await solveMinPushes(parseLevel(gen.level), 200_000);
    expect(res.ok).toBe(true);
    expect(res.minPushes).toBe(gen.pushes);
  });

  it("returns null when the puzzle stays solved (range impossible to hit)", async () => {
    Math.random = mulberry32(7);
    // An impossible push range guarantees rejection.
    const gen = await generateOne(DEFAULT_ARENA, 2, 60, [9999, 9999]);
    expect(gen).toBeNull();
  });

  it("throws when the arena has fewer goals than requested boxes", async () => {
    await expect(generateOne(DEFAULT_ARENA, 999, 10)).rejects.toThrow(
      /fewer goals/i,
    );
  });
});
