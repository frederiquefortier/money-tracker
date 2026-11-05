# Roadmap

Phases group the requirement IDs from [requirements.md](../00_briefing/requirements.md).
Each phase ends with something usable on real data. No dates: this is a personal project.

| Release | Phases | Done when |
|---|---|---|
| **v1** | 0, 1, 2, 3, 4 | The spreadsheet can be retired |
| v2 | 5 | Net worth (patrimoine) |
| v3 | 6 | The yearly review |

# v1

## Phase 0: Foundation
Nothing financial yet; the walls go up first.

**Status (2026-11-02):** deployed; sign-in, MFA, invitations, reset and FR/EN work.
Backups run nightly, one restore tested, two authenticators enrolled; the contract
migration for `profiles.locale` is written (ADR-019).

- Scaffold TanStack Start in `src/app`, shadcn/ui, Tailwind, strict TypeScript, Vitest.
- `src/supabase`: first migration with `profiles`, the RLS and MFA policy pattern, a
  pgTAP test proving user B sees none of user A's rows, and guard tests that every table has
  RLS, the MFA policy and no anon grants. Runs in CI (ADR-014).
- One Supabase project, `money-tracker` in Canada, free plan, with the owner's account only
  (ADR-016, ADR-017, ADR-021). Migrations applied by CI after a backup.
- Auth: sign-in, TOTP enrolment and challenge, sign-up disabled. SEC-01..03.
- react-i18next with French and English resources, locale on the profile and in a cookie, the
  language switcher, `Intl` formatting helpers. SET-04, 05 (ADR-008).
- Netlify: production site, security headers, deploy previews off (ADR-017).
- CI: lint, type-check, unit tests, `supabase db lint`, pgTAP, and a docs check: relative
  links resolve (lychee, offline mode) and every requirement ID cited in roadmap, ADRs and
  process.md exists in requirements.md (a short script).
- Nightly encrypted backup as a scheduled GitHub Action; one restore tested.
- Two authenticators enrolled for the owner account (no TOTP recovery codes).

## Phase 1: The ledger
Replace daily use of the spreadsheet.

**Status (2026-11-05):** currencies, the rates job and the Réglages and Devises screens
(spec 10), institutions and accounts (spec 11), and categories (spec 12) are built and
tried in local dev. Merchants (spec 13) are built with the category picker of spec 15.
The transactions migration is pushed to dev: transactions, splits, transfers with fee,
adjustments and real balances, with 39 pgTAP tests; a merge now moves transactions. The
transaction form (spec 15) is built: amount, foreign currency with its fee, splits,
merchant and category pickers with "Fréquentes". Currency favourites are dropped (CUR-03)
and every screen adds through one round + bottom right. Expense categories take a need
or want mark (CAT-10). The list (spec 14) is built: a chosen period (TRX-13: everything as
you scroll, a year, a month, custom days), search (TRX-12) and filters by account,
category and merchant (TRX-14), day groups with their net in SQL, splits as stacked
icons. Transfers (spec 16) are built: the Transfert tab of the form, the received amount
and conversion cost between currencies, the fee and its category, a pending box per
side, and editing or deleting every part together. Balance adjustments (TRX-03) are
built: tapping an account's balance on Comptes opens them, and the list opens a saved
one. Phase 1 is complete once the author has tried them. The import moved after people,
tags and events (2026-11-05).

- Currencies, HexaRate validation, the Frankfurter rates job with a backfill to 2018,
  converted-amount markers. CUR-01..09 (ADR-009).
- Bilingual reference labels. SET-06.
- Screen specs in `docs/00_briefing/designs/` before each screen is built (map and order in
  [02-screens.md](../00_briefing/designs/02-screens.md)): what it shows,
  why, and which requirement IDs it covers. Mobile layout follows
  [00-layout-reference.md](../00_briefing/designs/00-layout-reference.md) (TravelSpend patterns); the look
  follows [01-visual-direction.md](../00_briefing/designs/01-visual-direction.md).
