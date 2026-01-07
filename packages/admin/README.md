# Admin CLI

The `packages/admin` workspace provides a small command-line utility that lets operators
perform administrative actions against the Job Board backend API. The tool is executed
through the root-level npm script:

```bash
npm run admin -- <command> [args]
```

## Prerequisites

Copy `.env.example` to `.env` inside `packages/admin/` (or provide environment variables
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

| Command                              | Description                                                                     | Example                                             |
| ------------------------------------ | ------------------------------------------------------------------------------- | --------------------------------------------------- |
| `add-companies <ats> <companyId...>` | Imports one or more company IDs from a supported ATS (`greenhouse` or `lever`). | `npm run admin -- add-companies greenhouse 123 456` |
| `delete-job <companyId> <jobId>`     | Removes a specific job posting for the given company.                           | `npm run admin -- delete-job 123 abc-789`           |
| `e2e <flow>`                         | Runs a predefined end-to-end flow against the backend API.                      | `npm run admin -- e2e smoke`                        |

Each command prints a success or error message based on the API response.

## How it works

The CLI is implemented in TypeScript and executed with [`tsx`](https://github.com/esbuild-kit/tsx).
Requests are sent to the backend with the built-in `fetch` API using the base URL and token
from your environment variables. Responses that fail return a readable error message that
includes the HTTP status code to aid troubleshooting.
