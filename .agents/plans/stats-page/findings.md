# Findings & Decisions

## Existing Metadata Shape

`ClientMetadata` currently has:

- `timestamp: number`
- `companyCount: number`
- `companyNames: [string, string][]` — id/name tuples, all companies
- `jobCount: number`
- `recentJobCount: number`
- `presenceCounts: Partial<Record<Presence, number>>` — onsite/remote/hybrid/""
- `jobFamilyCounts: Partial<Record<JobFamily, number>>` — 14 family buckets + ""

## Backend Aggregation

`aggregateMetadata()` in `db.ts` runs a full scan of the jobs container and computes counts.
It is called at end of each sync run (`onComplete: refreshMetadata`).

The existing pattern: iterate all jobs, tally counts into plain objects, upsert two metadata
documents (`id: "job"`, `id: "company"`).

Extending this function is straightforward — same iteration loop, just accumulate more counters.

## Salary Data Availability

`Job.salaryRange` has `{ currency, cadence, min, max }`. To compute percentiles:

- Collect all `(min+max)/2` midpoints
- Sort and compute p25, median, p75
- Only emit buckets with ≥10 data points
- Focus on `"salary"` cadence only (annual), ignore hourly/stipend
- **No currency segmentation** — site is US-only, currency is always USD
- Produce one overall bucket + one bucket per job family (trusted dimension)

## Location Data

`Job.primaryLocation = { city, regionCode, countryCode }` is reliable structured data. It
compresses to a plain string in `ClientJob.location` for legacy display reasons only — that
doesn't affect its reliability as a source for aggregation.

Since the site is US-only, clamp aggregation to records where `countryCode === "US"` (or is
absent). Aggregate by `regionCode` (US state code) for the top-locations breakdown; city-level
granularity is too noisy. Emit top 10 states by job count. The `getTopLocations()` helper maps
state codes to full names via a lookup table in `enumLabels.ts`.

## Frontend Page Pattern

- `src/stats.html` — Vite auto-discovers it as a page entry
- Import `./stats/stats.ts` as the module entry
- The `<stats-page>` element (or section elements) fetches via `metadataModel`
- Shadow DOM components registered in `stats.ts`

## Component Architecture for Stats

The stats page can use a single top-level `<stats-page>` custom element that:

1. Calls `metadataModel` to fetch data
2. Populates child components via property setting or re-renders inner HTML

Alternatively (simpler, more like existing pattern):

- Each chart section is its own component: `<stats-job-families>`, `<stats-presence>`, etc.
- Each component independently calls `metadataModel` (TanStack cache ensures single fetch)
- Easier to develop/test independently

Decision: **One component per section** (matches existing pattern, avoids prop-drilling).

## SVG Chart Approach

### Horizontal Bar Chart

```html
<div class="bar-row" style="--pct: 42">
  <span class="label">Engineering</span>
  <div class="bar"><div class="fill"></div></div>
  <span class="value">42%</span>
</div>
```

`.fill { width: calc(var(--pct) * 1%); }` — pure CSS, no JS layout.

### Donut Chart (SVG)

Use `stroke-dasharray` + `stroke-dashoffset` on `<circle>` elements.

- `r = 15.9155` (so circumference ≈ 100)
- Each segment: `stroke-dasharray = "pct remainder"` with `stroke-dashoffset` for rotation
- Needs a small JS helper to compute offsets from the data array

### Data Table

Plain `<table>` with `scope="col"` headers. Sortable via click on `<th>`.
Use `aria-sort="ascending|descending|none"`.

## Enum Label Maps

```ts
// enumLabels.ts
export const jobFamilyLabels: Record<JobFamily | "", string> = {
  engineering: "Engineering",
  design: "Design",
  product: "Product",
  data: "Data & Analytics",
  it: "IT",
  security: "Security",
  marketing: "Marketing",
  sales: "Sales",
  customer_success: "Customer Success",
  ops: "Operations",
  finance: "Finance",
  hr: "HR",
  legal: "Legal",
  healthcare: "Healthcare",
  "": "Other",
};

export const presenceLabels = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
  "": "Unspecified",
};
export const seniorityLabels = {
  intern: "Intern",
  entry: "Entry",
  mid: "Mid",
  senior: "Senior",
  "staff+": "Staff+",
  manager: "Manager",
  "director+": "Director+",
  "": "Unspecified",
};
// ... etc
```

## Technical Constraints

- No new npm dependencies (policy)
- All chart rendering must work without JavaScript for the static HTML skeleton
  (graceful degradation: skeleton is visible, JS populates it)
- Accessible: color is not the only channel (include text labels on all charts)
- Data loaded via `metadataModel` (TanStack cache, 1-hour TTL) — same single fetch for all sections

## Resources

- `packages/backend/src/db/db.ts` — `aggregateMetadata()` function
- `packages/backend/src/models/models.ts` — `Metadata` interface
- `packages/backend/src/models/clientModels.ts` — `ClientMetadata` interface
- `packages/backend/src/models/enums.ts` — all enum definitions
- `packages/frontend/src/api/metadataModel.ts` — `MetadataModel` class
- `packages/frontend/src/home/stats.ts` — existing stats component (simplified reference)
- `packages/frontend/src/components/componentBase.ts` — base class
