# Admin CLI

The `packages/admin` workspace provides a small command-line utility that lets operators
perform administrative actions against the Job Board backend API. The tool is executed
through the root-level npm script:

```bash
npm run admin -- <command> [args]
```

## Prerequisites

Create an `.env` file inside `packages/admin/` (or provide environment variables another
way) with the API connection details:

```ini
ADMIN_API_BASE_URL=<https://backend.example.com/admin/>
ADMIN_API_TOKEN=<api token with admin privileges>
```

- `ADMIN_API_BASE_URL` should end with a trailing slash so the CLI can append request paths
  correctly.
- `ADMIN_API_TOKEN` is passed as the `Authorization: Bearer` header on each request.

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
