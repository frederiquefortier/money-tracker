# Improvements

Ideas not built and not decided against. Review during planning to pick the next step. Ideas the author turned down are listed at the bottom, with the reason.

<!-- Newest first: a new idea goes directly below this line. Template at the bottom. -->

### 2026-11-23 - Compare across a move between countries

**Description:**
- A dated place of residence (country, currency, from when). The dashboard marks the move on the monthly and cumulative charts, and a comparison whose earlier period falls before the move compares shares of income instead of amounts, tagged "avant l'expatriation".

**Motivation:**
- After a move to a country with a higher cost of living, spending jumps in the display currency and the year-over-year changes (DSH-04, DSH-06) read as overspending. The amounts are right; comparing them across the move is what misleads. Income is paid in the new currency too, so the share of income spent, invested and remaining stays comparable.

**Potential Approach:**
- A small `residences` table (country, currency, start date) with RLS and a pgTAP test, or fields on the profile if one move is enough.
- Shares are already computed for DSH-06; only the change switches from percent of amount to points of share.
- Also prepares BUD-07, which compares budgets across places.
- Alternative: a purchasing-power view converting at purchasing power parity (World Bank or OECD yearly factors, as a reference CSV) instead of market rate. Needs the dated residences, and gives a figure no account shows.

**Priority:**
- [ ] High - Critical improvement
- [x] Medium - Nice to have
- [ ] Low - Future consideration

**Dependencies:**
- None for the shares; the purchasing-power view needs the residences.

### 2026-11-17 - Drop the unused institution_totals view

**Description:**
- Since ADR-061 nothing reads `institution_totals`; the net worth page sums each group in the browser.

**Motivation:**
- One less view to keep in step with the balances.

**Potential Approach:**
- A migration dropping the view, its pgTAP test updated, `npm run db:types`, database.md.

**Priority:**
- [ ] High - Critical improvement
- [ ] Medium - Nice to have
- [x] Low - Future consideration

**Dependencies:**
- None.

### 2026-11-16 - Redesign the excluded categories tab

**Description:**
- The Réglages tab of Événements (the default excluded categories, ADR-056) works, but the author is not satisfied with its design and will come back to it.

**Motivation:**
- The author's call; no direction given yet.

**Potential Approach:**
- Start from the author's feedback when they pick it up; compare with the existing screens first.

**Priority:**
- [ ] High - Critical improvement
- [x] Medium - Nice to have
- [ ] Low - Future consideration

**Dependencies:**
- The author's direction.

### 2026-11-13 - Speed: what is left

**Description:**
- Speed left after ADR-053 and ADR-054.

**Motivation:**
- Each Supabase request costs about 200 ms; Netlify functions run in Ohio.

**Potential Approach:**
- Measure from the deployed app, then decide on a Netlify region or plan (ADR-016).
- Fewer requests on pages not preloaded (Import).

**Priority:**
- [ ] High - Critical improvement
- [x] Medium - Nice to have
- [ ] Low - Future consideration

**Dependencies:**
- Timings in the deployed app.

**Status:**
- [x] Proposed
- [ ] In Progress
- [ ] Completed
- [ ] Deferred

### 2026-11-12 - Import: invited people with no part

**Description:**
- The import still gives an invited person a share of the expense (its bulk path writes shares, and its call to `save_transaction` does too). Since ADR-052 an invited person has no amount of their own, so a new import would split an expense with invited people again.

**Motivation:**
- The import is driven only by the columns of `people.csv` (role, person, head_count, amount, reimburses), never by words from the converter. The shares come from the import function in the database, not from the file.

**Potential Approach:**
- A migration replacing the import function so an invited line is written with a part of 0, and a test in `17_import.test.sql`. The function is large and cannot be tried locally (no Docker), so it needs a careful copy.

**Priority:**
- [ ] High - Critical improvement
- [x] Medium - Nice to have
- [ ] Low - Future consideration

**Dependencies:**
- ADR-052 (applied).

**Status:**
- [x] Proposed
- [ ] In Progress
- [x] Completed (2026-11-12, migration `20261112150000_import_invited_without_part.sql`)
- [ ] Deferred

### 2026-11-12 - First run

