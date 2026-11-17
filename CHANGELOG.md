# Better Job Board changelog

## November 10, 2026

Maintenance

- Minor HTML/CSS adjustments, refactors, typechecking config improvements
- Dep: Replace `dry-utils-logger` with `tslog`
- Dep: `tsx`

## September 29, 2026

Maintenance

- Bug fixes, unit tests, minor refactors, and dependency updates.

Backend

- isGeneralApplication accuracy improved from .8467 to 0.9919 by updating production model

## July 9, 2026

Backend

- On refresh, always remove expired jobs based on DB date
- Remove currency and country filtering, now that DB is all US-only jobs
- Refactors to move toward cleaner non-LLM and light-LLM filtering on refresh

## July 2, 2026

Frontend

- Add new About page
- Mobile action button wording update and include filter/job counts
- Remove unused admin-only job refresh filter

Backend

- Save and reuse ETags from Greenhouse and Lever to request job data only when it has changed.
  - Reduces the amount of data transferred during nightly sync
- Add unit tests for ATS files
- Remove unused admin-only job refresh filter

## June 26, 2026

Backend

- Refactor backend code in preparation for ETag support
- AsyncQueue support end-of-group callbacks
- Add unit tests for atsFormat files and telemetry file

Infra

- Update GitHub action dependencies

## June 19, 2026

Backend

- Log content length of ATS responses
- Cleanup/prep work for etags
- Add unit tests for DB container classes

CLI

- When taking actions that use backend code directly, route the backend logging to the CLI log file

## June 11, 2026

Frontend

- Format all location facets as "City, ST"
- Unknown pages return a 404 status instead of redirecting to /404
- Webcrawler / OG tag and image adjustments

Backend

- Increase refresh delays to be gentler on ATS's

## June 4, 2026

Feature

- Add a "filter" Order By that allows job seekers to control what 24 results they get from their query
  - Most recent post time (default) (current behavior)
  - Highest salary (of the minimum end of salary ranges), with unlisted pay last
  - Lowest required experience, with jobs listing no experience requirement first

Frontend

- Job Details: fix bug where long links were not wrapping properly. This was especially annoying in mobile.

Backend

- Job extraction eval loop
  - Improved production accuracy from 0.9376 to 0.9511 by updating models and prompts.
  - This is ~17% error reduction
- Minor city query accuracy improvement

CLI

- Evals: Update llm costing with latest values and clearer reporting

## May 28, 2026

Frontend

- Improve issues with form elements on iOS webkit
- Assorted spacing and wording improvements, mostly in the Home page.
- Dep: http-proxy-middleware from v3 to v4

## May 21, 2026

Feature

- Replace the fuzzy match "location" filter with a City input and State/Territory selector.
  - Now that the board is US-only, this simplifies the user experience and reduces the complexity of handling locations.
  - State is an exact match, City is a fuzzy match (eg. "NYC", "New York", and "new yrk city" will all match to "New York City").
  - Bookmarked "location" filters are replaced with "city" filter (preserving existing search links)

Frontend

- Number and currency formatting (eg. 15k) truncates towards zero instead of rounding, to avoid inflating.

Backend

- Results are ordered by most recent postTS rather than undefined order.
- Results no longer append "United States (US)" to location field since all jobs are US-based now
- Bug: Worldwide-remote jobs weren't appearing in results
- Bug: Enum values shouldn't be case sensitive (eg. "remote" vs "Remote")
- Replace console logging with dry-utils-logger so we get improved log handling and automatic save to (git-ignored) file

CLI

- E2E: Add beacon test
- E2E: Add refresh/jobs tests

## May 14, 2026

Frontend

- Remove "Recent" chip, since <30d isn't a big deal with the 90-day expiry. Also rename "New" to "Past Week" for clarity.
- Minor number/date/currency formatting changes as we centralize how we work with locales.
- Store and serve blog markdown files in addition to html versions. Add a `<link>` to the `<head>` of blog posts directing LLM agents to the markdown version for easier parsing and processing.

Backend

- Update /refresh/jobs to take an optional list of company ids (rather than single id).

