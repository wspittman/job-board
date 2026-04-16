# Unified CLI

This workspace provides a single command-line interface for operational API actions, local evaluation workflows, and data tooling.

Run commands from the repository root:

```bash
npm run cli -- <command> [args] [--profile=local|prod] [--confirm]
```

## Safety defaults

- `--profile` defaults to `local`.
- Mutating API commands are blocked when `--profile=prod` unless `--confirm` is explicitly set.
- End-to-end API flows are restricted to the local profile.

These defaults reduce the chance of accidental production changes when production credentials are available in your shell.

## Common commands

### API commands

- `api:list-jobs [companyId]`
- `api:add-companies <ats> <companyId...>`
- `api:delete-company <ats> <companyId>`
- `api:sync-company-jobs <ats> <companyId>`
- `api:ignore-job <ats> <companyId> <jobId>`
- `api:e2e <flow>`

### Local data and evaluation commands

- `data:fetch-input <dataModel> <ats> <companyId> [jobId]`
- `data:fetch-input-many <dataModel> <ats> <companyId[, ...]>`
- `eval:run <llmAction> [runName]`
- `stats:job-counts <ats> <companyId[, ...]>`
- `exp:playground`
- `content:build-blog <postName>`

## Data layout

Generated artifacts are written under `packages/cli/data/`:

```text
packages/cli/data/
  cache/
  eval/
    in/
    out/
  jobCounts/
  playground/
  blog/
```

## Environment

Place a `.env` file in `packages/cli/`.

Evaluation/data commands reuse backend configuration and require the corresponding backend environment keys.
API commands use:

- `PROD_API_BASE_URL`
- `PROD_API_TOKEN`
- `LOCAL_API_BASE_URL`
- `LOCAL_API_TOKEN`
- `GREENHOUSE_IDS` (used by `api:e2e`)
- `LEVER_IDS` (used by `api:e2e`)