- Institutions and accounts. ACC-01..07.
- Categories with archive history, coolicons icons, sort, search and expand all. CAT-01..05, 07, 09; CAT-06 (Fréquentes) comes with the transaction form.
- Need or want on expense categories, inherited down the branch (built 2026-11-05).
  CAT-10. Before the import, so the new tree is marked as it is settled.
- Merchants with default category, and merging. MER-01, 05.
- Transactions: expense, income, adjustment, transfer with fee (including between
  currencies), splits, status, notes. TRX-01..06, 09..11. Multi-row writes as SQL functions
  with pgTAP tests (ADR-012).
- The transactions list over a chosen period, loaded as you scroll, with search and
  filters by account, category and merchant. TRX-12 (moved from phase 2), 13, 14.
- Category icon picker over a curated, vendored subset of coolicons. CAT-07 (ADR-020).
- **Gate before the spreadsheet is retired** (met 2026-11-02): backup workflow enabled, one
  restore tested, the first monthly copy on the offline drive, and the private key in the
  password manager and on paper (security.md, Backups).

## Phase 2: What a transaction carries
Everything the owner's current use can set on a transaction exists before the import, so
the eight years of history are prepared in one pass, not one per feature (decided
2026-11-05). In this order (author, 2026-11-05): proches, tags, events.

- People and groups, roles on transactions, anonymous treat/reimbursement. PPL-01..05.
- Reimbursement links. TRX-07.
- Tags with automatic rules. TAG-01..03.
- Events, calendar, comparison, event budgets. EVT-01..06.
- Holdings, and transactions linked to the holding they pay into (the `holding` column
  of the import). NW-01, and the my-money part of NW-03.

## Phase 3: The import
**CSV import and export in the fixed format** (IMP-01, 04, 05, 06, SEC-04 export, ADR-010).
This is the milestone: eight years of history in the app. It comes before the dashboard
so the dashboard and budgets are built and tried on real history.

1. Settle the new category tree (worked out together from the old Aspire names).
2. Convert the Aspire export to the format, outside the app, tags, people, events,
   reimbursement links and holdings included.
3. Import, read the summary, undo and re-import until it is right.

## Phase 4: Seeing it
- Dashboard: range picker, filters, per-category stats, tiles, ranking, needs, wants and
  savings, expenses waiting for a reimbursement. DSH-01..09.
- Budgets and the emergency fund. BUD-01..04, 06, CAT-08.
- Recurring transactions. TRX-08.
- Merchant price evolution. MER-04.
- Last reconciled and last transaction per account. ACC-08.
- Delete my account and all its data. SEC-04.

# v2

## Phase 5: Patrimoine (net worth)
- Snapshots, contributions with employer money and profit, employers and salaries.
  NW-02..05, 09 (holdings come in phase 2).
- Net-worth files in the import format. IMP-02.

# v3

## Phase 6: The year
- Yearly review, money and social views, export. YR-01..05, 07. It may merge with the
  dashboard; to be decided when phase 4 is built (author, 2026-11-05).

## Before a second real user
Not tied to a phase: the app works for its owner without these, and nobody else can use it
safely until both exist.

- **Custom SMTP.** Supabase's built-in sender only emails members of the Supabase
  organization, a few times an hour. A transactional provider with a free tier (Resend,
  Brevo or Amazon SES) and a domain we own (the one real cost, about 10 to 15 dollars a
  year), configured in `[auth.email.smtp]` with the password as an environment variable.
- **Sign-in throttle.** Supabase rate-limits by IP, but every auth call comes from our
  server, so it sees Netlify's IP (security.md, Auth). A per-IP and per-email throttle in
  Postgres.

## Later (not v1)
Tracked in [improvements.md](improvements.md).

- Import wizard: source profiles, mapping screens, merchant aliases. IMP-03, MER-02.
- Projections: net-worth growth scenarios, the goal solver, "if this continues", and
  scenario budgets by place. NW-06..08, BUD-07.
- Demo-data generator and public demo, only if another user joins. DEM-01, 02.
- Region packs, birth date and country, merchant countries, local-purchase share, and the
  goal-reached celebration. LOC-01, 02, SET-02, 03, MER-03, YR-06, BUD-05 (moved out of
  the plan, 2026-11-05).
