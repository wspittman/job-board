# Ops CLI

The `packages/ops` workspace provides a small command-line utility that lets operators
run operational scripts against a running Job Board backend API instance. The tool is executed
through the root-level npm script:

```bash
npm run ops -- <command> [args]
```

## Prerequisites

Copy `.env.example` to `.env` inside `packages/ops/` (or provide environment variables
another way) and fill in the API connection details:

| Variable           | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| PROD_API_BASE_URL  | Base URL for the production backend API (optional, has default).   |
| PROD_API_TOKEN     | Bearer token with admin privileges for the production backend API. |
| LOCAL_API_BASE_URL | Base URL for the local backend API (optional, has default).        |
| LOCAL_API_TOKEN    | Bearer token with admin privileges for the local backend API.      |
| GREENHOUSE_IDS     | Comma-separated list of company IDs for e2e tests                  |
| LEVER_IDS          | Comma-separated list of company IDs for e2e tests                  |

Install workspace dependencies from the repository root if you have not already:

```bash
npm install
```

## Available commands

| Command                               | Description                                                                     | Example                                           |
| ------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------- |
| `addCompanies <ats> <companyId...>`   | Imports one or more company IDs from a supported ATS (`greenhouse` or `lever`). | `npm run ops -- addCompanies greenhouse 123 456`  |
| `deleteJob <companyId> <jobId>`       | Removes a specific job posting for the given company.                           | `npm run ops -- deleteJob 123 abc-789`            |
| `ignoreJob <ats> <companyId> <jobId>` | Marks a job as ignored for a company so future ATS syncs do not re-add it.      | `npm run ops -- ignoreJob greenhouse 123 abc-789` |
| `syncCompanyJobs <ats> <companyId>`   | Syncs job postings for a company from the requested ATS.                        | `npm run ops -- syncCompanyJobs greenhouse 123`   |
| `e2e <flow>`                          | Runs a predefined end-to-end flow against the backend API.                      | `npm run ops -- e2e smoke`                        |

Each command prints a success or error message based on the API response.

## How it works

The CLI is implemented in TypeScript and executed with [`tsx`](https://github.com/esbuild-kit/tsx).
Requests are sent to the backend with the built-in `fetch` API using the base URL and token
from your environment variables. Responses that fail return a readable error message that
includes the HTTP status code to aid troubleshooting.