**Description:**
- Four short steps after a new user's first sign-in with two-factor: language, currencies, accounts, categories. Language and currencies are required; accounts and categories can wait. Every signed-in page redirects there until it is done (`profiles.onboarded_at`).

**Motivation:**
- Only useful for someone who starts from an empty account. The owner's account already exists with real data, so nothing is blocked without it.

**Potential Approach:**
- Follow [the spec](../00_briefing/designs/17-first-run.md) (SET-01). It reuses the currency list, account form and category form. One migration for `onboarded_at` (set for existing users in the same migration, so nobody is locked out) with its pgTAP test, and a redirect guard.

**Priority:**
- [ ] High - Critical improvement
- [ ] Medium - Nice to have
- [x] Low - Future consideration

**Dependencies:**
- Needed before a second real user, with custom SMTP and the sign-in throttle (roadmap).

**Status:**
- [x] Proposed
- [ ] In Progress
- [ ] Completed
- [ ] Deferred

### 2026-11-12 - Privacy mode

**Description:**
- A toggle that replaces every amount with `####` so the screen can be shown or used in public.
- Beyond amounts, the same toggle would also cover: balances and net worth, chart axes and tooltips, memos and names typed by the user, and the browser tab title and page text a screenshot would catch.

**Motivation:**
- The author works in places where others can see the screen.

**Potential Approach:**
- One setting read by `Money`, `Percent` and the chart components, kept in the browser (not the database). Charts hide values and tooltips, not only the numbers in text.
- The toggle sits in the top bar so it is one tap away.

**Priority:**
- [ ] High - Critical improvement
- [x] Medium - Nice to have
- [ ] Low - Future consideration

**Dependencies:**
- None. Easier once every amount goes through `Money`.

**Status:**
- [x] Proposed
- [ ] In Progress
- [ ] Completed
- [ ] Deferred

### 2026-11-12 - Relationship view on the Proches page

**Description:**
- A diagram of the people around the author (a graph or family-tree style view), as an alternative to the list on the Proches page. The author gave two example images of the look wanted.

**Motivation:**
- Show at a glance who is linked to whom and who shares what, beyond the flat list.

**Potential Approach:**
- Needs a relationship between two people in the data (the schema has none today). Draw with SVG or a small graph library; name the library in ADR-011 if one is added.

**Priority:**
- [ ] High - Critical improvement
- [ ] Medium - Nice to have
- [x] Low - Future consideration

**Dependencies:**
- A people-to-people relationship in the schema (database.md, RLS and pgTAP test).

**Status:**
- [x] Proposed
- [ ] In Progress
- [ ] Completed
- [ ] Deferred

### 2026-11-05 - Region packs, local purchases and the goal celebration

**Description:**
- Account-type recommendations by age and country, kept as data per region (LOC-01, 02), with the birth date and home country they need (SET-02, 03).
- A country of origin per merchant (MER-03) and the share of purchases made locally (YR-06).
- A celebration animation when a savings or investment goal is reached (BUD-05).

**Motivation:**
- Taken out of the plan by the author on 2026-11-05: none of them replaces something the spreadsheet does.

**Potential Approach:**
- Region packs as reference rows in `src/data/reference/`, never code branches (LOC-02).

**Priority:**
- [ ] High - Critical improvement
- [ ] Medium - Nice to have
- [x] Low - Future consideration

**Dependencies:**
- Holdings and net worth (phase 5), budgets and goals (phase 4), the yearly review (phase 6).

**Status:**
- [x] Proposed
- [ ] In Progress
- [ ] Completed
- [ ] Deferred

### 2026-11-02 - Keep pinned actions up to date

**Description:**
- Dependabot for GitHub Actions (`.github/dependabot.yml`), which bumps SHA pins and their version comments.

**Motivation:**
- Every action is pinned to a commit SHA so a moved tag cannot run new code with `SUPABASE_DB_URL`. Pins do not update themselves, so security fixes would be missed.

**Potential Approach:**
- Weekly, one grouped PR. The same file can cover npm in `src/app/`.

**Priority:**
- [ ] High - Critical improvement
- [x] Medium - Nice to have
- [ ] Low - Future consideration

**Dependencies:**
- None.

**Status:**
- [x] Proposed
- [ ] In Progress
- [ ] Completed
- [ ] Deferred

### 2026-10-27 - Portfolio cut

