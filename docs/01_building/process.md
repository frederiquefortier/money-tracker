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
| 2026-11-03 | Category colours | Nineteen gem colours around the hue wheel, each keeping a white icon; siblings varied by lightness alone | Keep the five the author liked (ruby, yellow, green, royal, purple) and replace the rest: nineteen clean, saturated colours, deep and bright, with a dark icon on bright ones; a distinct colour per top-level category of a type, used picks marked in the form; siblings varied in hue and lightness, spread out and never brown or olive; one button to open or close every branch, in every tab, on Comptes too; a sort by name or colour; a true pink; health stays red; top-level colours follow meaning around the wheel, like a rainbow; gifts and donations under a yellow Communauté, pets lime beside it, outings purple and hobbies lavender side by side; the sort as an outline button with a chevron | designs/12-categories.md, designs/02-screens.md |
| 2026-11-03 | Category sheet details | "Supprimer la catégorie" and per-screen action keys; the icon centred above the form with "Modifier" and "Réinitialiser"; the native colour input as a rectangle; Favori as a checkbox in the sheet; twenty mid-tone swatches; Type and Parent as two separate fields; a parent row edited by a pencil like an institution header | "Supprimer" and one shared key per action everywhere; the icon as a labelled field on the left, the circle itself opening the picker with a pencil on hover, the "Suggérée" icon in place of a reset; the custom colour as the grid's last circle, a rainbow until picked, with no visible label; the favourite only on the row; nineteen jewel-tone swatches and the custom circle (twenty-nine tried, twenty was plenty), no browns or greys; a parent row opens its form like any row, the chevron alone toggles, children joined by elbow connectors as in a tree diagram (a single line down the branch was tried first); Parent indented under Type as its sub-field (Type itself a plain field) | designs/12-categories.md, designs/02-screens.md |
| 2026-11-03 | Spec alignment and the journal | Specs 13 to 18 as reviewed before the accounts corrections (sheet actions, top-bar save, "Enregistrer et ajouter", "Aucun", hints); spec 11's body still showing the old accounts design; a new sessions entry for each part of a session | Every spec follows the built screens; the rules live once in "Shared patterns"; spec 11 describes what was built; the category picker moves to spec 15 on `Combobox`. One sessions entry per session, edited during the day | designs/02-screens.md, sessions.md |
| 2026-11-03 | Categories layout | Spec 12 built as written: archive, reactivate and delete in the sheet; delete hidden when impossible; add button under the tree; a sheet picker of its own with "Aucun (niveau principal)"; "Enregistrer et ajouter"; the star only in the form | Same patterns as accounts: actions as row icons, delete muted with a toast, add beside the title, the shared `Combobox` for the parent with a clear button, one "Enregistrer", the star on each row; parents behave like institution headers (chevron and name toggle, pencil edits). The transaction picker is settled at spec 15 | designs/12-categories.md |
| 2026-11-03 | Category icon words | A curated list of 128 icons, each with French and English search words | Kept as drafted; each icon's own name is always one of its words | designs/12-categories.md |
| 2026-11-03 | Account name uniqueness | Account names unique among all of a user's open accounts | Unique per institution, so the same name can exist at two banks | designs/11-accounts.md |
| 2026-11-03 | Delete and action errors | Institution delete in its sheet while accounts delete from the row; errors as toasts on rows, inline in the sheet for institution delete; one place to be chosen for each | Every delete is an icon on its row or card header; every action failure is a toast | designs/11-accounts.md |
| 2026-11-03 | Page background | Pale pink cream behind plum text and buttons | Plum cream background and cards; outline buttons without a fill | designs/01-visual-direction.md |
| 2026-11-03 | Plum everywhere | Plum for the primary and its tints only; the group total aligned with the row balances | Text and borders in plum tints too; the header alignment reverted to total then pencil | designs/01-visual-direction.md |
| 2026-11-03 | Primary colour | The rose primary of the piggy-bank theme | Plum purple (hue 320), measured against the error red and the cream; yellow ruled out for text contrast. Names quoted in titles; totals aligned with balances | designs/01-visual-direction.md |
| 2026-11-03 | Archive and icons | "Fermer le compte"; icons of mixed sizes (16px in the institution header, 20px on rows); the closing date centred | "Archiver" everywhere in the interface; every icon action from one shared style; the date and the icons level with the account name, more room before the actions | designs/11-accounts.md |
| 2026-11-03 | Account actions | Close, reopen and delete as buttons inside the account sheet; "Supprimer Chèque ?" confirmations; French spaces before ":" and "?" | Icons on each account row, the sheet only edits; "Supprimer {name}" with "Cette action est irréversible."; no space before punctuation; "Solde à l'ouverture" without the currency | designs/11-accounts.md |
| 2026-11-03 | Reuse and text | A currency picker dialog of its own, an undo toast after removal, help behind icons, a sentence under close and delete | The account sheet and `Combobox` for adding a currency, `ConfirmDialog` for removal, no helper text anywhere: fix the label or layout instead | designs/10-settings-currencies.md |
| 2026-11-03 | Form details | A legend for the asterisk, help paragraphs under fields, a delete help text, the institution in a popup picker, toasts at the bottom | No legend; help behind an icon; delete disabled when impossible and confirmed in a shared red dialog; the institution typed in an inline combobox; the opening balance under the opening date, linked; toasts top right | designs/11-accounts.md |
| 2026-11-03 | Fields and sheets | Per-component field borders, "(facultatif)" labels, "Aucune" for no institution, an institution dialog with a "…" menu, the sheet sliding from the bottom and the right at once | One field style and a 4px field radius; asterisks on required fields; an empty institution field with a clear button; institutions in the same sheet, a pencil to edit; the sheet slides from the right with a closing animation; closed accounts show institution and type | designs/11-accounts.md |
| 2026-11-03 | Form UX review | A full-page account form with "Enregistrer" and "Enregistrer et ajouter"; institutions created only inside the account picker; a rose focus ring | A sheet over Comptes; one "Enregistrer"; an "Ajouter" menu with "Une institution" and empty institution cards; a dark plum focus outline; focus on the first error, "(facultatif)" labels, helper texts, 44px fields on phones | designs/11-accounts.md |
| 2026-11-03 | Account form | "Enregistrer" in the top bar (layout reference, expense form) | Buttons at the bottom of the form; every dropdown shares one trigger with the thin chevron; a pointer cursor on every clickable control | designs/11-accounts.md |
| 2026-11-03 | Devises layout | Two-line rows; tapping a row opens a sheet with "Utiliser par défaut" and "Retirer"; add button under the list; pill buttons | One line per currency, symbol beside the code, a "Par défaut" tag beside the name, every action as an icon on the row, add button beside the title, back link top left, buttons with the card's radius; then the symbol moved beside the actions and styled like the code, a house icon for the default (muted on the default, like the trash), uppercase monospace button text; then the symbol in parentheses after the name, before the tag, as in "Dollar canadien ($)" (the add picker keeps its own layout) | designs/10-settings-currencies.md |
| 2026-11-03 | Local dev database | Try after CI migrates `main`; then a laptop push gated on the backup workflow | No data yet, so the project is the dev database: push from the laptop with no backup, never push untested work to `main` | ADR-022 |
| 2026-11-03 | Import categories | A checkbox to accept the new categories, or refuse the import | Each new category created or merged into another, existing or new (IMP-06) | designs/18-import-export.md |
| 2026-11-03 | First run | A text box to type the category tree, accounts left to the import | The account and category forms with "Enregistrer et ajouter"; an accounts step | designs/17-first-run.md |
| 2026-11-03 | Category colours | Ten, then twenty fixed swatches; sub-categories a tint of the top-level colour | Free colour picker for every category, swatches as quick picks; a sub-category starts from a variation of its parent's; the icon colour adapts for contrast | designs/12-categories.md |
| 2026-11-02 | Visual feel | Piggy-bank palette: rose and cream, soft blush glows, light shadows | Grainy sunset gradients, sparkles, flat surfaces with no shadows, Inconsolata as accent | designs/01-visual-direction.md |
| 2026-11-02 | Demo account | Create the demo account before phase 1, for trying unfinished screens | No demo account; unfinished work is tried in the owner's | ADR-021 |
| 2026-11-02 | Demo | Demo-data generator in phase 1, public demo in phase 2 | Both deferred: the app stays private, a demo matters only if another user joins | DEM-01..02 |
| 2026-11-02 | Docs cleanup | Condense every doc, the journal files and their templates included | Leave the dev-journal skill's files and formats alone; trim the rest | sessions.md |
| 2026-11-02 | Focus styles | A 2px ring on hand-built controls, shadcn's 3px ring on its components | One ring everywhere, shadcn's (`focusRing`) | src/app/src/lib/utils.ts |
| 2026-11-02 | Font and layout | System rounded font; Google Fonts loaded from Google were blocked | Nunito, self-hosted; TravelSpend as the mobile layout reference | designs/00-layout-reference.md |
| 2026-11-02 | Sign-in screen | Logo with name, field icons, title removed, invitation note as subtitle | Logo alone, no field icons, title kept, invitation note dropped; show/hide password; language toggle top right | SET-07 |
| 2026-11-02 | Category icons | Emoji with a Google-style picker and font (ADR-013) | coolicons, the logo's set, for every icon including categories | ADR-020 |
| 2026-11-02 | Languages | Six regional locales | French and English only | ADR-019 |
| 2026-10-27 | Backup location | Options: GitHub artifacts only, plus a monthly offline copy, or object storage (R2/B2) | Monthly offline copy of the dump plus the app's CSV export; object storage only if that becomes a chore | security.md |
| 2026-10-27 | Environments | Separate dev and production projects | One project with a demo account; migrations only from CI after a backup; previews off | ADR-017 |
| 2026-10-27 | Hosting plan | Supabase Pro for backups and no pausing | Free plans until a real limit is hit; our dump is the only backup | ADR-016 |
| 2026-10-27 | Password reset | Flagged it missing: a forgotten password locked the account | Build it now | SEC-05 |
| 2026-10-27 | Invitations | Defer the set-password page to phase 2; create users in the dashboard meanwhile | Build it now: invite-only needs a way to accept an invite | SEC-02 |
| 2026-10-27 | Dev environment | No Docker on macOS 12: either install an older Docker runtime, or use a hosted dev database with tests in CI | Hosted dev project, tests in CI; Node installed by the author | ADR-014 |
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
