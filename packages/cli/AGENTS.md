# CLI workspace instructions

Unified command-line workspace for operational API workflows and local evaluation/data workflows.

Refer to root-level `AGENTS.md`. Run commands from the repo root unless stated otherwise.

## Development workflows

- Run a CLI command: `npm run cli -- <group> <command> [args] [--flags]`.
- Global groups:
  - `api`: commands that call a running backend API.
  - `local`: commands that run with direct project code and data access.
- Default target for `api` commands is `local`; production calls require explicit safety flags.
