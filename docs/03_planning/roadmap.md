# Roadmap

Phases group the requirement IDs from [requirements.md](../00_briefing/requirements.md).
Each phase ends with something usable on real data. No dates: this is a personal project.

## Phase 0: Foundation
Nothing financial yet; the walls go up first.

- Scaffold TanStack Start in `src/app`, shadcn/ui, Tailwind, strict TypeScript, Vitest.
- `src/supabase`: local stack, first migration with `profiles`, the RLS and MFA policy
  pattern, and a pgTAP test proving user B sees none of user A's rows.
- Auth: sign-in, TOTP enrolment and challenge, sign-up disabled. SEC-01..03.
- react-i18next with French and English resources, locale on the profile and in a cookie, the
  language switcher, `Intl` formatting helpers. SET-04, 05 (ADR-008).
- Netlify: production site, security headers, preview deploys on a separate Supabase
  project.
- CI: lint, type-check, unit tests, `supabase db lint`, pgTAP.

## Phase 1: The ledger
Replace daily use of the spreadsheet.

- Currencies, HexaRate validation, the Frankfurter rates job with a backfill to 2018,
  converted-amount markers. CUR-01..09 (ADR-009).
- Bilingual seed labels. SET-06.
- Institutions and accounts. ACC-01..07.
- Categories with archive history, favourites, emoji. CAT-01..07.
- Merchants with default category. MER-01.
- Transactions: expense, income, adjustment, transfer with fee, splits, status, notes.
  TRX-01..06, 09, 10.
- **CSV import and export in the fixed format** (IMP-01, 04, 05, ADR-010). This is the
  milestone: eight years of history in the app.
  1. Settle the new category tree (worked out together from the old Aspire names).
  2. Convert the Aspire export to the format, outside the app.
  3. Import, read the summary, undo and re-import until it is right.

## Phase 2: Seeing it
- Dashboard: range picker, filters, per-category stats, tiles, ranking. DSH-01..04, 06..08.
- Budgets and the emergency fund. BUD-01..04, 06, CAT-08.
- Tags with automatic rules. TAG-01..03.
- Recurring transactions. TRX-08.
- Merchant price evolution. MER-04.
- Export and delete my data. SEC-04.

## Phase 3: The social layer
- People and groups, roles on transactions, anonymous treat/reimbursement. PPL-01..05.
- Reimbursement links and their dashboard treatment. TRX-07, DSH-05.
- Events, calendar, comparison, event budgets. EVT-01..06.

## Phase 4: Net worth
- Holdings, snapshots, contributions, employers and salaries. NW-01..05, 09.
- Net-worth files in the import format. IMP-02.

## Phase 5: The year
- Yearly review, money and social views, export. YR-01..07.
- Region packs, merchant countries, local-purchase share. LOC-01, 02, MER-03, SET-02, 03.
- The goal-reached celebration. BUD-05.

## Later (not v1)
Tracked in [improvements.md](improvements.md).

- Import wizard: source profiles, mapping screens, merchant aliases. IMP-03, MER-02.
- Projections: net-worth growth scenarios, the goal solver, "if this continues", and
  scenario budgets by place. NW-06..08, BUD-07.
