# Improvements

Ideas not built and not decided against. Review during planning to pick the next step. Ideas the author turned down are listed at the bottom, with the reason.

<!-- Newest first: a new idea goes directly below this line. Template at the bottom. -->

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
