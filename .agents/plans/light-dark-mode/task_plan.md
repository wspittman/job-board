# Task Plan: Light/Dark Mode

## Goal
Implement a robust light/dark mode experience for the job board frontend, including theme tokens, first-paint correctness, runtime toggle behavior, and verification across pages/components.

## Scope
- Frontend theming implementation and verification.
- CSS variable overrides, UI toggle, and theme runtime behavior.
- No backend changes.

## Phase Status
| Phase | Description | Status |
| --- | --- | --- |
| 1 | Dark palette token overrides in shared base styles | pending |
| 2 | Prevent FOUC with synchronous head script | pending |
| 3 | Add theme toggle UI in header | pending |
| 4 | Add theme runtime module (init, toggle, persistence, OS listener) | pending |
| 5 | Add transition polish for theme switching | pending |
| 6 | Verification pass across pages and key components | pending |

## Implementation Plan

### Phase 1 — Dark palette tokens
- Add `html[data-theme="dark"]` token overrides in `sharedStyles/base.css`.
- Use the selected purple-tinted dark palette.
- Ensure alpha overlays flip from black alpha to white alpha.

### Phase 2 — FOUC prevention
- Add a minimal inline synchronous script in `partials/head.html`.
- Resolve theme priority as:
  1. explicit `localStorage` preference (`color-scheme`), then
  2. OS preference via `prefers-color-scheme: dark`.
- Set `document.documentElement.dataset.theme` before first paint.

### Phase 3 — Toggle button UI
- Add a `theme-toggle` button in `partials/header.html` (inside `.nav-links`, before divider).
- Include icon handling (sun/moon) and accessibility attributes.
- Add styling in `sharedStyles/header.css`.

### Phase 4 — Theme module
- Create `src/utils/theme.ts` with:
  - `initTheme()` for startup sync and event wiring.
  - `toggleTheme()` for switching, persistence, and button state updates.
  - OS preference listener that only applies when no explicit saved preference exists.
- Load module script from header partial.
- Optionally update `meta[name="theme-color"]` dynamically.

### Phase 5 — Transition polish
- Add smooth transition for background/text color changes in `sharedStyles/base.css`.

### Phase 6 — Verification
- Validate all primary pages in both themes.
- Confirm Shadow DOM consumers still inherit theme tokens.
- Confirm no flash-of-wrong-theme on reload.
- Validate explicit preference persists and overrides OS changes.

## Key Decisions
1. **Dark palette approach**: purple-tinted dark surfaces (`hsl(256 15% ...)`) instead of neutral gray.
2. **Critical token handling**: convert alpha-black overlays to alpha-white overlays in dark mode.
3. **Header/appbar branding**: keep purple brand treatment unchanged across themes.
4. **FOUC strategy**: synchronous inline script in document head.

## Open Questions
1. Toggle icon semantics: show current mode icon vs. next-action icon.
2. Whether `theme-color` should remain static brand purple or adapt by theme.

## Risks & Mitigations
- **Risk**: Insufficient contrast in dark error states.
  - **Mitigation**: Explicit overrides for `--text-error` and `--bg-error`.
- **Risk**: FOUC due to delayed script execution.
  - **Mitigation**: Keep initialization script tiny and inline in `<head>`.
- **Risk**: OS listener overriding explicit user choice.
  - **Mitigation**: Guard listener behavior when local preference exists.

## Errors Encountered
| Error | Attempt | Resolution |
| --- | --- | --- |
| None yet. | - | - |