CLI

- `html`: Add a `blog` subcommand that builds a full blog page from markdown and updates the main blog.html page and the sitemap.xml file. This simplifies the process of adding new blog posts and ensures they are properly linked and indexed.
- `e2e`: Overhaul how e2e tests are defined, make it easier to extend with new ATS types, and add Ashby tests.
- `api`: Add a `refreshCompanyJobs` subcommand to make it easier to trigger a company-specific refreshes.
- `ats`: Update `counts` subcommand to display fresh (<90d old) job counts and percentage (fresh/total) in addition to total job counts.

## May 7, 2026

Frontend

- Comprehensive unit test update

Backend

- Add support for Ashby ATS

## April 30, 2026

Features

- Additional home page stats
  - Previously, the home page displayed:
    - Count of jobs
    - Count of companies that have at least one active job
  - Added stats:
    - Count of jobs posted in past 7 days
    - Percentage of jobs that are Remote
    - The top 3 most common job families (eg. Engineering, Marketing, etc) and what percentage of jobs they represent
- Admin refresh querystring: Add a hidden `refresh=true` querystring to the /jobs page that filters to jobs added to the database in the past day. This simplifies daily review since "added to database" can differ from "job posting date".

Infra

- Dep: Typescript v5 -> v6
- Remove local agent skill descriptions in favor of new `agent-skills` repo

## April 23, 2026

CLI

- Combine the `lab` and `ops` packages into a `cli` package with improved scripts, help, documentation, and testing.

## April 16, 2026

Frontend

- Text update pass for US-only changes
- Rename "/explore" to "/jobs" to make it clearer
  - Existing "/explore" URLs will redirect
- Bugfix: explore/jobs filter parameters should be case-insensitive
- Deps: Vite v7 -> v8, Lucide V0 -> v1

Backend

- US-only filter transition
  - If no location filter is used, assume US-based
  - If location filter requests non-US, return empty results

Ops and Lab

- Replace console logging with dry-utils-logger so we get improved log handling and automatic save to (git-ignored) file

## April 9, 2026

Frontend

- Add a blog post: Why We're Focusing on US-Based Jobs
- Remove currency filter. Jobs will still display currency while non-US jobs age out

Backend

- Bug: Update daysSince filter to reflect the 90-day expiry
- Begin ignoring non-US jobs. Post-LLM processing, any jobs that are non-"en" language, non-"USD" currency, or non-"US" country code are ignored instead of added to the Jobs DB. This is a stopgap until we can add better pre-LLM filters to catch more of them and reduce the number of LLM calls we need to make.
- Move ignored job id tracking off of Company model to a dedicated TTL container. This allows ignored jobs to be automatically deleted after a certain amount of time and prevents the Company objects from growing indefinitely as more jobs are ignored.
- Update config so you don't need an app insights connection string for local work

Infra

- Quiet down format and test scripts so it is easier to recognize when something is wrong

## April 3, 2026

Frontend

- Add a new blog section to the site
- Add a Progress Report blog post as a changelog
- Add a blog post about the reasoning behind decreasing job posting expiry to 90 days

Backend

- Update job posting expiry from 365 days to 90 days
- Add ability to set flex processing for specific LLM inference calls.

## March 26, 2026

Frontend

- Simplify and update spacing across the site for a cleaner, more modern look.
- Job Details: Updated fonts to match the rest of the site.
- Every HTML page gets its own unique meta description
- Add the first unit tests, for seven components
- Assorted build system improvements

Lab

- Add blogBuild command to build an HTML version of a markdown blog post

Agents

- Add a write-unit-test skill to the agent's repertoire

## March 19, 2026

Frontend

- Update stack of system fonts to go all-in on `system-ui`
- Simplify and update font sizing across the site for better readability.

Backend

- Update isGeneralApplication system prompt; Accuracy from 72% to 91% on a test sample of about 125 postings.
- Simplify when site metadata is updated and only include companies that have active jobs.

Lab

- Finish overhaul to make it easier to run evals against multiple LLM actions.
- Add option to pull a random job from many companies

