# Unified CLI package

The `packages/cli` workspace combines the former operational (`ops`) and evaluation/lab (`lab`) command sets into one executable.

Run from the repository root:

```bash
npm run cli -- <command> [args]
```

## Prerequisites

- Node.js 24 or newer.
- Install dependencies from the repository root with `npm install`.
- Copy `packages/cli/.env.example` to `packages/cli/.env` and populate required variables.
  - For ops-style commands, include API base URLs/tokens (`PROD_API_TOKEN`, `LOCAL_API_TOKEN`, etc.).
  - For lab-style commands, include backend/LLM configuration (`OPENAI_API_KEY`, `LLM_MODEL`, etc.).

## Command groups

### Ops commands

- `addCompanies <ats> <companyId...>`
- `ignoreJob <ats> <companyId> <jobId>`
- `deleteCompany <ats> <companyId>`
- `syncCompanyJobs <ats> <companyId>`
- `e2e <flow>`

### Lab commands

- `blogBuild <inFile> [outFile]`
- `evals <dataModel> [runName]`
- `fetchInput <dataModel> <ats> <companyId> [jobId]`
- `fetchInputMany <dataModel> <ats> <companyId...>`
- `jobCounts <ats> <companyId...>`
- `playground`

Lab data/output layout and behavior follow the legacy lab workspace conventions under `packages/cli/data/`.
