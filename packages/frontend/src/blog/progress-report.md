---
title: Progress Report
description: A running record of the improvements we're making as we do our best to put the "better" in Better Job Board.
date: May 28, 2026
---

A running record of the improvements we're making as we do our best to put the "better" in Better Job Board.

## May 28, 2026

- Improved display issues with iOS webkit (eg. Chrome/Safari on iPhone).
- Assorted spacing and wording improvements in the Home page.

Note: During the summer months we may not post updates every week. We'll be spending less time on visible features and more time focused on the underlying data. We want to make some significant improvements to how we collect and understand jobs postings.

## May 21, 2026

The "location" filter has been replaced with separate City and State/Territory filters.

- Now that the board is US-only we can simplify how we handle locations.
- City is a fuzzy match (eg. "NYC", "New York", and "new yrk city" will all match to "New York City"), while State/Territory is an exact match.
- Bookmarked "location" filters will be updated to use the new "city" filter instead of "location".

Job results improvements

- Added 60+ companies to the board.
  - Now that we are through our backlog, this will slow down to our normal pace.
- Results are now the most-recently posted jobs that match the filters, instead whatever default behavior our database was giving us.
- Fixed a bug where worldwide remote jobs were being excluded from results.

Display improvements

- Location chip no longer appends "United States (US)" since all jobs are US-based now.
- Number and currency formatting truncates towards zero instead of rounding, to avoid inflating values.

## May 14, 2026

- Added 80+ companies to the board now that we have Ashby support.
- Removed the special "Recent" chip for jobs that were posted between 7 and 30 days ago. Now that we use a 90-day expiry time, 30 days isn't "recent".
  - Also rename the "New" chip to "Past Week" to make it clearer what it means.
- Minor number/date/currency formatting changes as we improve how we work with locales.

## May 7, 2026

Added support for the [Ashby](https://www.ashbyhq.com/) applicant tracking system (ATS).

Companies use an ATS to manage their job postings. By integrating with an ATS, we can automatically pull in job postings from companies that use them. Ashby is our third ATS integration, after Greenhouse and Lever, and we're excited to add it to the mix.

Expect an influx of new job postings in the coming weeks.

## April 30, 2026

Added more stats to the home page.

Previously:

- Total jobs
- Total companies that have at least one active job

Now:

- Total jobs
- Number of jobs that have been posted in the last 7 days
- Total companies that have at least one active job
- What percentage of the jobs are Remote
- The top 3 job families (eg. Engineering, Marketing, etc.) and what percentage of the jobs they represent.

The new data will appear after the next nightly processing.

Have ideas for other stats you'd like to see? Let us know!

## April 23, 2026

- Nothing visible this week. Changes were all behind the scenes to help us move faster in the future.

## April 16, 2026

- Renamed the Explore page to Jobs to make the purpose of the page clearer.
  - Existing links to "/explore" will continue to work by redirecting to "/jobs".
- Bugfix: filter names in the URL are now case-insensitive

### US-based jobs transition

- Searches will now return only US-based jobs, in most cases.
- Updated the text throughout the site to reflect the focus on US-based jobs.

## April 9, 2026

- We have decided to focus on US-based jobs to build a more accurate, trustworthy, and fast job board for the market we understand best.
  - See [Why We're Focusing on US-Based Jobs](./focusing-on-usa-jobs) for more on why we're making this change.
  - Began omitting new non-US-based job postings.
  - Removed the currency filter
- Bug: Update daysSince filter to reflect the 90-day expiry

## April 3, 2026

- Added a new Blog section to the site. Hello 👋
- Added this Progress Report as a way to share updates on what we've been working on.
- Jobs posts expire and are removed after 90 days, down from 365 days.
  - See [Why We're Moving to 90-Day Job Expiration](./moving-to-90-day-expiration) for more on why we're making this change.

## March 26, 2026

- Simplified and updated spacing across the site for a cleaner, more modern look.
- Job Details: Updated fonts to match the rest of the site.

## March 19, 2026

- Simplified and updated font sizing across the site for better readability.
- Switched fully to default device fonts.
- Data: Updated the company filter and home page count to list only companies with active jobs.
- Data: Improved logic for screening out "general application" roles.
  - Accuracy improved from 72% to 91% in our test sample of about 125 postings.

## March 12, 2026

- Home page: Added natural language search as a main entry point.

### Replacing the Web Font

This change deserves a little explanation.

Previously, we used a web font: a custom font downloaded by the browser when you visit the site. This is common on many websites because it makes typography more consistent across devices. Of course, many sites are also so bloated with frameworks and third-party trackers that an extra 40 KB font file barely matters.

Since we built Better Job Board to be fast and lightweight, the font download mattered more to us. In our testing, it accounted for about **55% of the home page download size**. On a slower 4G connection, the home page took about **40% longer** to load with the web font than without it, which was not a tradeoff we wanted to keep making.

We've now switched to default system fonts that are already on your device. This helps the site load faster, especially on slower connections. There may be small differences between operating systems, but unless you're actively looking for them, you probably won't notice.

## Before

There were earlier changes too, but when we launched the Blog section and this Progress Report, we only went back a few weeks.

We'd rather spend our time improving the site going forward than trying to reconstruct every past update.

If you're curious about the project's history, you can browse the full change history on the [GitHub repository](https://github.com/wspittman/job-board).
