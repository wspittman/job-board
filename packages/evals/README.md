# Evals package

This workspace contains the local evaluation harness for the job-board project. It runs the
same LLM-powered extraction logic that the backend uses and scores the model output against
curated ground truth data.

## Prerequisites

- Node.js 24 or newer (the repository root manages the toolchain).
- Project dependencies installed from the monorepo root with `npm install`.
- A `.env` file in the package folder that provides the backend configuration, including
  `OPENAI_API_KEY`, the target `LLM_MODEL`, and optional `LLM_REASONING_EFFORT`.

The evaluation package reuses the backend configuration (`packages/backend/src/config.ts`), so
any environment variables documented for the backend also apply here.

## Repository layout

Evaluation artifacts live next to this README once they are generated:

```
packages/evals/
  input/      # JSON inputs gathered from an ATS (one file per scenario)
  ground/     # Ground-truth labels that evaluators maintain alongside each input
  outcome/    # Model responses captured during a run
  report/     # Aggregated metrics produced at the end of a run
```

The `input` and `ground` folders must be populated before you execute an evaluation. They are
created automatically the first time you save data.

## Fetching input scenarios

You can capture fresh scenarios directly from an Applicant Tracking System (ATS):

```bash
npm run eval-fetch-input -- <dataModel> <ats> <companyId> [jobId]
```

- `dataModel` must be either `company` or `job`.
- `ats` must be `greenhouse` or `lever`.
- `companyId` identifies the ATS company slug/id.
- `jobId` is required when `dataModel` is `job`.

The command writes a JSON file under `input/<dataModel>/` with a timestamped name. You can then
inspect the payload, add or adjust ground-truth fields, and save the companion file in
`ground/<dataModel>/` using the same base filename.

## Running an evaluation

Once the inputs and ground truth are in place, launch an evaluation run from the repository root:

```bash
npm run eval -- <dataModel> [runName]
```

- `dataModel` again selects `company` or `job`.
- `runName` is optional; a timestamped name is generated when omitted.

During the run, the harness loads every source in `input/<dataModel>/`, invokes the backend LLM
helpers (which require your `.env` configuration), and stores the model output in
`outcome/<dataModel>/`. After processing all scenarios it writes a summary report to
`report/<dataModel>/`. Each saved JSON document includes an `evalTS` timestamp to simplify
versioning.

## Tips

- Verify that the configured `LLM_MODEL` is included in `src/evalConfig.ts`. The script aborts
  early if pricing information for the selected model is unavailable.
- The evaluation code logs progress and errors to stdout/stderr. Use `runName` to differentiate
  concurrent experiments.
- Keep input and ground files in private version control so that future runs can reproduce prior
  baselines.
