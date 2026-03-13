# Lab workspace instructions

CLI for evals and intermediate data collection that need direct access to backend-only logic or data (not surfaced via API).

It includes the local evaluation harness that mirrors the backend LLM extraction logic.

Refer to root-level `AGENTS.md`. Run all commands from the repo root unless stated otherwise.

## Prerequisites and configuration

- Place a `.env` file in `packages/lab/` that reuses the backend configuration (see `packages/backend/src/config.ts`). Required keys include `OPENAI_API_KEY`, `LLM_MODEL`, and optional `LLM_REASONING_EFFORT`; other backend vars are honored when present.

## Data layout expectations

Evaluation artifacts are stored in the `data/` directory:

```
packages/lab/data/
  cache/      # Cached LLM responses and embeddings
  eval/
    in/       # Input scenarios and ground-truth labels
    out/      # Model outcomes and aggregate reports
  jobCounts/  # Intermediate data for job count analysis
  playground/ # Clustering and experimental data
```

The `data/eval/in/` folder must be populated before running an evaluation. Directories are created automatically on first use.

## Fetching ATS inputs

Capture scenarios directly from an ATS:

```
npm run lab -- fetchInput <dataModel> <ats> <companyId> [jobId]
```

- `dataModel`: `company` or `job`.
- `ats`: `greenhouse` or `lever`.
- `companyId`: ATS company slug/id.
- `jobId`: is optional when `dataModel` is `job`; if omitted, a random job for the company is selected.

Each run writes a JSON file under `data/eval/in/<dataModel>/` with a name based on the ATS and IDs. You can then review and create a matching companion file in the same directory before evaluation.

## Running evaluations

Execute evaluations once inputs and ground truth exist:

```
npm run lab -- evals <dataModel> [runName]
```

- `dataModel`: `company` or `job`.
- `runName`: optional label; a timestamp is used when omitted.

Outputs are written to `data/eval/out/<dataModel>/<runName>/<llmModel>/` (model responses and summary metrics). Each JSON document includes an `evalTS` timestamp for traceability.

## Playground

Run the clustering playground flow:

```
npm run lab -- playground
```

## Notes

- The harness relies on the same backend configuration and model pricing table (see `src/evalConfig.ts`); ensure your chosen `LLM_MODEL` is supported.
- Use distinct `runName` values to disambiguate experiments and keep artifacts organized.
