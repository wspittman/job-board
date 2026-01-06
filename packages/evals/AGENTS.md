# Evals workspace instructions

This package contains the local evaluation harness that mirrors the backend LLM extraction logic. Run commands from the repo root unless noted otherwise.

## Prerequisites and configuration

- Node.js 24 or newer (managed at the repo root).
- Install dependencies once from the monorepo root with `npm install`.
- Place a `.env` file in `packages/evals/` that reuses the backend configuration (see `packages/backend/src/config.ts`). Required keys include `OPENAI_API_KEY`, `LLM_MODEL`, and optional `LLM_REASONING_EFFORT`; other backend vars are honored when present.

## Data layout expectations

Evaluation artifacts are stored alongside this file:

```
packages/evals/
  input/      # JSON inputs pulled from an ATS
  ground/     # Ground-truth labels paired with each input
  outcome/    # Model responses captured during evaluation
  report/     # Aggregated metrics for each run
```

The `input` and `ground` folders must be populated before running an evaluation. Directories are created automatically on first use.

## Fetching ATS inputs

Capture scenarios directly from an ATS:

```
npm run eval-fetch-input -- <dataModel> <ats> <companyId> [jobId]
```

- `dataModel`: `company` or `job`.
- `ats`: `greenhouse` or `lever`.
- `companyId`: ATS company slug/id.
- `jobId`: required when `dataModel` is `job`.

Each run writes a timestamped JSON file under `input/<dataModel>/` so you can review and create a matching `ground/<dataModel>/` file before evaluation.

## Running evaluations

Execute evaluations once inputs and ground truth exist:

```
npm run eval -- <dataModel> [runName]
```

- `dataModel`: `company` or `job`.
- `runName`: optional label; a timestamp is used when omitted.

Outputs are written to `outcome/<dataModel>/` (model responses) and `report/<dataModel>/` (summary metrics). Each JSON document includes an `evalTS` timestamp for traceability.

## Notes

- The harness relies on the same backend configuration and model pricing table (see `src/evalConfig.ts`); ensure your chosen `LLM_MODEL` is supported.
- Use distinct `runName` values to disambiguate experiments and keep artifacts organized.
