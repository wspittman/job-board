# CLI workspace instructions

Single workspace for operational API commands and backend-internal automation.

## Run

- From repo root: `npm run cli -- <command> [args] [--flags]`

## Safety

- Keep production-impacting behavior opt-in and explicit.
- Mutating commands must support a non-mutating preview mode.
