# Money Tracker

[![Netlify Status](https://api.netlify.com/api/v1/badges/aa42b944-4059-4292-b1cb-7d800a522410/deploy-status)](https://app.netlify.com/projects/ff-money-tracker/deploys)

A private, bilingual web app (TanStack Start, Supabase, Netlify) that takes every transaction
in its own currency, with the people and events it was for, and turns eight years of
budgeting history into a dashboard and a net worth over time.

The goal was to stop asking a spreadsheet questions it was never built to answer.

<!--
Hero media, to add. Capture from invented data only (the /design gallery or the e2e
account), never from the owner's account.
  docs/assets/dashboard.png      the dashboard, a year of invented spending
  docs/assets/transaction.gif    adding a split expense in a foreign currency on a phone
-->

## Highlights

- 🔐 **Security lives in the database.** Every table has row-level security with a pgTAP
  test proving a second user sees nothing, foreign keys carry the owner, MFA is required by
  policy, and CI fails if a Supabase client reaches the browser bundle.
- 💱 **Every amount in its real currency.** Stored as Postgres `numeric`, converted at read
  time with that day's central-bank rate, so changing the display currency rewrites nothing.
- 🤝 **Money has a context.** People, reimbursements and events attach to transactions, and
  "my share" of a shared bill is computed once in SQL for every report.
- 📥 **Eight years of history on day one.** A fixed CSV format imports transactions and net
  worth history in one atomic call, with a check step, merges and undo.
- 🎨 **One visual language, in French and English.** A warm, grainy palette checked for
  contrast, shared components for every sheet, picker and list, a privacy mode that masks
  every figure, and every string, number and date localized.

## Overview

Live at https://ff-money-tracker.netlify.app (invite-only). A request goes through these steps:

1. Sign-in and the TOTP challenge run as server functions; the session sits in an
   `httpOnly` cookie.
2. A page calls a server function. Zod validates the input.
3. The server function calls Supabase with the user's session, so RLS applies to every query.
4. A write that touches several rows (a split, a transfer, an import) is one `security
   invoker` SQL function, atomic and RLS-checked.
5. Reads join `exchange_rates` on the transaction date. Balances, totals and net worth are
   computed on read and never stored.

| Area | State |
|---|---|
| Sign-in with MFA, French and English, currencies and rates | Built |
| Accounts, categories, merchants, transactions (splits, transfers, foreign currency) | Built |
| People, reimbursements, events, holdings and net worth | Built |
| CSV import and export, dashboard, privacy mode | Built |
| Recurring transactions, account deletion; budgets as a nice-to-have | Next ([roadmap](docs/03_planning/roadmap.md)) |

The spreadsheet is retired: the app has held the full history and every new transaction
since the first import.

## Problem

My finances lived in Google Sheets for eight years. The first setup ran from 2018 to 2022.
In 2023 I started over on Aspire Budgeting, a template built around envelope budgeting,
which I never used. Instead I kept tweaking it: investment categories handled in a special
way, new dashboards and new ways to present the data, net worth in the same file, then
multi-currency support after a move from Canada to Switzerland. Each change was layered on
the last, and the sheet became too messy to keep extending. A first prototype on Lovable
proved the idea and produced the list of corrections that became the
[requirements](docs/00_briefing/requirements.md), and this repo is the rewrite on a stack I
control.

## Goals

- Every transaction in its real currency, at that day's rate.
- People, groups and events attached to spending.
- Net worth with contributions separated from growth.
- The full spreadsheet history imported before the app replaces it.
- French and English, usable on a phone.

## Architecture

One TanStack Start app is both the interface and the backend, and Postgres holds the money
rules. The browser talks only to server functions; the server talks to Supabase with the
user's own session, so RLS is the second wall behind Zod. The secret key is used only by
scheduled jobs.

```
  Browser (React 19, shadcn/ui, TanStack Router)
        │  server functions only, no Supabase client in the bundle
        ▼
  TanStack Start server (Node, on Netlify Functions)
        │  user's session  ──►  RLS applies          (every request)
        │  secret key      ──►  exchange rates only  (scheduled job)
        ▼
  Supabase: Postgres + Auth (TOTP MFA)
        ▲
        │  daily rates, history back to 2018
  Frankfurter (central-bank rates)
```

```
docs/                dev journal: briefing, building, fixing, planning
src/app/             TanStack Start app; every command runs here
  src/routes/        file routes
  src/server/        server functions only, one file per feature
  src/lib/<feature>/ model, form draft and list logic
  src/components/    shared pieces by role, then one folder per feature
src/supabase/        migrations and pgTAP tests
src/data/reference/  lookup data, in Git
src/data/local/      real data, never in Git
```

`lib/` and `server/` never import from components or routes, so a component takes its types
from `lib/`. As a result, adding a feature means a migration with its RLS test, a server
file and a feature folder; the shared form, sheet and picker components stay untouched.

### Stack

| Layer | Choice |
|---|---|
| Database and auth | Supabase Postgres and Auth |
| Backend | TanStack Start server functions on Netlify Functions |
| UI | React 19, TanStack Router, shadcn/ui on Tailwind, Recharts |
| Validation | Zod on every server function input, generated database types |
| Languages | react-i18next for messages, `Intl` for numbers and dates |
| Tests | Vitest, pgTAP, Playwright on a local stack in CI |

### Run it

From `src/app/`: `npm install`, then `npm run dev`. `npm run verify` runs every check CI runs
on the app. First-time setup, from an empty Supabase project to a deployed site, is in
[setup.md](docs/01_building/setup.md). The [brief](docs/00_briefing/brief.md) links the rest
of the docs.

## Challenges

The code was written with Claude. My part was deciding what to build, how it should look
and behave, and whether the result was right.

- **Architecting before any code.** Security first, multi-user from v1, money as exact
  decimals, a fixed import format: these were set at the start, with the rejected options
  written down so they would not come back later ([decisions.md](docs/01_building/decisions.md)).
- **Guiding the assistant, and learning how to instruct it.** It starts every session with
  no memory, so the rules went into [CLAUDE.md](CLAUDE.md), hooks and the dev journal.
  A vague request gets plausible code that looks finished; much of the work was learning to
  ask precisely and to ask for options before code ([process.md](docs/01_building/process.md)).
- **A design that is pleasant and consistent.** A visual direction chosen from two
  reference images, contrast checked by hand, then repeated design reviews screen by screen.
  New screens kept drifting from the shared components until a dev-only `/design` gallery
  made them visible ([visual direction](docs/00_briefing/designs/01-visual-direction.md)).
- **QA, a lot of it.** Every feature was tried by hand, on a desktop and on an iPhone, where
  sheets, the keyboard and Safari's zoom produced most of the bugs in
  [bugs.md](docs/02_fixing/bugs.md).
- **Preparing eight years of data.** Merchants left in notes, foreign amounts typed into
  memos, catch-all categories and trips with costs outside their dates all had to be
  cleaned before the history fit the import format.

These constraints shaped nearly every decision in the project.

## Key Decisions

- **Rewrite the prototype on a stack I control.** The Lovable prototype proved the idea;
  holding financial data called for my own schema, migrations in Git and RLS I can test
  ([ADR-001](docs/01_building/decisions.md), [ADR-006](docs/01_building/decisions.md)).
- **The import before the dashboard.** Everything a transaction can carry (people, events,
  holdings) was built first, so eight years of history were prepared in one pass and the
  dashboard was designed on real data instead of invented figures ([roadmap](docs/03_planning/roadmap.md)).
- **The docs are the assistant's memory.** Every structural choice is an ADR written when it
  is made, requirements carry IDs, and the assistant never commits: I read each diff and
  commit it myself. The alternative, relying on chat context, lost decisions between sessions.
- **The platform first, few dependencies.** Native form actions, `Intl` and a small CSV
  parser instead of a library per concern, and each dependency that stays is listed with
  its reason ([ADR-011](docs/01_building/decisions.md)).
- **A design gallery over Storybook.** One dev-only route renders the shared components with
  the app's own providers, with no second build to keep in sync
  ([ADR-043](docs/01_building/decisions.md)).

## Future Work

- Custom SMTP and a sign-in throttle per IP and per email, both needed before a second real user.
- Recurring transactions, then budgets as a nice-to-have.
- Comparing spending across a move between countries, as a share of income instead of amounts.
- Importing a bank's own CSV with a saved column and category mapping (IMP-03).
- Net-worth projections and scenario budgets for a new city.

More ideas, with their reasoning, are in [improvements.md](docs/03_planning/improvements.md).

## Lessons Learned

- With an AI assistant, the bottleneck moves from writing code to describing what you want.
  A precise instruction is worth more than a fast one.
- Consistency needs a place to live. Shared components only stay shared when someone can see
  them side by side and refuses a new screen that ignores them.
- Tests prove the parts; using the app on a real phone proves the whole. Most bugs worth
  fixing were found by hand.
- Migrating years of personal data is a project of its own. A strict import format forces
  the cleanup decisions the old tool let you postpone.
- Decisions written down when they are made keep their reasons, which is what lets work
  stay coherent across many short sessions.
