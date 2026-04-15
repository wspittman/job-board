# CLI workspace instructions

Unified CLI for operational scripts and evaluation workflows.

It combines:

- Operations commands that act against a running backend API instance.
- Lab/evaluation commands that run locally with direct access to backend-internal logic.

Refer to root-level `AGENTS.md`. Run all commands from the repo root unless stated otherwise.

## Development workflows

- Run a CLI command: `npm run cli -- <command> [args]` (executes `tsx --env-file=.env src/index.ts`).
- Ops-style examples: `npm run cli -- addCompanies greenhouse name1 name2` or `npm run cli -- deleteCompany greenhouse company-id`.
- Lab-style examples: `npm run cli -- fetchInput company greenhouse company-id` or `npm run cli -- evals company`.
- Environment variables are loaded from `.env`; this workspace uses the union of variables expected by `packages/lab` and `packages/ops`.
