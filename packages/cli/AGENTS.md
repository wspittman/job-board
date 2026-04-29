# CLI

General-purpose CLI for development and operational tasks.

## Prerequisites and configuration

- Copy `.env.example` to `.env` inside `packages/cli/` and supply required values.
- Commands that invoke backend code directly (e.g. `ats`, `evals`) require backend environment variables (see `packages/backend/src/config.ts`).

## Running commands

`npm run cli -- help` will print usage instructions.

## Logs and output

Artifacts are written under `packages/cli/logs/`:

- `app.log` — application log
- `cache/` — cached LLM responses and embeddings
- `eval/in/` — eval input scenarios (populate before running `evals`)
- `eval/out/` — model outcomes and summary reports
- `html/` — Markdown input and rendered HTML output

## Blog article workflow

To create a new blog article without manual copy-paste:

1. Write a Markdown file with YAML frontmatter in `packages/frontend/src/blog/<slug>.md`:

   ```markdown
   ---
   title: Your Article Title
   description: A short description for the meta tag.
   date: April 28, 2026
   slug: your-article-slug
   ---

   Article body goes here.
   ```

2. Run `npm run cli -- html --blog <slug>` — the CLI reads the `.md` file, injects frontmatter into `template.htm`, and writes the finished `.html` file to the same folder.
3. Add a link to the new post in `packages/frontend/src/blog.html`.
4. Add an entry to `sitemap.xml`.

The standard `html` command (without `--blog`) still works for one-off markdown conversions using `logs/html/in/` and `logs/html/out/`.

- `playground/` — clustering experiment data

## Notes

- The `ats` command writes fetched data to `logs/eval/in/`, making it the entry point for building eval inputs.
- The `evals` command reads from `logs/eval/in/` and writes to `logs/eval/out/<LLM_ACTION>/<RUN_NAME>/`. Use distinct `RUN_NAME` values to separate experiments.
- `api` subcommands require a running local backend. Each has a `Prod` variant (e.g. `addCompanyProd`) that targets production. Do not ever run production commands.
