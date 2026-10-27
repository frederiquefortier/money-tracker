# How this gets built

This repo is built with an AI assistant (Claude), under rules kept in
[CLAUDE.md](../../CLAUDE.md) and enforced partly by hooks in `.claude/settings.json`. This file
records the method: what the assistant is allowed to do, how its output is checked, and
which decisions were the author's. The interesting part is not that a model wrote code; it is
where its proposals were changed, and why.

New entries in [Who decided what](#who-decided-what) go at the top of that table's section,
newest first, whenever a decision changes direction.

## Why the docs come first

The assistant starts every session with no memory of the last. Anything not written down
gets re-derived, fluently and plausibly, and can quietly contradict a decision made a week
earlier. So the documents are the state the work runs on:

- [requirements.md](../00_briefing/requirements.md) gives every feature an ID and a source,
  so a session can tell a requirement from an assumption.
- [decisions.md](decisions.md) records alternatives that were rejected, which is what stops a
  later session from proposing them again.
- The raw notes in [notes/](../00_briefing/notes/) stay verbatim, so the organised version
  can always be checked against what was actually asked.

## The rules, and the failure each one prevents

**Design before code.** Options and trade-offs first, an explicit decision second, code third.
An assistant produces a plausible implementation immediately, and a plausible
implementation is the most expensive kind of wrong answer: it looks finished, so the thinking
never happens.

**Every structural decision is an ADR, written when it is made.** Written afterwards, an ADR
documents what was built and loses the alternatives.

**Platform first, then mainstream** ([ADR-011](decisions.md)). The assistant tends to
reach for a library per concern, and sometimes for a newer, less known one. Every
dependency is listed in ADR-011 with the reason the native version is not enough.

**Real data never enters a transcript.** A hook denies reads of `src/data/local/`, `.env`
files and dumps. Category names and counts are discussed; amounts, memos and people are not.

**The assistant never commits.** It proposes a commit message; the author reviews the diff
and commits. Every change in the history has been read by a person.

**Docs are part of done.** The definition of done in [CLAUDE.md](../../CLAUDE.md) says which
document each kind of change must update, and a stop hook flags a session that changed code
without touching `docs/`.

## How the assistant's output is checked

| Risk | Check |
|---|---|
| A table readable by another user | pgTAP test per table: a second user sees zero rows (security.md) |
| A multi-row write half applied | The write is one SQL function; pgTAP tests its invariants (ADR-012) |
| Type drift between form, server and database | One Zod schema per input; generated database types; strict type-check in CI |
| A missing translation | English resources typed against French; type-check fails (ADR-008) |
| Docs drifting from code | Definition of done, the stop hook, a link and requirement-ID check in CI |
| A design flaw nobody asked about | Periodic whole-plan review passes, requested by the author (the first one found seven issues, below) |

## Who decided what

| Date | Topic | Assistant proposed | Author decided | Where |
|---|---|---|---|---|
| 2026-10-27 | Portfolio | Assessed the project as a portfolio piece: strong on method and security, weak on visibility and on its distinctive features arriving late | A public demo, a portfolio cut, and this file | improvements.md, DEM-01..02 |
| 2026-10-27 | Emoji picker | Flagged that the Google image mode breaks the CSP | Asked whether the picker should change; kept it with a self-hosted font | ADR-013 |
| 2026-10-27 | Plan review | Found: no transactions through supabase-js, ambiguous transaction currency, transfers between currencies, double-counted contributions, budgets without currency, scope too wide | Applied all of it; v1 cut to phases 0 to 2 | ADR-012, TRX-11 |
| 2026-10-27 | i18n library | Swapped to hand-written typed dictionaries in the dependency cut | Kept react-i18next: i18n is a real need, and the library is the known way to meet it | ADR-008 |
| 2026-10-27 | Import | A wizard with source profiles and mapping screens | Not v1. One fixed CSV format; users prepare their data first; the wizard goes to improvements | ADR-010, IMP-03 |
| 2026-10-27 | Dependencies | A library per concern (react-hook-form, TanStack Query, Zustand, decimal.js, i18next) | Native features first; about ten dependencies kept, each justified | ADR-011 |
| 2026-10-27 | Import | A one-off script in the repo, transactions reworked locally | Must live in the app and work for any user | ADR-010 |
| 2026-10-27 | Seed data | Generic starter categories | No seed: the real history exists and the categories will be designed by hand | ADR-010 |
| 2026-10-27 | Validation | Zod, without saying why | Asked why; kept once the runtime-validation reason was written down | ADR-003 |
| 2026-10-27 | i18n library | Paraglide JS | Rejected as unknown; rule added: production-grade, maintained, known tools only | ADR-008, CLAUDE.md |
| 2026-10-27 | Languages | French-only interface (copied from Lifebook's convention) | French and English | ADR-008, SET-04..06 |
| 2026-10-27 | Projections | Kept in phase 4 | Not v1 | improvements.md |
| 2026-10-27 | Currency model | Keep v1's "home currency over time" next to the display currency | Display currency only; an amount already in it is not converted, and converted amounts must be visibly marked | CUR-07, CUR-09 |
| 2026-10-27 | Stack | Answered "is Supabase up to it": yes, if RLS is disciplined, MFA enforced in policy, Pro plan, own backups | Supabase, TanStack Start, shadcn/ui, Netlify (the author's starting choices) | ADR-001..003, security.md |

## What the author supplied that the model could not

- **The feature list, from eight years of use.** The notes and the spreadsheets come from
  running a budget by hand since 2018, including a move between currencies.
- **Feedback from a first prototype.** The February 2026 correction prompts are what testing
  an earlier build revealed: institutions as free text, archived categories still
  selectable, a history popup that showed nothing.
- **Scope.** Every cut above (projections, the wizard, v1 as phases 0 to 2) was a product
  call about what matters first.
- **The taste rules.** Mainstream tools, fewer dependencies, plain prose. The assistant
  followed them once written; it did not arrive at them.
