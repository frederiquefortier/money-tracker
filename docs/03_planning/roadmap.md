# Roadmap

Phases group the requirement IDs from [requirements.md](../00_briefing/requirements.md). Each phase ends with something usable on real data. No dates: this is a personal project. `[x]` is built, `[ ]` is not.

| Release | Phases | Done when |
|---|---|---|
| **v1** | 0, 1, 2, 3, 4 | The spreadsheet can be retired |
| v2 | 5 | Net worth (patrimoine) |
| v3 | 6 | The yearly review |

# v1

## Phase 0: Foundation
Deployed; sign-in, MFA, invitations, reset and FR/EN work. Backups run nightly and a restore was tested.

- [x] TanStack Start app, shadcn/ui, Tailwind, strict TypeScript, Vitest.
- [x] Supabase project with RLS and MFA policy pattern, pgTAP isolation tests, guard tests that every table has RLS and no anon grants (ADR-014).
- [x] Auth: sign-in, TOTP enrolment and challenge, sign-up disabled. SEC-01..03.
- [x] react-i18next, locale on the profile and in a cookie, `Intl` helpers. SET-04, 05 (ADR-008).
- [x] Netlify production site, security headers, deploy previews off (ADR-017).
- [x] CI: lint, type-check, tests, `supabase db lint`, pgTAP, a docs check (links resolve, cited requirement IDs exist).
- [x] Nightly encrypted backup, one restore tested, two authenticators enrolled.

## Phase 1: The ledger
- [x] Currencies, HexaRate validation, rates job with backfill to 2018, converted-amount markers. CUR-01..09 (ADR-009).
- [x] Institutions and accounts. ACC-01..07.
- [x] Categories with archive history, icons, sort, search. CAT-01..07, 09, 10.
- [x] Merchants with default category and merging. MER-01, 05.
- [x] Transactions: expense, income, adjustment, transfer with fee across currencies, splits, status, notes. TRX-01..06, 09..11.
- [x] The list over a chosen period with search and filters. TRX-12..14.
- [x] Gate before retiring the spreadsheet: backup workflow, tested restore, offline copy, private key in the password manager and on paper (met 2026-11-02, security.md).
- [ ] First run (SET-01, [spec](../00_briefing/designs/17-first-run.md)).

## Phase 2: What a transaction carries
Everything the owner can set on a transaction exists before the import, so eight years of history are prepared in one pass (author, 2026-11-05).

- [x] People and groups, roles, aliases, merging. PPL-01..09.
- [x] Reimbursement links. TRX-07, PPL-05.
- [x] Events with types and automatic linking by date. EVT-01..03, 07.
- [ ] Holdings, and transactions linked to the holding they pay into. NW-01, and the my-money part of NW-03.

## Phase 3: The import
The milestone: eight years of history in the app. It comes before the dashboard so the dashboard and budgets are built and tried on real history.

- [x] Fixed-format CSV import with check, summary, merges, commit and undo. IMP-01, 05, 06 (ADR-010, ADR-033 to ADR-037).
- [ ] Export in the same format. IMP-04, SEC-04 ([spec](../00_briefing/designs/18-export.md)).
- [x] The first real import, done by the author.

## Phase 4: Seeing it
- [ ] Dashboard: range, filters, per-category stats, tiles, ranking, needs/wants/savings, expenses waiting for reimbursement. DSH-01..09.
- [ ] Budgets and the emergency fund, event budgets included. BUD-01..04, 06, CAT-08, EVT-06.
- [ ] Recurring transactions. TRX-08.
- [ ] Event calendar and comparison. EVT-04, 05.
- [ ] Merchant price evolution. MER-04.
- [ ] Last reconciled and last transaction per account. ACC-08.
- [ ] Delete my account and all its data. SEC-04.

# v2

## Phase 5: Patrimoine (net worth)
- [ ] Snapshots, contributions, employers and salaries. NW-02..05, 09.
- [ ] Net-worth files in the import format. IMP-02.

# v3

## Phase 6: The year
- [ ] Yearly review, money and social views, export. YR-01..05, 07. May merge with the dashboard; decide when phase 4 is built.

## Before a second real user
The app works for its owner without these; nobody else can use it safely until both exist.

- **Custom SMTP.** Supabase's built-in sender only emails organization members, a few times an hour. A transactional provider with a free tier (Resend, Brevo, Amazon SES) and a domain we own (about 10 to 15 dollars a year), set in `[auth.email.smtp]`.
- **Sign-in throttle.** Supabase rate-limits by IP, but every auth call comes from our server, so it sees Netlify's IP (security.md, Auth). A per-IP and per-email throttle in Postgres.

## Later
Ideas not scheduled are in [improvements.md](improvements.md).
