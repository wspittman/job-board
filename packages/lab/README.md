# Lab package

This workspace contains scripts for running evals and intermediate data collection that need
direct access to backend-only logic or data (not surfaced via API). It includes the local
evaluation harness for the job-board project, running the same LLM-powered extraction logic
that the backend uses and scoring model output against curated ground truth data.

## Prerequisites

- Node.js 24 or newer (the repository root manages the toolchain).
- Project dependencies installed from the monorepo root with `npm install`.
- Copy `.env.example` to `.env` inside `packages/lab/` and supply the required environment variables. The lab package reuses the backend configuration (`packages/backend/src/config.ts`), so any environment variables documented for the backend also apply here.

## Repository layout

Evaluation artifacts live under the `data/` directory:

```
packages/lab/data/
  cache/      # Cached LLM responses and embeddings
  eval/
    in/       # Input scenarios and ground-truth labels
    out/      # Model outcomes and aggregate reports
  jobCounts/  # Intermediate data for job count analysis
  playground/ # Clustering and experimental data
```

The `data/eval/in/` folder must be populated before you execute an evaluation. It is
created automatically the first time you fetch or save data.

## Fetching input scenarios

You can capture fresh scenarios directly from an Applicant Tracking System (ATS):

```bash
npm run lab -- fetchInput <dataModel> <ats> <companyId> [jobId]
```

- `dataModel` must be either `company` or `job`.
- `ats` must be `greenhouse` or `lever`.
- `companyId` identifies the ATS company slug/id.
- `jobId` is optional when `dataModel` is `job`; if omitted, a random job for the company is selected.

The command writes a JSON file under `data/eval/in/<dataModel>/` with a name based on the ATS and IDs. You can then inspect the payload, add or adjust ground-truth fields, and save the companion file in the same directory using the same base filename.

## Running an evaluation

Once the inputs and ground truth are in place, launch an evaluation run from the repository root:

```bash
npm run lab -- evals <dataModel> [runName]
```

- `dataModel` again selects `company` or `job`.
- `runName` is optional; a timestamped name is generated when omitted.

During the run, the harness loads every source in `data/eval/in/<dataModel>/`, invokes the backend LLM
helpers (which require your `.env` configuration), and stores the model output in
`data/eval/out/<dataModel>/<runName>/<llmModel>/`. After processing all scenarios it writes a summary report to
the same directory. Each saved JSON document includes an `evalTS` timestamp to simplify
versioning.

## Tips

- Verify that the configured `LLM_MODEL` is included in `src/evalConfig.ts`. The script aborts
  early if pricing information for the selected model is unavailable.
- The evaluation code logs progress and errors to stdout/stderr. Use `runName` to differentiate
  concurrent experiments.
- Keep input and ground files in private version control so that future runs can reproduce prior
  baselines.

## Playground

To run the clustering playground workflow:

```bash
npm run lab -- playground
```
