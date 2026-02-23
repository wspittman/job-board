# Ops workspace instructions

CLI for operational scripts that take actions against a running backend API instance.

Refer to root-level `AGENTS.md`. Run all commands from the repo root unless stated otherwise.

## Development workflows

- Run a CLI command: `npm run ops -- <command> [args]` (executes `tsx --env-file=.env src/index.ts`).
- Examples: `npm run ops -- addCompanies greenhouse name1 name2` or `npm run ops -- deleteJob name1 job1`.
- Environment variables are loaded from `.env`. See `src/config.ts` for keys (e.g., `PROD_API_TOKEN`, `LOCAL_API_TOKEN`).
