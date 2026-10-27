# Money Tracker

**A private web app for personal finances across currencies: every transaction at that
day's exchange rate, budgets, the people and events money was spent on, and net worth over
time.**

It replaces an eight-year budgeting spreadsheet and is built to import all of it.

## Status

Planning. The requirements, schema design, security model and first decisions are written;
no code yet. Next is [phase 0 of the roadmap](docs/03_planning/roadmap.md): scaffold, auth
with MFA, and the row-level security pattern with its tests.

## Stack

- **TanStack Start** (React) with **shadcn/ui**. Server functions are the Node backend.
- **Supabase**: Postgres as the source of truth, Auth with TOTP MFA.
- **Netlify** for hosting and scheduled jobs (exchange rates, recurring transactions).

Why each, and what was rejected: [decisions.md](docs/01_building/decisions.md).

## Security

Multi-user from the first migration, private and invite-only for now. Every table has
row-level security tested in CI, foreign keys carry the owner so rows cannot reference
another user's data, MFA is required by database policy, and the browser never queries the
database directly. Full model: [security.md](docs/01_building/security.md).

## Docs

| | |
|---|---|
| [brief.md](docs/00_briefing/brief.md) | The problem and goals |
| [requirements.md](docs/00_briefing/requirements.md) | Every feature, with an ID, its source and a phase |
| [notes/](docs/00_briefing/notes/) | The original French notes, verbatim |
| [reference-sheets.md](docs/00_briefing/reference-sheets.md) | What the current spreadsheets contain and how they map |
| [architecture.md](docs/01_building/architecture.md) | How the pieces fit |
| [database.md](docs/01_building/database.md) | Schema design |
| [security.md](docs/01_building/security.md) | Threat model and rules |
| [roadmap.md](docs/03_planning/roadmap.md) | Phases |

## Layout

```
docs/            dev journal: briefing, building, fixing, planning
src/app/         TanStack Start app (npm commands run here)
src/supabase/    migrations, pgTAP tests (Supabase CLI runs from src/)
src/data/reference/  lookup data (currencies, account types), in Git
src/data/local/  real data and source spreadsheets, never in Git
```
