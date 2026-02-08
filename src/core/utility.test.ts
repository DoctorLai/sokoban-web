import { describe, it, expect } from "vitest";
import { clamp, sleep } from "./utility";

describe("clamp function", () => {
  it("clamps value within range", () => {
    expect(clamp(5, 1, 10)).toBe(5); // within range
    expect(clamp(-3, 0, 8)).toBe(0); // below range
    expect(clamp(15, 0, 10)).toBe(10); // above range
  });
});

describe("sleep function", () => {
  it("resolves after specified time", async () => {
    const start = Date.now();
    await sleep(103);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });
});
