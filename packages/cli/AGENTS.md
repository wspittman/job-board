# CLI workspace instructions

Unified CLI workspace that combines operational scripts (formerly in `packages/ops`) with eval and data-collection workflows (formerly in `packages/lab`).

Refer to root-level `AGENTS.md`. Run all commands from the repo root unless stated otherwise.

## Development workflows

- Run a CLI command: `npm run cli -- <command> [args]` (executes `tsx --env-file=.env src/index.ts`).
- Legacy aliases remain available: `npm run ops -- <command>` and `npm run lab -- <command>`.
- Environment variables are loaded from `.env` in `packages/cli`.
  - Ops-style commands read keys from `src/ops/config.ts` (for example, `PROD_API_TOKEN`, `LOCAL_API_TOKEN`).
  - Lab-style commands reuse backend configuration keys via `packages/backend/src/config.ts` (for example, `OPENAI_API_KEY`, `LLM_MODEL`).

## Data layout expectations

Evaluation artifacts are stored in the `packages/cli/data/` directory:

```
packages/cli/data/
  cache/      # Cached LLM responses and embeddings
  eval/
    in/       # Input scenarios and ground-truth labels
    out/      # Model outcomes and aggregate reports
  jobCounts/  # Intermediate data for job count analysis
  playground/ # Clustering and experimental data
```