**Description:**
- A presentable version for readers who give it two minutes: v1 plus one signature feature, on a public demo (DEM-01) with generated data (DEM-02).
- The signature feature is a slice of the yearly review (YR-02, 03, 04): sticky-month timeline, top 3 days, who I spent the most with.
- A README for skimmers: a hero screenshot, the demo link, the security section, links to process.md and a few ADRs.

**Motivation:**
- A ledger alone does not stand out; the method, the security work, multi-currency and the social view do. A private app with real data and enforced MFA cannot be shown, so the demo is the only way anyone sees it run.

**Potential Approach:**
- After v1, before the rest of v2. Screenshots come from the generator's fixed seed.

**Priority:**
- [x] High - Critical improvement
- [ ] Medium - Nice to have
- [ ] Low - Future consideration

**Dependencies:**
- v1, DEM-01, DEM-02.

**Status:**
- [x] Proposed
- [ ] In Progress
- [ ] Completed
- [ ] Deferred

### 2026-10-27 - Import from other sources (IMP-03)

**Description:**
- Read another source's own format (a bank CSV): map columns, map source categories to mine, save the mapping per source so the second import asks nothing.

**Motivation:**
- The built import takes one fixed format, so anyone else (or a monthly bank export) must convert first.

**Potential Approach:**
- Output rows in the fixed format and hand them to the existing importer: one validation path, one batch and undo model.
- `import_profiles` and `import_category_maps`; built-in profiles have a null `user_id`.

**Priority:**
- [ ] High - Critical improvement
- [x] Medium - Nice to have
- [ ] Low - Future consideration

**Dependencies:**
- The fixed-format import, used for a while.

**Status:**
- [x] Proposed
- [ ] In Progress
- [ ] Completed
- [ ] Deferred

### 2026-10-27 - Projections (net worth and scenario budgets)

**Description:**
- Net-worth projections at fixed or custom growth rates, a goal solver, "if this continues" (NW-06..08).
- Scenario budgets: a monthly budget for a place against a gross salary, as a share of income (BUD-07).

**Motivation:**
- Answers "where is this heading" and "could I afford to live there", which the forecast sheet does by hand.

**Potential Approach:**
- Pure functions over the net-worth series; only saved scenarios are stored (a `scenarios` table with lines per category, prefilled from the dashboard's averages).

**Priority:**
- [ ] High - Critical improvement
- [x] Medium - Nice to have
- [ ] Low - Future consideration

**Dependencies:**
- Net worth (phase 5); enough categorized history.

**Status:**
- [ ] Proposed
- [ ] In Progress
- [ ] Completed
- [x] Deferred

### 2026-10-27 - App-level encryption for free-text notes

**Description:**
- Encrypt `transactions.note` and other free text in the server, with a per-user key.

**Motivation:**
- Notes are where names and context end up. Amounts must stay queryable; notes never need SQL aggregation.

**Potential Approach:**
- libsodium secretbox in the server function, key derived from a server secret plus the user id. Note search would then run in the server after decryption.

**Priority:**
- [ ] High - Critical improvement
- [ ] Medium - Nice to have
- [x] Low - Future consideration

**Dependencies:**
- Decide whether note search matters first.

**Status:**
- [x] Proposed
- [ ] In Progress
- [ ] Completed
- [ ] Deferred

---

## Decided against

- **Tags** (TAG-01, 03; 2026-11-05). Events hold what tags were for (a trip, an occasion) and have dates and a total. A second way to group means loose names and two places to look. Revisit only for labels that cut across time. Still open: a way to hide or collapse an event's hand-linked transactions in the list.
- **Column encryption of amounts**: totals and budgets are SQL aggregations (security.md).
- **Envelope budgeting and category transfers**: the app budgets by target (reference-sheets.md).

---

## Format

### YYYY-MM-DD - Improvement Title

**Description:**
- What it would do and the value it adds

**Motivation:**
- Why it would help

**Potential Approach:**
- Initial thoughts

**Priority:**
- [ ] High - Critical improvement
- [ ] Medium - Nice to have
- [ ] Low - Future consideration

**Dependencies:**
- Prerequisites or blockers

**Status:**
- [ ] Proposed
- [ ] In Progress
- [ ] Completed
- [ ] Deferred
