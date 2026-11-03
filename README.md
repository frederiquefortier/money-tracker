# Money Tracker

[![Netlify Status](https://api.netlify.com/api/v1/badges/aa42b944-4059-4292-b1cb-7d800a522410/deploy-status)](https://app.netlify.com/projects/ff-money-tracker/deploys)

A private web app for personal finances across currencies: transactions at the day's
exchange rate, budgets, the people and events money went to, and net worth over time. It
replaces an eight-year budgeting spreadsheet.

Built with Claude for my own use. The ideas, requirements and decisions are mine; how the
work is split, and where I changed the assistant's proposals, is in
[process.md](docs/01_building/process.md).

## Status

Live at https://ff-money-tracker.netlify.app (invite-only). Phase 0 is in place: sign-in
with MFA, invitations, password reset, FR and EN, and the row-level security pattern with
its tests. v1 is [phases 0 to 2](docs/03_planning/roadmap.md), when the spreadsheet can be
retired.

## Stack

TanStack Start (React, shadcn/ui) with server functions as the backend, Supabase (Postgres
and Auth), Netlify. Why: [decisions.md](docs/01_building/decisions.md).

## Security

Every table has row-level security tested in CI, foreign keys carry the owner, MFA is
required by database policy, and the browser never queries the database.
[security.md](docs/01_building/security.md).

## Run it

From `src/app/`: `npm install`, then `npm run dev`. `npm run verify` runs every check CI
runs on the app. First-time setup: [setup.md](docs/01_building/setup.md).

## Docs

| | |
|---|---|
| [brief.md](docs/00_briefing/brief.md) | The problem and goals |
| [requirements.md](docs/00_briefing/requirements.md) | Every feature, with an ID and a phase |
| [reference-sheets.md](docs/00_briefing/reference-sheets.md) | What the spreadsheets contain |
| [architecture.md](docs/01_building/architecture.md) | How the pieces fit |
| [database.md](docs/01_building/database.md) | Schema |
| [security.md](docs/01_building/security.md) | Threat model and rules |
| [setup.md](docs/01_building/setup.md) | From an empty Supabase project to a deployed app |
| [roadmap.md](docs/03_planning/roadmap.md) | Phases |
| [process.md](docs/01_building/process.md) | Working with an AI assistant, and who decided what |

## Layout

```
docs/                dev journal: briefing, building, fixing, planning
src/app/             TanStack Start app; every command runs here
src/supabase/        migrations, pgTAP tests (npx supabase --workdir .. from src/app)
src/data/reference/  lookup data, in Git
src/data/local/      real data, never in Git
```
