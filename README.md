# A Sokoban Web Game
[![Deploy to GitHub Pages](https://github.com/DoctorLai/sokoban-web/actions/workflows/deploy.yml/badge.svg)](https://github.com/DoctorLai/sokoban-web/actions/workflows/deploy.yml) [![Run Tests](https://github.com/DoctorLai/sokoban-web/actions/workflows/tests.yml/badge.svg)](https://github.com/DoctorLai/sokoban-web/actions/workflows/tests.yml) [![Test Coverage](https://github.com/DoctorLai/sokoban-web/actions/workflows/coverage.yml/badge.svg)](https://github.com/DoctorLai/sokoban-web/actions/workflows/coverage.yml)

Published to [https://doctorlai.github.io/sokoban-web/](https://doctorlai.github.io/sokoban-web/)

<img width="1121" height="586" alt="image" src="https://github.com/user-attachments/assets/f3dd0837-7425-4ca3-b530-499d6b9c629a" />

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


## Code Format
Run `npm run format` to check format and `npm run format:fix` to fix the code format.

## Tests
Run `npm run test:run`

## Test Coverage
Run `npm run test:coverage`

## Contributing

Feel free to fork this project and submit issues or pull requests for improvements!

1. Fork the repository.
2. Create a feature branch:
```bash
git checkout -b feature-branch
```
3. Commit your changes:
```bash
git commit -am 'Add new feature'
```
4. Push to the branch:
```bash
git push origin feature-branch
```
5. Open a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Documentation

Here is the [AI generated wiki](https://deepwiki.com/DoctorLai/sokoban-web)

## Acknowledgments

- Built with ❤️ by [@justyy](https://github.com/doctorlai)
- Initial Boilerplate code contributed by ChatGPT 5.2.
- If you found this tool useful, consider buying me a [coffee](https://justyy.com/out/bmc) ☕

