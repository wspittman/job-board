# Unified CLI

This workspace provides a single command-line interface for both API operations and backend-internal workflows.

## Run

```bash
npm run cli -- <command> [args] [--flags]
```

## Safety defaults

- Defaults to `--env local`.
- Any mutating API command requires `--apply`.
- Production mutations additionally require both `--yes-prod` and `CLI_ALLOW_PROD=true`.

## Commands

### API operations

- `api:add-companies <ats> <companyId...>`
- `api:ignore-job <ats> <companyId> <jobId>`
- `api:delete-company <ats> <companyId>`
- `api:sync-company-jobs <ats> <companyId>`
- `api:e2e smoke`

### Internal workflows

- `internal:fetch-input <dataModel> <ats> <companyId> [jobId]`
- `internal:fetch-input-many <dataModel> <ats> <companyId[, ...]>`
- `internal:job-counts <ats> <companyId[, ...]>`
- `internal:eval <llmAction> [runName]`
- `internal:blog-build <postName>`
- `internal:playground`
