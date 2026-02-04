# A Sokoban Web Game

<img width="1261" height="650" alt="image" src="https://github.com/user-attachments/assets/fc72e8b4-c86b-4e02-88cf-a067297d3264" />


A minimal Sokoban (Push Box) web game:
- Pure front-end (Vite + TypeScript), suitable for GitHub Pages
- Add levels by dropping JSON files into `src/levels/`
- Built-in solver (min pushes) that outputs a full move list
- Built-in generator (reverse pull) to create solvable levels

## Quick start

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

Deploy the `dist/` folder to GitHub Pages.

## Add new levels

1. Create `src/levels/my-level.json`
2. Import and add to `src/levels/index.ts`

## Generate levels offline

```bash
npm run gen:levels
```

Generated JSON files appear under `src/levels/generated/`.
Commit them and import them in `src/levels/index.ts`.

## Solver output format

In the solution string:
- Lowercase letters: player walking
- Uppercase letters: pushing a box

Example: `rruULldD...`
