# CLI workspace instructions

General-purpose CLI for development and operational tasks.

Refer to root-level `AGENTS.md`. Run all commands from the repo root unless stated otherwise.

## Prerequisites and configuration

- Copy `.env.example` to `.env` inside `packages/cli/` and supply required values.
- Commands that invoke backend code directly (e.g. `ats`, `evals`) require backend environment variables (see `packages/backend/src/config.ts`).

## Running commands

`npm run cli -- help` will print usage instructions.

## Logs and output

Artifacts are written under `packages/cli/logs/`:

- `app.log` — application log
- `cache/` — cached LLM responses and embeddings
- `eval/in/` — eval input scenarios (populate before running `evals`)
- `eval/out/` — model outcomes and summary reports
- `html/` — Markdown input and rendered HTML output
- `playground/` — clustering experiment data

## Notes

- The `ats` command writes fetched data to `logs/eval/in/`, making it the entry point for building eval inputs.
- The `evals` command reads from `logs/eval/in/` and writes to `logs/eval/out/<LLM_ACTION>/<RUN_NAME>/`. Use distinct `RUN_NAME` values to separate experiments.
- `api` subcommands require a running local backend. Each has a `Prod` variant (e.g. `addCompanyProd`) that targets production. Do not ever run production commands.
