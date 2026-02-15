import type { LevelJson } from "../types";

// import all JSON files recursively in levels folder and subfolders
const modules = import.meta.glob<LevelJson>("./**/*.json", { eager: true });

export const LEVELS: LevelJson[] = Object.values(modules);
