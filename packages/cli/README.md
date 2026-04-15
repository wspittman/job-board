# Unified CLI

The `packages/cli` workspace combines the legacy operational CLI and lab CLI into one command-line tool.
It supports commands that act on a running backend API plus commands that run local eval and data workflows.

Run commands through the root-level npm script:

```bash
npm run cli -- <command> [args]
```

## Prerequisites

Copy `.env.example` to `.env` inside `packages/cli/` (or provide environment variables another way).
The unified CLI supports both configuration sets:

| Variable set                                                                                                                  | Description                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Ops variables (`PROD_API_BASE_URL`, `PROD_API_TOKEN`, `LOCAL_API_BASE_URL`, `LOCAL_API_TOKEN`, `GREENHOUSE_IDS`, `LEVER_IDS`) | Used by commands that call a running backend API.                                  |
| Backend/lab variables (`OPENAI_API_KEY`, `LLM_MODEL`, optional `LLM_REASONING_EFFORT`, etc.)                                  | Used by local eval and data processing commands that share backend-internal logic. |

Install dependencies from the repository root if needed:

```bash
npm install
```

## Available commands

This package includes all commands from the legacy `ops` and `lab` CLIs.
Representative commands:

- Ops-style commands: `addCompanies`, `ignoreJob`, `deleteCompany`, `syncCompanyJobs`, `e2e`.
- Lab-style commands: `fetchInput`, `fetchInputMany`, `evals`, `jobCounts`, `playground`, `blogBuild`.

For command-specific usage, run with no command or invalid arguments to print usage help.

## Data layout

Evaluation and intermediate artifacts are written under:

```
packages/cli/data/
  cache/
  eval/
    in/
    out/
  jobCounts/
  playground/
```
