# CLI package

This workspace is a unified command-line package that combines the responsibilities of the legacy `lab` and `ops` CLIs.

- Ops-style commands take action against a running backend API instance.
- Lab-style commands run local evaluation/data workflows and can access backend-internal code directly.

The package is intentionally independent of the legacy workspaces at runtime: it vendors equivalent source instead of importing from `packages/lab` or `packages/ops`.

## Usage

Run from the repository root:

```bash
npm run cli -- <command> [args]
```

To see command usage, run an invalid command (the CLI prints grouped help for both command families).

## Prerequisites

- Node.js 24 or newer.
- Dependencies installed once at repo root via `npm install`.
- Copy `packages/cli/.env.example` to `packages/cli/.env` and fill in needed values.

Because this package combines both command families, the `.env` file includes both:

- backend/LLM configuration needed by eval workflows;
- API base URL and token settings needed by operational workflows.
