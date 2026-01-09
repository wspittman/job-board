# Frontend workspace instructions

This package contains the Vite-powered vanilla HTML/CSS/JS application that delivers the current job board experience. Run commands from the repo root unless stated otherwise.

Be sure the refer to and follow the general development conventions in the root-level `AGENTS.md`.

## Development workflows

- Development server: `npm run start:frontend` (alias of `npm run dev --workspace=frontend`) runs Vite with hot module reloading.
- Production build: `npm run build --workspace=frontend` type-checks the app and `server/` code before emitting assets to `dist/`.
- Preview: `npm run preview --workspace=frontend` serves the built assets for local verification.
- Production hosting: `npm run start --workspace=frontend` uses `server.js`; configure `API_URL` and optionally `PORT` for the Express static file server.

## Quality checks

Always run the following before committing changes:

- Lint: `npm run lint --workspace=frontend`.
- Format: `npm run format:write --workspace=frontend`
- No dedicated frontend test suite exists; when feasible, validate UI changes with a development server or `npm run build --workspace=frontend`.
