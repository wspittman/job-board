# Backend workspace instructions

This package contains the Express 5 + TypeScript API service. Run all commands from the repo root unless stated otherwise.

Be sure the refer to and follow the general development conventions in the root-level `AGENTS.md`.

## Development workflows

- Development server: `npm run start:backend` (runs `tsx watch src/app.ts`).
- Production build: `npm run build --workspace=backend` followed by `npm run start --workspace=backend`; artifacts are emitted to `dist/`.
- Environment variables are loaded from `.env`. See `src/config.ts` for values such as `DATABASE_URL`, `LLM_MODEL`, `LLM_REASONING_EFFORT`, `OPENAI_API_KEY`, `ADMIN_TOKEN`, and `APPLICATIONINSIGHTS_CONNECTION_STRING`.
- API routes are defined in `src/routes/routes.ts`.

## Testing style

- Tests run via `npm test --workspace=backend`, which executes `node --import tsx --import ./test/setup.ts --test test/**/*.test.ts`. The shared `test/setup.ts` file sets default env vars and stubs telemetry/database/server bootstrapping; keep new tests compatible with those defaults.
- Use the built-in `node:test` runner with `suite`/`test` blocks and `assert/strict` expectations. Prefer table-driven cases (arrays of inputs iterated with `forEach`) to cover variants succinctly, as seen in `test/config.test.ts` and `test/middleware/*.test.ts`.
- Rely on `node:test` mocks (e.g., `mock.fn`, `mock.method`) to stub Express responses or helper modules. Reset mock call counts in `beforeEach` instead of recreating objects per test when practical.
- Keep test helpers small and colocated in the file (e.g., `mockRequest`, `validator`, `formatter`) and name tests with descriptive, data-driven strings built from the inputs.

## Quality checks

Always run the following before committing changes:

- Lint: `npm run lint --workspace=backend`.
- Format: `npm run format:write --workspace=backend`
- Tests: `npm test --workspace=backend`
