# Contributing

Contributions to Sokoban Web are welcome. Keep changes focused, explain the user-visible impact, and add tests for behavior that can regress.

## Development setup

Requirements:

- Node.js 22 (see `.nvmrc`)
- npm 10 or later

```bash
nvm use
npm ci
npm run dev
```

## Quality checks

Run the complete local CI gate before opening a pull request:

```bash
npm run check
```

Useful individual commands:

| Command              | Purpose                                     |
| -------------------- | ------------------------------------------- |
| `npm run format`     | Check formatting                            |
| `npm run format:fix` | Apply formatting                            |
| `npm run lint`       | Run strict TypeScript checks                |
| `npm test`           | Run tests once                              |
| `npm run test:watch` | Run tests in watch mode                     |
| `npm run coverage`   | Run tests with enforced coverage thresholds |
| `npm run build`      | Create the production build                 |

## Pull requests

1. Create a branch from `main`.
2. Make the smallest coherent change that solves the issue.
3. Add or update tests and documentation where appropriate.
4. Run `npm run check`.
5. Open a pull request and complete the template.

Generated levels belong under `src/levels/` and must be imported by `src/levels/index.ts`. Do not commit `dist/`, `coverage/`, or dependency directories.

By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
