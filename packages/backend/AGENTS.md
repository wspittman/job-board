# Backend workspace instructions

This package contains the Express 5 + TypeScript API service. Run all commands from the repo root unless stated otherwise.

## Development workflows

- Development server: `npm run start:backend` (runs `tsx watch src/app.ts`).
- Production build: `npm run build --workspace=backend` followed by `npm run start --workspace=backend`; artifacts are emitted to `dist/`.
- Environment variables are loaded from `.env`. See `src/config.ts` for values such as `DATABASE_URL`, `LLM_MODEL`, `LLM_REASONING_EFFORT`, `OPENAI_API_KEY`, and `APPLICATIONINSIGHTS_CONNECTION_STRING`.
- API routes are defined in `src/routes/routes.ts`.

## Code conventions

- Use JSDoc comments for public APIs and complex logic. Avoid trailing inline comments. For async @returns descriptions, describe the resolved value rather than the promise.
- Avoid adding new dependencies and call out any additions in your summary.

## Quality checks

- Lint: `npm run lint --workspace=backend`.
- Format: `npm run format --workspace=backend` (or `npm run format:write --workspace=backend` to apply fixes).
- Tests: run `npm test --workspace=backend` when feasible for backend changes.
