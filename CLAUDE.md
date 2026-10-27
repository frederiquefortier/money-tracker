# CLAUDE.md

Guidance for AI assistants working in this repository.

## What this is
**Money Tracker** (working title) is a private, multi-user web app for personal finances:
transactions in any currency, budgets, people and events, net worth. It replaces an
eight-year budgeting spreadsheet. Start with the [brief](docs/00_briefing/brief.md) and the
[requirements](docs/00_briefing/requirements.md).

## Core principle (do not violate)
**Security first.** This app holds financial data. Read
[security.md](docs/01_building/security.md) before touching the schema, auth, or anything
that runs on the server. In short:
- Every table gets RLS in the migration that creates it, plus a pgTAP test proving another
  user sees nothing.
- Foreign keys between user tables include `user_id` ([ADR-005](docs/01_building/decisions.md)).
- The browser never queries the database; server functions do, with the user's session
  ([ADR-006](docs/01_building/decisions.md)).
- The Supabase secret key is only used by scheduled jobs, never on a request path for a user.
- Money is `numeric`, never a float, in SQL and in TypeScript ([ADR-004](docs/01_building/decisions.md)).

## Architecture
TanStack Start (React, shadcn/ui) with server functions as the Node backend, Supabase
(Postgres + Auth) as the source of truth, deployed on Netlify. See
[architecture.md](docs/01_building/architecture.md) and the draft schema in
[database.md](docs/01_building/database.md).

## Layout
`src/app/` is the TanStack Start app, `src/supabase/` the Supabase CLI project,
`src/data/` holds `reference/` (in Git, lookup data) and `local/` (out of Git, real data).
There is no seed of user data; history comes in through the fixed-format CSV import
([import.md](docs/01_building/import.md)). The repo
root keeps only `README.md`, `CLAUDE.md`, `.gitignore`, `.github/`, `.claude/` and `docs/`
([ADR-007](docs/01_building/decisions.md)).

**npm commands run from `src/app/`. Supabase CLI commands run from `src/`.**

## Working in the docs (dev journal)
- Before changing direction, check [decisions.md](docs/01_building/decisions.md) (ADRs).
- Requirements have IDs (`TRX-04`). Reference them in ADRs and commits; when a requirement
  changes, edit [requirements.md](docs/00_briefing/requirements.md), never the raw notes in
  `docs/00_briefing/notes/`, which are kept verbatim.
- Log bug fixes in [bugs.md](docs/02_fixing/bugs.md), new concepts in
  [learnings.md](docs/01_building/learnings.md), AI sessions in
  [sessions.md](docs/01_building/sessions.md), and ideas in
  [improvements.md](docs/03_planning/improvements.md).
- Keep each doc in the format defined at the bottom of its file. New entries go at the top,
  newest first, directly below the comment marker.

## Definition of done
A change is done when the docs it affects are updated in the same change. A stop hook
flags a session that touched `src/` without touching `docs/`.

| The change... | ...also updates |
|---|---|
| adds, changes or drops a feature | [requirements.md](docs/00_briefing/requirements.md) (the row, its phase) and [roadmap.md](docs/03_planning/roadmap.md) |
| touches the schema | [database.md](docs/01_building/database.md), with a pgTAP test |
| makes or reverses a structural choice | a new ADR in [decisions.md](docs/01_building/decisions.md) (never edit an old ADR's decision; supersede it) |
| adds a dependency | its line in ADR-011 |
| changes the import format | [import.md](docs/01_building/import.md) and the templates |
| changes a security rule | [security.md](docs/01_building/security.md) |
| changes direction on a proposal | a row in [process.md](docs/01_building/process.md#who-decided-what) saying what was proposed and what was decided |
| ends a working session | an entry in [sessions.md](docs/01_building/sessions.md) |
| changes what the project is or how to run it | [README.md](README.md) |

Commit messages reference requirement IDs (`feat(TRX-04): ...`).

## Conventions
- Meta-documentation and code are in **English**. The **interface ships in French and
  English** ([ADR-008](docs/01_building/decisions.md)): every visible string is a react-i18next
  key with both translations, every number, amount and date goes through `Intl` with the
  user's full locale, and reference labels have `_fr` and `_en` columns. User-typed content
  is never translated.
- **Platform first, then mainstream.** Use what the browser, Node, React 19, TanStack Start
  and Postgres already provide before adding a dependency ([ADR-011](docs/01_building/decisions.md)).
  When a dependency is warranted, name the widely used, maintained option; mention a newer
  or niche one only as a labelled alternative. A new dependency gets a line in ADR-011.
- **No real financial data or real names in Git.** Figures, memos and people from the
  spreadsheets stay in `src/data/local/`. Docs describe the *shape* of that data. Tests and
  demo data use invented people and invented amounts.
- Never read files in `src/data/local/` or any `.env` into a transcript.
- Write in a plain, human voice across prose, comments, and commits. No em dashes; use
  periods, commas, colons, or parentheses. Avoid the AI tells: "X, not Y" antithesis, "it's
  not just X, it's Y" framing, filler adjectives, and bold scattered mid-sentence. Keep
  comments minimal and factual.
- Comments and doc comments are selective. No comment on a helper whose name and signature
  say what it does. Keep the ones that record a constraint: a currency quirk, an RLS
  reason, an import format oddity.