## March 12, 2026

Frontend

- Add the natural language search option to the home page, in addition to the existing sample searches and the "explore" button.
- Replace `inter` web font with stack of system fonts for faster load time
  - On home page first load
    - Transfer size reduced from `79 kb` to `35 kb`
    - Critical path latency (Slow 4G) reduced from `2.8s` to `2.0s`

Backend

- Add support for using specific LLM models / reasoning levels for specific LLM inference calls. This allows us to use cheaper models for simpler calls and reserve the more expensive models for calls that require more complex reasoning.

Lab

- Begin overhaul to make it easier to run evals against multiple LLM actions.
- Add options to pull random jobs from a company, instead of needing a specific job ID.
- Add the first unit tests, for three utils files.

## March 5, 2026

Features

- New filter option: a natural language search that the server will translate into specific filters.

Frontend

- Bugfix: In mobile, tapping the already-selected job didn't open the details pane
- Length limits on inputs to match backend limits
- Thin scrollbars throughout site

## February 26, 2026

Features

- Company websites are returned with job data and displayed as links in the detail pane
- Company stage is displayed in the facet chips of the results and detail panes
- Company stage is added as a filter option

Frontend

- Facet chip improvements:
  - Comp: Compact large salary numbers (eg. $120,000 -> $120K)
  - Comp: Omit redundant combinations (eg. "Paid per Year") from results pane
  - Comp: Reword partial combinations to be more compact (eg. "Paid in USD per Year" -> "Per Year (USD)")
  - Improve ordering of facets to surface more important ones first

- Intl (minor): prefer -inline/-block -start/-end to -left/-right/-top/-down for better RTL support

Backend

- Instead of denormalizing company names on job objects, keep them cached with company metadata and apply them to jobs as they are being shaped for return to client
  - Also add company website to the cached metadata and return it with jobs
- Add support for mock CosmosDB data for the agents

## February 19, 2026

Frontend

- Bug: Short company ids (eg. H1) were dropped from queries

Backend

- Replace `DELETE /job` with `DELETE /company/job` that also ignores from future syncs

Ops

- Add ignoreJob command that calls `DELETE /company/job`

## January 29, 2026

Frontend

- Accessibility: Combine header logo link and title link into a single link (same visuals)
- Accessibility: Move header logo/title link inside the navigation landmark

Backend

- Job ingestion: normalize all-caps titles to reasonable casing
- Job ingestion: extract property for the language the job is written in
- Add `company/jobs/sync` API (admin-only) to sync job fields inherited from company (company name, size, stage)

Ops

- Add command to trigger the new `company/jobs/sync` API for a company

## January 15, 2026

Telemetry week: In order to estimate unique users and sessions across page loads, we add random IDs to localStorage and sessionStorage. These IDs are sent with each API request (as headers, body, or query params depending on the request) and logged as properties in our telemetry system.

Frontend

- Update FAQ answer for data collection question
- Add the functionality to generate, store, and send telemetry IDs
- Update how dev mode handles API proxying

Backend

- Add middleware to log incoming telemetry IDs from headers / querystring
- Add a new "/beacon" endpoint to log page loads
- Add unit tests for new telemetry middleware, endpoint, and input validator

Lab

- Add proper linter and formatter

## January 8, 2026

Frontend

- Minor rendering perf improvements
- Decrease HTML cache from 1 day to 15 minutes so the weekly release is visible sooner

Backend

- Prevent repeated company additions from triggering redundant LLM calls
- Auth failures now return a standardized error response
- Remove unused `ts-node` package
- Add unit tests for 8 new files

Ops

- Rename from `admin` to `ops` to better reflect purpose
- Add `e2e` command with ping, validation, unknown handling, and company add/delete/refresh API tests
  - This replaces a bunch of manual curl calls for pre-release testing
- Add linting and formatting to package
- Standardize how environment variables and commands are defined across packages

Lab

- Rename from `evals` to `lab` to better reflect purpose
- Add jobCounts script to quickly get job counts for many companies
  - This culls out dead companies and helps us prioritize which companies to add next
- Standardize how environment variables and commands are defined across packages

