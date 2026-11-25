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

Inside `src/app/src/`, where a file goes ([ADR-026](docs/01_building/decisions.md)): no file
at the root of `components/`; shared pieces in a role folder (`layout`, `forms`, `sheet`,
`combobox`, `lists`, `feedback`, `display`), a feature's own in its folder (`form/`, `list/`,
what other features use at its root); every shared hook in `hooks/` (ADR-076);
`lib/<feature>/` holds `<entity>.ts` (model), `<entity>-draft.ts` and `<entity>-list.ts`; `server/` holds server functions only, so types come from `lib/`;
shared class strings go in `components/styles.ts`.

**Every command runs from `src/app/`**, including the Supabase CLI:
`npx supabase --workdir .. <command>` (`--workdir ..` points it at `src/supabase/`). Until real data exists, the Supabase project is the dev database: push migrations from the
laptop with `npm run db:push` and try work locally before it reaches `main` (ADR-022). There is one account, the owner's; unfinished work is tried there (ADR-021).

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
| touches the schema | [database.md](docs/01_building/database.md), with a pgTAP test, and `npm run db:types` |
| makes or reverses a structural choice | a new ADR in [decisions.md](docs/01_building/decisions.md) (never edit an old ADR's decision; supersede it) |
| adds a dependency | its line in ADR-011 |
| changes the import format | [import.md](docs/01_building/import.md) and the templates |
| changes a security rule | [security.md](docs/01_building/security.md) |
| changes direction on a proposal | the session's entry in sessions.md, saying what was proposed and what the author decided |
| ends a working session | the session's entry in [sessions.md](docs/01_building/sessions.md): one per session, short, kept up to date as the work goes; the big lines of what the author asked or corrected, and why |
| changes what the project is or how to run it | [README.md](README.md) |

Commit messages start with a plain type, `feat:`, `fix:`, `docs:`, `chore:`, `ci:`, `refactor:`,
with no scope and no requirement ID in it.

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
- **One home, one name.** Before adding a file, find its folder in the layout above. An
  export is named for what it is, and no two files export the same name. A shared class
  string, hook or type that a second file needs moves to its shared folder first.
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
