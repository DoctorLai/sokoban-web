import "./styles/main.css";
import { LEVELS } from "./levels/index";
import type { Dir, GameState, LevelJson, StepInfo } from "./types";
import { parseLevel, cloneLevel } from "./core/level";
import { Renderer } from "./core/render";
import { applyMove, History, isWin, formatSteps } from "./core/state";
import { solveMinPushes } from "./solver/solver";
import { sleep } from "./core/utility";
// import { DEFAULT_ARENA, generateOne } from "./generator/generate";

const canvas = document.getElementById("game") as HTMLCanvasElement;
const renderer = new Renderer(canvas);

const levelSelect = document.getElementById("levelSelect") as HTMLSelectElement;
const btnReset = document.getElementById("btnReset") as HTMLButtonElement;
const btnUndo = document.getElementById("btnUndo") as HTMLButtonElement;
const btnRedo = document.getElementById("btnRedo") as HTMLButtonElement;
const btnSolve = document.getElementById("btnSolve") as HTMLButtonElement;
const btnPlay = document.getElementById("btnPlay") as HTMLButtonElement;
// const btnGenerate = document.getElementById("btnGenerate") as HTMLButtonElement;
// const genBoxes = document.getElementById("genBoxes") as HTMLInputElement;
// const genSteps = document.getElementById("genSteps") as HTMLInputElement;

const statsEl = document.getElementById("stats") as HTMLPreElement;
const solEl = document.getElementById("solution") as HTMLPreElement;
const badge = document.getElementById("statusBadge") as HTMLSpanElement;

let currentLevel: LevelJson | null = null;
let state: GameState | null = null;
let levelInitial: GameState | null = null; // true initial state for current level
let history = new History();

let solutionSteps: StepInfo[] | null = null;
let playing = false;

function getLevelFromURL(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("level");
}

function setLevelToURL(id: string) {
  const params = new URLSearchParams(window.location.search);
  params.set("level", id);

  const newUrl = window.location.pathname + "?" + params.toString();

  window.history.replaceState({}, "", newUrl);
}

function setBadge(text: string) {
  badge.textContent = text;
}

function loadLevel(lv: LevelJson) {
  currentLevel = lv;

  // Update URL
  setLevelToURL(lv.id);

  const parsed = parseLevel(lv);

  levelInitial = cloneLevel(parsed);
  state = cloneLevel(parsed);
  state = parsed;

  history = new History();
  history.init(state);

  solutionSteps = null;
  solEl.textContent = "";

  setBadge("Ready");
  render();
}

function render() {
  if (!state) return;
  renderer.draw(state);

  const { undo, redo } = history.stats();
  const win = isWin(state);
  const boxes = countOnGoals(state);
  statsEl.textContent =
    `Level: ${currentLevel?.id ?? "-"}
` +
    `Title: ${currentLevel?.title ?? "-"}
` +
    `Undo: ${undo}  Redo: ${redo}
` +
    `Boxes on goals: ${boxes.onGoals}/${boxes.total}
` +
    `Win: ${win ? "YES" : "NO"}
`;
  if (win) setBadge("✅ Solved!");
}

function countOnGoals(s: GameState): { onGoals: number; total: number } {
  let onGoals = 0,
    total = 0;
  for (let i = 0; i < s.boxes.length; i++) {
    if (s.boxes[i]) {
      total++;
      if (s.goals[i]) onGoals++;
    }
  }
  return { onGoals, total };
}

function move(dir: Dir) {
  if (!state || playing) return;
  const beforeWin = isWin(state);
  const r = applyMove(state, dir);
  if (r.changed) {
    history.push(state);
    solutionSteps = null;
    solEl.textContent = "";
    render();
  }
  if (!beforeWin && isWin(state)) setBadge("✅ Solved!");
}

function reset() {
  if (playing) return;
  if (!levelInitial) return;

  // reset always means “back to the level’s real initial state”
  state = cloneLevel(levelInitial);

  history = new History();
  history.init(state);

  solutionSteps = null;
  solEl.textContent = "";
  setBadge("Ready");
  render();
}

function undo() {
  if (!state || playing) return;
  if (history.undo(state)) {
    solutionSteps = null;
    solEl.textContent = "";
    setBadge("Ready");
    render();
  }
}

function redo() {
  if (!state || playing) return;
  if (history.redo(state)) {
    setBadge("Ready");
    render();
  }
}