## December 18, 2025

Features

- Add filtering on Currency
- Combine compensation info into a single detail chip, and improve the display for non-US locales and currencies

Backend

- Unit tests for route Wrappers middleware

Other

- Pre-checkin and pre-deploy helper scripts
- Add package-level AGENTS.md files

## December 11, 2025

Features

- Add filtering on Pay Basis (ie. annually, hourly, stipend)

Frontend

- Sort the options in the Job Family filter alphabetically
- Update FAQ page and content
- Bug: Fix issue where headers disappear when using filter inputs on mobile
- Add proper linter and formatter

Backend

- Ignore / Remove any jobs that are more than 365 days old
- Add proper linter and formatter
- Add unit test for Auth middleware

Other

- Update top-level README

## December 4, 2025

Features

- Add filtering on Job Family (e.g., Engineering, Marketing, Design, etc)
- Add tooltip explanations for some filter options

Frontend

- Job detail Name + Apply button now always visible when scrolling
- Mobile
  - On Explore load, if no filters, open filter pane by default
  - Filters: Nav button from "Close" to "Show X Jobs", disabled if X=0
  - Filters: Add explanatory text at top
  - Details: Nav button from "Close" to "Back to Results"
- Update message card text
- Hide "per-diem" from hours filter because it produced too many false positives

Backend

- Extraction: Add "healthcare" as a job family option
- ATS timeout prevention improvements
  - Increase ATS timeout from 10s to 15s
  - Queue tasks now use a setTimeout (default 0ms) to yield to event loop between tasks
  - Introduce a 100ms delay between RefreshJobsForCompany calls

## November 26, 2025

Features

- Add filtering on Full-time vs Part-time vs Per-Diem

Frontend

- Add Bluesky link next to GitHub link
- Bugfix: Don't refresh results selection when switching focus from filter pane
- UX improvements
- Increase cache time for site metadata (favicon etc) from 1 day to 1 week

Backend

- Use Zod to validate API inputs

## November 20, 2025

Features

- Saved Jobs
  - A "copy-to-clipboard" button next to job Apply button copies a link to a specific job to clipboard
  - Loading the URL brings up the explore page with only that job and some UX adjustments
- Ignore 'general interest' jobs
  - When processing new jobs, a cheap LLM call is made to classify the job title as 'general interest' or not
  - General interest jobs are ignored and the Company DB object is updated with the ignored id to avoid reprocessing
- When loading a bookmarked search, start with filter pane collapsed

Frontend

- Delete legacy React frontend code
- Details pane uses same UX chips display as result cards
- UX fixes and improvements
- Now that frontend server.js is non-trivial, convert it to typescript and include it in the build process

Backend

- Add more patterns to malicious request detection and respond with 403 Forbidden instead of 404 Not Found
- Add initial unit tests for the backend package

Evals

- Cache embeddings locally to improve eval speed and reduce costs
- Add "playground" script with k-means clustering testing

## November 13, 2025

Frontend

- New "frontend2" package promoted to "frontend"
- Fix issue where html files had script and link tags at top of file instead of in head
- Add compression with brotli/gzip for faster delivery
  - Precompress static assets at build time
  - Serve compressed versions based on Accept-Encoding header
  - Dynamically compress JSON responses from the API
- Add caching headers. 1 hour for API, 1 day for non-hashed static assets, 1 year for hashed static assets
- Assorted UI fixes

New Measurements w/ Compression

| Local Builds     | Now     | Prev    | Legacy |
| ---------------- | ------- | ------- | ------ |
| Build time       | 0.355 s | 0.346 s | 5.5 s  |
| Dist folder size | 1.19 MB | 673 KB  | 4.1 MB |

| Home Page on Desktop Chrome on 250/120 Mbps Wifi | Now     | Prev    | Legacy |
| ------------------------------------------------ | ------- | ------- | ------ |
| First Contentful Paint                           | 0.587 s | 0.841 s | 1.08 s |
| Page Weight                                      | 65 KB   | 117 KB  | 674 KB |

