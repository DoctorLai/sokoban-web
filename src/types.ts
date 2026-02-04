export type Dir = "U" | "D" | "L" | "R";

export interface LevelJson {
  id: string;
  title: string;
  map: string[];
}

export interface ParsedLevel {
  w: number;
  h: number;
  walls: Uint8Array; // 1 if wall
  goals: Uint8Array; // 1 if goal
  player: number; // index
  boxes: Uint8Array; // 1 if box
}

export interface GameState extends ParsedLevel {}

export interface StepInfo {
  dir: Dir;
  pushed: boolean;
}

export interface SolveResult {
  ok: boolean;
  minPushes?: number;
  steps?: StepInfo[]; // full solution (walk + push)
  expanded?: number;
  timeMs?: number;
  reason?: string;
}