async function solve() {
  if (!state || playing) return;
  setBadge("Solving...");
  solEl.textContent = "Solving, please wait...";
  const snapshot = cloneLevel(state);
  const res = await solveMinPushes(snapshot, 200_000);
  if (!res.ok || !res.steps) {
    setBadge("No solution");
    solEl.textContent = `No solution found.
Reason: ${res.reason ?? "unknown"}
Expanded: ${res.expanded ?? 0}
Time: ${(res.timeMs ?? 0).toFixed(1)} ms`;
    return;
  }
  solutionSteps = res.steps;
  setBadge(`Solved (min pushes = ${res.minPushes})`);
  solEl.textContent =
    `Min pushes: ${res.minPushes}
Expanded: ${res.expanded}
Time: ${res.timeMs?.toFixed(1)} ms

` +
    `Moves (uppercase=push, lowercase=walk):
${formatSteps(solutionSteps)}
`;
}

async function playSolution() {
  if (!state || !solutionSteps || playing) return;
  playing = true;
  setBadge("Playing...");
  // reset to initial
  history.reset(state);
  render();

  for (const st of solutionSteps) {
    await sleep(35);
    applyMove(state, st.dir);
    history.push(state);
    render();
  }
  playing = false;
  setBadge(isWin(state) ? "✅ Solved!" : "Done");
}

function setupLevelSelect() {
  levelSelect.innerHTML = "";
  for (const lv of LEVELS) {
    const opt = document.createElement("option");
    opt.value = lv.id;
    opt.textContent = `${lv.id} — ${lv.title}`;
    levelSelect.appendChild(opt);
  }
  levelSelect.addEventListener("change", () => {
    const id = levelSelect.value;
    const lv = LEVELS.find((x) => x.id === id);
    if (lv) loadLevel(lv);
  });

  const urlLevel = getLevelFromURL();
  const initial = LEVELS.find((x) => x.id === urlLevel) ?? LEVELS[0];

  levelSelect.value = initial.id;
  loadLevel(initial);
}

function setupButtons() {
  btnReset.addEventListener("click", reset);
  btnUndo.addEventListener("click", undo);
  btnRedo.addEventListener("click", redo);
  btnSolve.addEventListener("click", solve);
  btnPlay.addEventListener("click", playSolution);

  //   btnGenerate.addEventListener("click", async () => {
  //     if (playing) return;
  //     const boxCount = clamp(parseInt(genBoxes.value, 10) || 3, 1, 6);
  //     const revSteps = clamp(parseInt(genSteps.value, 10) || 60, 10, 250);

  //     setBadge("Generating...");
  //     solEl.textContent = "Generating solvable level (reverse pull) ...";

  //     // Try a few times to hit difficulty range
  //     for (let attempt = 0; attempt < 20; attempt++) {
  //       const g = await generateOne(DEFAULT_ARENA, boxCount, revSteps, [8, 35]);
  //       if (g) {
  //         loadLevel(g.level);
  //         solEl.textContent =
  //           `Generated level with min pushes: ${g.pushes}
  // ` +
  //           `Solution: ${g.solution}
  // ` +
  //           `Tip: Click "Play solution" after running Solve.
  // `;
  //         setBadge("Generated ✅");
  //         return;
  //       }
  //     }
  //     setBadge("Generate failed");
  //     solEl.textContent = "Could not generate a level matching the difficulty range. Try increasing steps or changing box count.";
  //   });
}

function setupKeyboard() {
  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();

    if (k === "arrowup" || k === "w") return (e.preventDefault(), move("U"));
    if (k === "arrowdown" || k === "s") return (e.preventDefault(), move("D"));
    if (k === "arrowleft" || k === "a") return (e.preventDefault(), move("L"));
    if (k === "arrowright" || k === "d") return (e.preventDefault(), move("R"));
    if (k === "z") return (e.preventDefault(), undo());
    if (k === "y") return (e.preventDefault(), redo());
    if (k === "r" || k === " ") return (e.preventDefault(), reset());
  });
}

