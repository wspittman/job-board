# Findings: Light/Dark Mode

## Source Review Summary
- Existing plan content was rich in implementation detail but not structured for persistent file-based planning.
- The original document mixed decisions, phase plan, and execution notes in one file.
- The `planning-with-files` workflow expects separate files for plan, findings, and progress under a task folder.

## Technical Findings from Existing Plan
1. Current design token system is CSS variable based and suitable for `data-theme` switching.
2. The most important dark mode bug risk is alpha-black overlay tokens (`--bg-border`, `--bg-active`, `--bg-hover`) becoming too faint; these must become alpha-white in dark mode.
3. Error tokens (`--text-error`, `--bg-error`) require explicit dark variants for readability.
4. FOUC prevention requires an inline synchronous script in `<head>` (module script is too late).
5. Runtime OS preference changes should only apply when user has not explicitly chosen a theme.

## Confirmed Decisions Carried Forward
- Use purple-tinted dark surfaces (`hsl(256 15% ...)`) rather than neutral grayscale dark surfaces.
- Keep primary/secondary brand colors stable across themes.
- Keep app bar branding treatment consistent.

## Planned Files for Implementation (from original plan)
- `sharedStyles/base.css`
- `partials/head.html`
- `partials/header.html`
- `sharedStyles/header.css`
- `src/utils/theme.ts` (new)

## Notes on Plan Modernization
- Reorganized into:
  - `task_plan.md` for goals/phases/status/risks/errors
  - `findings.md` for discoveries and decisions
  - `progress.md` for chronological execution log
- Preserved all meaningful technical intent from the legacy plan.
