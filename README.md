# A Sokoban Web Game
[![Deploy to GitHub Pages](https://github.com/DoctorLai/sokoban-web/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/DoctorLai/sokoban-web/actions/workflows/deploy.yml) [![Run Tests](https://github.com/DoctorLai/sokoban-web/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/DoctorLai/sokoban-web/actions/workflows/tests.yml) [![Test Coverage](https://github.com/DoctorLai/sokoban-web/actions/workflows/coverage.yml/badge.svg?branch=main)](https://github.com/DoctorLai/sokoban-web/actions/workflows/coverage.yml)

Published to [https://doctorlai.github.io/sokoban-web/](https://doctorlai.github.io/sokoban-web/)

<img width="995" height="557" alt="image" src="https://github.com/user-attachments/assets/a6af9faa-cc13-46c1-9180-a7be78600b16" />

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

And you will see local server is up.

>   VITE v6.4.1  ready in 276 ms
>  ➜  Local:   http://localhost:5173/
> ➜  Network: use --host to expose
>  ➜  press h + enter to show help

## Build

```bash
npm run build
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

- Fork the repository.
- Create a feature branch: `git checkout -b feature-branch`
- Commit your changes: `git commit -am 'Add new feature'`
- Push to the branch: `git push origin feature-branch`
- Open a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Documentation

Here is the [AI generated wiki](https://deepwiki.com/DoctorLai/sokoban-web)

## Acknowledgments

- Built with ❤️ by [@justyy](https://github.com/doctorlai)
- Initial Boilerplate code contributed by ChatGPT 5.2.
- If you found this tool useful, consider buying me a [coffee](https://justyy.com/out/bmc) ☕ Thank you!
