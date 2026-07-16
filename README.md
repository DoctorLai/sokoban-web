# Sokoban Web

[![CI](https://github.com/doctorlai/sokoban-web/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/doctorlai/sokoban-web/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/doctorlai/sokoban-web/actions/workflows/deploy.yaml/badge.svg?branch=main)](https://github.com/doctorlai/sokoban-web/actions/workflows/deploy.yaml)
[![Coverage Report](https://github.com/doctorlai/sokoban-web/actions/workflows/coverage.yml/badge.svg)](https://github.com/doctorlai/sokoban-web/actions/workflows/coverage.yml)
[![Last commit](https://img.shields.io/github/last-commit/doctorlai/sokoban-web)](https://github.com/doctorlai/sokoban-web/commits/main)
[![License](https://img.shields.io/github/license/doctorlai/sokoban-web)](LICENSE)
[![Stars](https://img.shields.io/github/stars/doctorlai/sokoban-web)](https://github.com/doctorlai/sokoban-web/stargazers)
[![Code style: Prettier](https://img.shields.io/badge/code_style-Prettier-f7b93e.svg)](https://prettier.io/)
[![Commit activity](https://img.shields.io/github/commit-activity/m/doctorlai/sokoban-web)](https://github.com/doctorlai/sokoban-web/graphs/commit-activity)
[![Watchers](https://img.shields.io/github/watchers/doctorlai/sokoban-web)](https://github.com/doctorlai/sokoban-web/watchers)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Top language](https://img.shields.io/github/languages/top/doctorlai/sokoban-web)](https://github.com/doctorlai/sokoban-web/search?l=typescript)
[![Repository size](https://img.shields.io/github/repo-size/doctorlai/sokoban-web)](https://github.com/doctorlai/sokoban-web)
[![Open pull requests](https://img.shields.io/github/issues-pr/doctorlai/sokoban-web)](https://github.com/doctorlai/sokoban-web/pulls)
[![Forks](https://img.shields.io/github/forks/doctorlai/sokoban-web)](https://github.com/doctorlai/sokoban-web/forks)
[![Open issues](https://img.shields.io/github/issues/doctorlai/sokoban-web)](https://github.com/doctorlai/sokoban-web/issues)
[![Node.js 22](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/doctorlai/sokoban-web)

A browser-based Sokoban game built with TypeScript and Vite. Play more than 70 bundled levels, save progress locally, undo or redo moves, and ask the built-in minimum-push solver for a solution.

**Play:** [doctorlai.github.io/sokoban-web](https://doctorlai.github.io/sokoban-web/)

<img width="898" height="574" alt="Sokoban Web game showing the level controls, game board, and solver" src="https://github.com/user-attachments/assets/7e9cb498-cd54-4ee3-a671-21d2b40301ba" />

## Features

- Keyboard, arrow-key, and touch D-pad controls
- Undo, redo, reset, per-level save, and load
- Minimum-push solver with animated playback
- Light and dark themes with a persisted preference
- Shareable level URLs
- Responsive layout for desktop and mobile browsers
- Static GitHub Pages deployment with date-and-commit version metadata

## Getting started

Use Node.js 22, as specified in `.nvmrc`.

```bash
nvm use
npm ci
npm run dev
```

Vite prints the local development URL, normally `http://localhost:5173/`.

## Commands

| Command              | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| `npm run dev`        | Start the Vite development server                   |
| `npm run preview`    | Preview the production build locally                |
| `npm run build`      | Type-check and create a production build            |
| `npm run format`     | Check formatting with Prettier                      |
| `npm run format:fix` | Apply Prettier formatting                           |
| `npm run lint`       | Run strict TypeScript checks                        |
| `npm test`           | Run the Vitest suite once                           |
| `npm run test:watch` | Run tests in watch mode                             |
| `npm run coverage`   | Run tests and enforce 80% minimum coverage          |
| `npm run check`      | Run formatting, linting, coverage, and build checks |
| `npm run gen:levels` | Generate candidate levels offline                   |

## Controls

| Action | Keyboard                         |
| ------ | -------------------------------- |
| Move   | Arrow keys or `W`, `A`, `S`, `D` |
| Undo   | `Z`                              |
| Redo   | `Y`                              |
| Reset  | `R` or Space                     |

In solver output, lowercase letters are walking moves and uppercase letters are box pushes.

## Adding levels

Level files are JSON documents grouped under `src/levels/`. To add a level:

1. Add the JSON file to an appropriate directory under `src/levels/`.
2. Import it and include it in `src/levels/index.ts`.
3. Run `npm run check`.

`npm run gen:levels` writes generated candidates under `src/levels/generated/`. Review generated levels before importing and committing them.

## Quality and deployment

Every pull request runs the complete quality gate. A separate coverage workflow posts a GitHub bot comment with overall and per-file Vitest coverage. Statements, branches, functions, and lines must each remain at or above 80%.

Pushes to `main` that pass the same checks are deployed to GitHub Pages. The interface displays the release date and short Git commit, for example `Version: 2026-07-16 (054ffe1)`.

## Project policies

- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)
- [Support](SUPPORT.md)
- [Privacy](PRIVACY.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Changelog](CHANGELOG.md)

## License

Licensed under the [MIT License](LICENSE).