| Home Page on Moto G Power with Slow 4G throttling | Now   | Prev  | Legacy |
| ------------------------------------------------- | ----- | ----- | ------ |
| First Contentful Paint                            | 1.4 s | 1.7 s | 4.4 s  |
| PageSpeed Insights Score: Performance             | 100   | 99    | 74     |
| PageSpeed Insights Score: Accessibility           | 100   | 100   | 86     |
| PageSpeed Insights Score: Best Practices          | 100   | 96    | 100    |
| PageSpeed Insights Score: SEO                     | 100   | 100   | 92     |

## November 6, 2025

Frontend2

- Reach feature parity with the React frontend.

| Local Builds     | Old    | New     |
| ---------------- | ------ | ------- |
| Build time       | 5.5 s  | 0.346 s |
| Dist folder size | 4.1 MB | 673 KB  |

| Home Page on Desktop Chrome on 250/120 Mbps Wifi | Old    | New     |
| ------------------------------------------------ | ------ | ------- |
| First Contentful Paint                           | 1.08 s | 0.841 s |
| Page Weight                                      | 674 KB | 117 KB  |

| Home Page on Moto G Power with Slow 4G throttling | Old   | New   |
| ------------------------------------------------- | ----- | ----- |
| First Contentful Paint                            | 4.4 s | 1.7 s |
| PageSpeed Insights Score: Performance             | 74    | 99    |
| PageSpeed Insights Score: Accessibility           | 86    | 100   |
| PageSpeed Insights Score: Best Practices          | 100   | 96    |
| PageSpeed Insights Score: SEO                     | 92    | 100   |

## October 30, 2025

Feature

- Add UTM tags to all outbound links

Admin

- Add script to delete company and its jobs

Backend

- Security improvements around admin token
- Performance improvements around metadata loading

Frontend2

- Nearing functional parity with old frontend.
- Show a useful message if JS is disabled.

## October 16, 2025

Frontend2

- Experimental non-React frontend, home and FAQ pages
- Comparison of performance metrics

| Metric                   | New – Initial | Old – Initial | New – Repeat | Old – Repeat | Description                                          |
| ------------------------ | ------------- | ------------- | ------------ | ------------ | ---------------------------------------------------- |
| Time to First Byte       | 0.381 s       | 0.343 s       | 0.346 s      | 0.379 s      | When did the content start downloading?              |
| Start Render             | 0.800 s       | 1.800 s       | 0.600 s      | 0.700 s      | When did pixels first start to appear?               |
| First Contentful Paint   | 0.837 s       | 1.813 s       | 0.660 s      | 0.760 s      | How soon did text and images start to appear?        |
| Speed Index              | 0.833 s       | 1.919 s       | 0.613 s      | 0.771 s      | How soon did the page look usable?                   |
| Largest Contentful Paint | 0.837 s       | 1.813 s       | 0.660 s      | 0.760 s      | When did the largest visible content finish loading? |
| Cumulative Layout Shift  | 0.022         | 0.008         | 0.022        | 0.008        | How much did the design shift while loading?         |
| Total Blocking Time      | 0.000 s       | 0.000 s       | 0.000 s      | 0.000 s      | Was the main thread blocked?                         |
| Page Weight              | 96 KB         | 673 KB        | 96 KB        | 673 KB       | How many bytes downloaded?                           |

## October 9, 2025

Backend

- Remove `axios` dependency
- Add ability to specify LLM reasoning effort level

Evals

- Move eval code into a new package
- Update to be able to test against more models

Admin

- New package with admin scripts to more simply run common admin tasks

Frontend2

- New package to begin rebuilding the frontend in vanilla HTML/CSS/JS

## October 2, 2025

Big data model overhaul

- Complete overhaul of data model
- Complete overhaul of evals
- Job extraction accuracy with production models improved from 0.84 to 0.92

## September 18, 2025

Backend

- Updated to use Node's `diagnostics_channel` for telemetry from shared libraries.
- Replaced TypeScript enums and enabled `erasableSyntaxOnly` in the compiler configuration.

## Prior

Initial structure and architecture that wasn't tracked release to release.
