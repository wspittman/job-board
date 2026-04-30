# CLI package

This workspace is a general-purpose command-line tool for development and operational tasks. It
provides commands for interacting with the backend API, fetching data directly from external ATS
providers, running end-to-end tests, running LLM evaluations, and running playground experiments.

## Prerequisites

- Node.js 24 or newer (the repository root manages the toolchain).
- Project dependencies installed from the monorepo root with `npm install`.
- Copy `.env.example` to `.env` inside `packages/cli/` and supply the required environment variables.
  - The cli package has commands that directly use code from the backend package. For those commands, any environment variables documented for the backend also apply here.

## Available commands

Run all commands from the repository root:

```bash
npm run cli -- <COMMAND> <ARGS>

# To see usage information for all commands:
npm run cli -- help
```

### `api` — Interact with the backend API

Each subcommand has a `Prod` variant (e.g. `addCompanyProd`) that targets the production API
instead of the local server. Local subcommands require a running local backend. Prod subcommands
require `PROD_ADMIN_TOKEN` to be set.

| Subcommand        | Arguments                     | Description                                             |
| ----------------- | ----------------------------- | ------------------------------------------------------- |
| `addCompany`      | `<ATS> <COMPANY_ID[, ...]>`   | Imports one or more companies from a supported ATS.     |
| `deleteCompany`   | `<ATS> <COMPANY_ID>`          | Removes a company.                                      |
| `ignoreJob`       | `<ATS> <COMPANY_ID> <JOB_ID>` | Marks a job as ignored so future syncs skip it.         |
| `syncCompanyJobs` | `<ATS> <COMPANY_ID>`          | Syncs denormalized fields from a Company onto its Jobs. |

**Example:**

```bash
npm run cli -- api addCompany greenhouse my-company-slug
npm run cli -- api syncCompanyJobsProd greenhouse my-company-slug
```

### `ats` — Fetch data directly from an ATS

Requests information from external ATS providers using the backend integration code directly
(no running server needed). Fetched data is written to `logs/eval/in/` so it can serve as
evaluation input.

| Subcommand | Arguments                     | Description                                                |
| ---------- | ----------------------------- | ---------------------------------------------------------- |
| `counts`   | `<ATS> <COMPANY_ID[, ...]>`   | Prints the number of active job postings for each company. |
| `company`  | `<ATS> <COMPANY_ID[, ...]>`   | Fetches and saves company data for each company ID.        |
| `job`      | `<ATS> <COMPANY_ID[, ...]>`   | Fetches and saves a random job for each company ID.        |
| `exactJob` | `<ATS> <COMPANY_ID> <JOB_ID>` | Fetches and saves a specific job by ID.                    |

**Example:**

```bash
npm run cli -- ats company greenhouse my-company-slug
npm run cli -- ats exactJob lever my-company-slug abc-123
```

### `e2e` — Run end-to-end tests

Runs a predefined flow of API calls against the local backend and asserts expected responses.
Requires a running local server and `GREENHOUSE_IDS`/`LEVER_IDS` to be populated.

```bash
npm run cli -- e2e <FLOW>
```

### `evals` — Run LLM evaluations

Loads eval input scenarios from `logs/eval/in/`, invokes the configured LLM action, and writes
outcomes and a summary report to `logs/eval/out/<LLM_ACTION>/<RUN_NAME>/`.

```bash
npm run cli -- evals <LLM_ACTION> [RUN_NAME]
```

- `LLM_ACTION` selects which backend LLM helper to evaluate.
- `RUN_NAME` is optional; a timestamped name is generated when omitted. Use it to differentiate
  concurrent experiments.

### `html` — Convert Markdown to HTML

| Subcommand | Arguments | Description                                                                                                                      |
| ---------- | --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `file`     | `<NAME>`  | Converts a Markdown file in `logs/html/in/` and writes HTML to `logs/html/out/`.                                                 |
| `blog`     | `<SLUG>`  | Converts a frontmatter Markdown file in the frontend blog folder to a full HTML page, and updates `blog.html` and `sitemap.xml`. |

**`html file` example:**

```bash
npm run cli -- html file my-post
```

**`html blog` workflow:**

1. Write a Markdown file with YAML frontmatter at `packages/frontend/src/blog/<slug>.md`:

   ```markdown
   ---
   title: Your Article Title
   description: A short description for the meta tag.
   date: April 29, 2026
   slug: your-article-slug
   ---

   Article body goes here.
   ```

2. Run the command — it converts the Markdown, injects it into the blog template, and writes the finished `.html` file alongside the source. It also inserts a card into `blog.html` and adds a `sitemap.xml` entry (both operations are idempotent).

   ```bash
   npm run cli -- html blog your-article-slug
   ```

### `playground` — Run clustering experiments

Runs an embedding-based clustering experiment using data from `logs/playground/`. Useful for
exploring grouping of job interest signals.

```bash
npm run cli -- playground
```

## Logs and output

Run information is logged to the console. Detailed output is saved to `packages/cli/logs/app.log`.
Evaluation artifacts are organized under `logs/`:

```
packages/cli/logs/
  app.log        # Application log
  cache/         # Cached LLM responses and embeddings
  eval/
    in/          # Input scenarios and ground-truth labels
    out/         # Model outcomes and aggregate reports
  html/          # Markdown input and rendered HTML output
  playground/    # Clustering and experimental data
```
