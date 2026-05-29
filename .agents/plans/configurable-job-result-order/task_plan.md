# Task Plan: Configurable Job Result Ordering

## Goal

Add a filter-pane control that lets job seekers choose a known result ordering, sends that choice to the backend, and applies it through a safe backend `ORDER BY` mapping while preserving the current post-time default.

## Current Phase

Planning complete. Next implementation session should start with Phase 1 and stop for feedback after Phase 1 is complete.

## Proposed Sort Options

Use stable API values that describe user intent, not database paths:

| API value | Label | Backend order |
| --------- | ----- | ------------- |
| `post_time` | Newest | `postTS DESC` |
| `highest_salary` | Highest salary | `salaryRange.min DESC` |
| `lowest_experience` | Lowest required experience | `requiredExperience ASC` |

The exact initial set can be adjusted before implementation, but every option must be allow-listed on the backend.

## Phases

### Phase 1: Shared Order Contract

- [ ] Add a `JobOrderBy`/similar type to backend client models.
- [ ] Add a matching frontend API type and enum helpers/options.
- [ ] Add `orderBy?: JobOrderBy` to backend `Filters` and frontend `FilterModelApi`.
- [ ] Validate `orderBy` in `useFilters`, preserving current behavior when the field is absent or invalid.
- [ ] Add/update validator and frontend enum tests.
- **Status:** pending

### Phase 2: Backend Query Ordering

- [ ] Replace the hard-coded `query.orderBy("postTS", "DESC")` call with a helper that maps `Filters.orderBy` to a known database field and direction.
- [ ] Default missing `orderBy` to `post_time`.
- [ ] Keep the mapping private or narrowly exported for tests, and never pass request values directly into `orderBy`.
- [ ] Add targeted backend tests for each supported option and for invalid/missing input.
- [ ] Verify behavior for jobs with missing salary or experience fields, especially whether Cosmos/mock DB keeps those jobs and places them predictably.
- **Status:** pending

### Phase 3: Frontend Filter Pane

- [ ] Add an "Order by" `jb-form-select` to the filter pane, likely in the `Other` group or a new compact "Results" group.
- [ ] Parse and serialize `orderBy` in `FilterModel` so bookmarked URLs work.
- [ ] Render a friendly chip label for non-default ordering, or decide intentionally whether the default should remain chipless.
- [ ] Ensure natural-language filter updates do not erase an existing manual ordering unless the API starts returning this field.
- [ ] Add/update `FilterModel` and `Filters` component tests for parsing, URL serialization, selected initial value, change emission, and chip behavior.
- **Status:** pending

### Phase 4: Verification and Documentation

- [ ] Run targeted workspace tests after each phase where practical.
- [ ] Run `npm run pre-checkin` before any commit, per repo instructions.
- [ ] Update docs only if the public API, workflow, or user-facing behavior needs explicit documentation.
- [ ] Add any surprising implementation lesson to root `Learnings.md` for review.
- **Status:** pending

## Key Questions

1. Should the initial known set be exactly `post_time`, `highest_salary`, and `lowest_experience`, or should Phase 1 choose a smaller set of `post_time` and `highest_salary` first?
2. Should the default `post_time` ordering appear as a removable filter chip, or should chips only show non-default ordering?
3. When sorting by salary or experience, should records with missing values stay in the result set and sort last, or should those sorts imply that the field must be present?
4. Should natural-language search ever set `orderBy`, or should ordering remain manual-only for this feature?

## Decisions Made

| Decision | Rationale |
| -------- | --------- |
| Use an allow-listed API enum instead of raw field names | Prevents query injection and keeps database field names decoupled from URLs. |
| Preserve `postTS DESC` as the default | Maintains current behavior for existing links and callers. |
| Treat the feature as part of filters | Existing URL, form, debounce, API fetch, and backend validation all flow through the filter model. |
| Use `write-unit-test` when implementation begins | Repo instructions require the skill when adding or updating unit tests. |

## Errors Encountered

| Error | Attempt | Resolution |
| ----- | ------- | ---------- |
| Sandbox denied creating `.agents/plans/configurable-job-result-order` | 1 | Retried `New-Item` with escalation approval and created the folder. |
