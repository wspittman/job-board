# CLI workspace instructions

Unified CLI workspace that combines operational scripts (formerly in `packages/ops`) and evaluation/data commands (formerly in `packages/lab`).

Refer to root-level `AGENTS.md`. Run all commands from the repo root unless stated otherwise.

## Development workflows

- Run a CLI command: `npm run cli -- <command> [args]` (executes `tsx --env-file=.env src/index.ts`).
- This workspace intentionally vendors code from both legacy CLIs to stay independent from `packages/lab` and `packages/ops` runtime imports.

## Environment variables

This package needs the union of env vars used by both legacy CLIs. Start from `packages/cli/.env.example`.

- Lab/eval commands reuse backend-oriented values such as `OPENAI_API_KEY`, `LLM_MODEL`, and optional `LLM_REASONING_EFFORT`.
- Ops commands use API auth settings such as `PROD_API_TOKEN`, `LOCAL_API_TOKEN`, and optional base URLs.
