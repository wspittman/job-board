## Plan: Light/Dark Mode Toggle

The site is CSS-variable-driven with a clean `:root` token system — ideal for a `data-theme="dark"` attribute approach. No preprocessor, no framework — pure CSS overrides and a small TS module. Shadow DOM components automatically inherit custom properties, so no special handling needed there.

---

### How to Decide on the Dark Palette

**Most tokens are straightforward** — just flip luminosity for text/bg. The **critical issue** is that `--bg-border`, `--bg-active`, and `--bg-hover` are all **alpha-black** (e.g., `hsl(0 0% 0% / 0.2)`). On a dark surface these are nearly invisible — they must be flipped to **alpha-white** (e.g., `hsl(0 0% 100% / 0.15)`). Similarly `--text-error` (30% lightness dark red) and `--bg-error` (95% lightness near-white) break on dark backgrounds.

**Open design decision**: dark backgrounds can be **neutral gray** (`hsl(0 0% 10%)`) or **purple-tinted** (`hsl(256 15% 10%)`). I'd recommend the tinted approach — it ties to the brand and looks intentional, not just inverted. The header's `.appbar` stays purple in both modes (it's a brand element, not a semantic surface).

**Tokens to override** in `html[data-theme="dark"]`:

| Token            | Light                 | Dark                            |
| ---------------- | --------------------- | ------------------------------- |
| `--text-default` | `hsl(0 0% 10%)`       | `hsl(0 0% 92%)`                 |
| `--text-muted`   | `hsl(0 0% 10% / 0.7)` | `hsl(0 0% 92% / 0.7)`           |
| `--text-error`   | `hsl(356 60% 30%)`    | `hsl(356 60% 70%)`              |
| `--bg-default`   | `hsl(0 0% 98%)`       | `hsl(256 15% 10%)`              |
| `--bg-surface`   | `hsl(0 0% 100%)`      | `hsl(256 15% 14%)`              |
| `--bg-border`    | `hsl(0 0% 0% / 0.2)`  | `hsl(0 0% 100% / 0.15)` ← flip! |
| `--bg-active`    | `hsl(0 0% 0% / 0.1)`  | `hsl(0 0% 100% / 0.12)` ← flip! |
| `--bg-hover`     | `hsl(0 0% 0% / 0.05)` | `hsl(0 0% 100% / 0.07)` ← flip! |
| `--bg-error`     | `hsl(356 60% 95%)`    | `hsl(356 60% 15%)`              |

Gradients auto-adapt since they reference `--bg-default`. Primary/secondary brand colors stay identical.

---

### What's Missing / Edge Cases

1. **Alpha-black colors** — the three `--bg-*` variables above. Most impactful bug if missed.
2. **FOUC (Flash of Unstyled Content)** — without a synchronous inline `<script>` in `<head>` that runs before paint, users see a flash of light mode. A module script won't cut it — needs to be a plain `<script>` tag.
3. **`--text-error` / `--bg-error`** — invisible/clashing on dark backgrounds.
4. **Runtime OS change** — need a `matchMedia` listener that responds to system preference changes only when the user hasn't explicitly saved a preference.
5. **`theme-color` meta** — currently hardcoded `#5c33cc` in `head.html`. Can be dynamically updated via JS. Low priority but worth noting.

---

### Phases (in order)

**Phase 1 — Dark palette tokens** _(CSS only, no JS)_
Add `html[data-theme="dark"]` block to sharedStyles/base.css. Can manually test immediately in DevTools before any JS exists.

**Phase 2 — FOUC prevention**
Add a tiny inline synchronous `<script>` to partials/head.html. Reads `localStorage.getItem('color-scheme')`, falls back to `matchMedia('(prefers-color-scheme: dark)')`, and sets `document.documentElement.dataset.theme` before first paint.

**Phase 3 — Toggle button UI**
Add a `<button class="theme-toggle">` with a Lucide `sun`/`moon` icon to partials/header.html (inside `.nav-links`, before the divider). Add styles to sharedStyles/header.css.

**Phase 4 — Theme module** _(parallel with Phase 3)_
Create `src/utils/theme.ts` with `initTheme()` (sync button state, attach OS change listener) and `toggleTheme()` (flip attribute, write localStorage, update `aria-pressed`). Add `<script type="module" src="/utils/theme.ts">` to `header.html`.

**Phase 5 — Transition polish**
Add `transition: background-color 200ms, color 200ms` to `body` in base.css for a smooth swap.

**Phase 6 — Verification pass**
Visual check all 5 pages in dark mode, verify Shadow DOM components (form inputs, combobox, chips inherit tokens correctly), confirm FOUC is absent on reload.

---

**Relevant files:**

- sharedStyles/base.css — Phases 1, 5
- partials/head.html — Phase 2
- partials/header.html — Phases 3, 4
- sharedStyles/header.css — Phase 3
- `src/utils/theme.ts` _(new)_ — Phase 4

---

**Confirmed Decisions:**

1. **Tinted vs. neutral dark**: Purple-tinted (`hsl(256 15% ...)`) is chosen.
2. **Toggle icon convention**: Show the current-mode icon (sun = you're in light mode).
3. **`theme-color` meta update**: Include in Phase 4.
