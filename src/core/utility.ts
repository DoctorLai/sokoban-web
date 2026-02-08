
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export { clamp, sleep };