# Ops workspace instructions

This package contains the TypeScript CLI for operational scripts that take actions against a running backend API instance. Run all commands from the repo root unless stated otherwise.

Be sure the refer to and follow the general development conventions in the root-level `AGENTS.md`.

## Development workflows

- Run a CLI command: `npm run ops -- <command> [args]` (executes `tsx --env-file=.env src/index.ts`).
- Examples: `npm run ops -- addCompanies greenhouse name1 name2` or `npm run ops -- deleteJob name1 job1`.
- Environment variables are loaded from `.env`. See `src/config.ts` for keys (e.g., `PROD_API_TOKEN`, `LOCAL_API_TOKEN`).

## Quality checks

Always run the following before committing changes:

- Lint: `npm run lint --workspace=ops`.
- Format: `npm run format:write --workspace=ops`
