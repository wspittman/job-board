# Unified CLI

The `packages/cli` workspace provides one command-line interface for both:

- API-driven workflows against a running backend service.
- Local workflows that run directly against internal project code and local data.

Run from the repository root:

```bash
npm run cli -- <group> <command> [args] [--flags]
```

## Command groups

- `api`: backend API operations.
- `local`: local evaluation/data tools.

Examples:

```bash
npm run cli -- api addCompanies greenhouse company-a company-b
npm run cli -- api syncCompanyJobs greenhouse company-a --env local
npm run cli -- local fetchInput company greenhouse my-company
npm run cli -- local evals fillCompanyInfo nightly-run
```

## Safety defaults

API commands are safe by default:

- Default environment is `local`.
- Production execution is blocked unless all required flags are present:
  - `--env prod`
  - `--allow-production`
  - `--confirm-production I_UNDERSTAND_PRODUCTION_CHANGES`

Optional API flags:

- `--dry-run`: print request details without sending network requests.

## Environment variables

Set values in `packages/cli/.env` (or provide them through your shell):

| Variable             | Description                                      |
| -------------------- | ------------------------------------------------ |
| `PROD_API_BASE_URL`  | Base URL for production API (default available). |
| `PROD_API_TOKEN`     | Bearer token for production API.                 |
| `LOCAL_API_BASE_URL` | Base URL for local API (default available).      |
| `LOCAL_API_TOKEN`    | Bearer token for local API.                      |
| `GREENHOUSE_IDS`     | Comma-separated IDs used by e2e flows.           |
| `LEVER_IDS`          | Comma-separated IDs used by e2e flows.           |

The local group also honors backend-related environment variables needed by extraction and model evaluation helpers.
