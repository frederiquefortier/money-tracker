# Roadmap

Phases group the requirement IDs from [requirements.md](../00_briefing/requirements.md).
Each phase ends with something usable on real data. No dates: this is a personal project.

| Release | Phases | Done when |
|---|---|---|
| **v1** | 0, 1, 2 | The spreadsheet can be retired |
| v2 | 3, 4 | Social layer and net worth |
| v3 | 5 | The yearly review |

# v1

## Phase 0: Foundation
Nothing financial yet; the walls go up first.

**Status (2026-10-27):** code done and checked locally; waiting on accounts.
Done: scaffold, Supabase config and first migration with tests, auth with TOTP, invitation
and set-password pages with bilingual email templates, FR/EN,
CSP and headers, CI and backup workflows. Open: the project (CLI `link`, `config push`,
first CI run applying migrations, first sign-in; JWT signing key confirmed ECC), the first CI run (pgTAP has not run yet), the Netlify
site, production and its backup secrets, the owner's two authenticators.

- Scaffold TanStack Start in `src/app`, shadcn/ui, Tailwind, strict TypeScript, Vitest.
- `src/supabase`: first migration with `profiles`, the RLS and MFA policy pattern, a
  pgTAP test proving user B sees none of user A's rows, and guard tests that every table has
  RLS, the MFA policy and no anon grants. Runs in CI (ADR-014).
- One Supabase project, `money-tracker` in Canada, free plan, with the owner's account and a
  demo account (ADR-016, ADR-017). Migrations applied by CI after a backup.
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

- Currencies, HexaRate validation, the Frankfurter rates job with a backfill to 2018,
  converted-amount markers. CUR-01..09 (ADR-009).
- Bilingual reference labels. SET-06.
- Screen specs in `docs/00_briefing/designs/` before each screen is built: what it shows,
  why, and which requirement IDs it covers.
- Demo-data generator (DEM-02), used by local and preview from here on.
- Institutions and accounts. ACC-01..07.
- Categories with archive history, favourites, emoji. CAT-01..07.
- Merchants with default category. MER-01.
- Transactions: expense, income, adjustment, transfer with fee (including between
  currencies), splits, status, notes. TRX-01..06, 09..11. Multi-row writes as SQL functions
  with pgTAP tests (ADR-012).
- Emoji picker in native mode with the self-hosted Noto Color Emoji font. CAT-07 (ADR-013).
- **Gate before the spreadsheet is retired:** backup workflow enabled, one restore tested,
  the first monthly copy on the offline drive, and the private key in the password manager
  and on paper (security.md, Backups).
- **CSV import and export in the fixed format** (IMP-01, 04, 05, SEC-04 export, ADR-010). This is the
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
- Delete my account and all its data. SEC-04.
- Public demo deployment on demo data (DEM-01).

# v2

## Phase 3: The social layer
- People and groups, roles on transactions, anonymous treat/reimbursement. PPL-01..05.
- Reimbursement links and their dashboard treatment. TRX-07, DSH-05.
- Events, calendar, comparison, event budgets. EVT-01..06.

## Phase 4: Net worth
- Holdings, snapshots, contributions, employers and salaries. NW-01..05, 09.
- Net-worth files in the import format. IMP-02.

# v3

## Phase 5: The year
- Yearly review, money and social views, export. YR-01..07.
- Region packs, merchant countries, local-purchase share. LOC-01, 02, MER-03, SET-02, 03.
- The goal-reached celebration. BUD-05.

## Later (not v1)
Tracked in [improvements.md](improvements.md).

- Import wizard: source profiles, mapping screens, merchant aliases. IMP-03, MER-02.
- Projections: net-worth growth scenarios, the goal solver, "if this continues", and
  scenario budgets by place. NW-06..08, BUD-07.