function setupDpad() {
  const dpad = document.getElementById("dpad");
  if (!dpad) return;

  let timer: number | null = null;

  const startRepeat = (dir: Dir) => {
    move(dir); // immediate
    timer = window.setInterval(() => move(dir), 200); // repeat speed
  };

  const stopRepeat = () => {
    if (timer !== null) window.clearInterval(timer);
    timer = null;
  };

  dpad.querySelectorAll<HTMLButtonElement>(".dpad-btn").forEach((btn) => {
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const dir = btn.dataset.dir as Dir | undefined;
      if (!dir) return;
      stopRepeat();
      startRepeat(dir);
    });

    btn.addEventListener("pointerup", (e) => {
      e.preventDefault();
      stopRepeat();
    });

    btn.addEventListener("pointercancel", stopRepeat);
    btn.addEventListener("pointerleave", stopRepeat);
  });

  window.addEventListener("blur", stopRepeat);
}

window.addEventListener("popstate", () => {
  const id = getLevelFromURL();
  if (!id) return;

  const lv = LEVELS.find((x) => x.id === id);
  if (lv) {
    levelSelect.value = lv.id;
    loadLevel(lv);
  }
});

setupDpad();
setupLevelSelect();
setupButtons();
setupKeyboard();
render();

// --- Save/Load (localStorage) ---
// Saves ONLY current GameState (typed arrays preserved). Undo/redo resets on load.

const SAVE_PREFIX = "sokoban:v1:";

function saveKey(levelId: string) {
  return `${SAVE_PREFIX}${levelId}`;
}

type EncU8 = { __t: "u8"; data: number[] };
type EncState = any;

type SavedGame = {
  v: 1;
  levelId: string;
  state: EncState; // encoded (JSON-safe)
  time: number;
};

// Encode Uint8Array so JSON can round-trip it
function encodeValue(v: any): any {
  if (v instanceof Uint8Array) {
    return { __t: "u8", data: Array.from(v) } satisfies EncU8;
  }
  if (Array.isArray(v)) return v.map(encodeValue);
  if (v && typeof v === "object") {
    const out: any = {};
    for (const [k, val] of Object.entries(v)) out[k] = encodeValue(val);
    return out;
  }
  return v;
}

// Decode back into Uint8Array
function decodeValue(v: any): any {
  if (v && typeof v === "object" && v.__t === "u8" && Array.isArray(v.data)) {
    return new Uint8Array(v.data);
  }
  if (Array.isArray(v)) return v.map(decodeValue);
  if (v && typeof v === "object") {
    const out: any = {};
    for (const [k, val] of Object.entries(v)) out[k] = decodeValue(val);
    return out;
  }
  return v;
}

function getCurrentLevelId(): string {
  return currentLevel?.id ?? levelSelect.value ?? "unknown-level";
}

function saveGameForLevel(levelId: string) {
  if (!state) throw new Error("No active state");
  const payload: SavedGame = {
    v: 1,
    levelId,
    state: encodeValue(state),
    time: Date.now(),
  };
  localStorage.setItem(saveKey(levelId), JSON.stringify(payload));
}

function loadGameForLevel(levelId: string): boolean {
  const raw = localStorage.getItem(saveKey(levelId));
  if (!raw) return false;

  let parsed: SavedGame;
  try {
    parsed = JSON.parse(raw) as SavedGame;
  } catch {
    return false;
  }

  if (!parsed || parsed.v !== 1 || parsed.levelId !== levelId) return false;

  const decoded = decodeValue(parsed.state) as GameState;

  // quick sanity check: boxes must be Uint8Array
  if (
    !(decoded as any)?.boxes ||
    !((decoded as any).boxes instanceof Uint8Array)
  ) {
    console.warn("Loaded state missing Uint8Array boxes:", decoded);
    return false;
  }

  state = decoded;

  // reset history from loaded state
  history = new History();
  history.init(state);

  solutionSteps = null;
  solEl.textContent = "";

  render();
  return true;
}

const btnSave = document.getElementById("btnSave") as HTMLButtonElement | null;
const btnLoad = document.getElementById("btnLoad") as HTMLButtonElement | null;

btnSave?.addEventListener("click", () => {
  const levelId = getCurrentLevelId();
  try {
    saveGameForLevel(levelId);
    setBadge(`Saved (${levelId})`);
  } catch (e) {
    console.error(e);
    setBadge("Save failed");
  }
});

btnLoad?.addEventListener("click", () => {
  const levelId = getCurrentLevelId();
  const ok = loadGameForLevel(levelId);
  setBadge(ok ? `Loaded (${levelId})` : `No save (${levelId})`);
});
