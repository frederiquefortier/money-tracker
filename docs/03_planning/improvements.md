# Improvements

Track future enhancements and feature ideas. Review this file during planning sessions to prioritize next steps.

<!-- Newest first: a new idea goes directly below this line. Template at the bottom. -->

### 2026-10-27 - Import wizard (IMP-03)

**Description:**
- A front end over the v1 CSV format: choose a source (Aspire, a bank, "Other CSV"), map
  columns, map source categories to my categories (with Transfer, Adjustment, Opening
  balance and Ignore as special targets), review proposals, commit.
- Proposals: transfer pairs, merchant spelling groups that become aliases (MER-02),
  reimbursements and people guessed from notes, duplicates.
- Column and category mappings saved per source, so the second import asks nothing.

**Motivation:**
- v1 asks the user to shape their data before importing. Fine for the first user, a wall
  for anyone else, and repetitive for monthly bank exports.

**Potential Approach:**
- The wizard's output is rows in the v1 format, handed to the existing importer. One
  validation path, one batch and undo model.
- `import_profiles` (column map as jsonb, amount mode, date format, decimal separator) and
  `import_category_maps` (source category, target, optional memo pattern). Built-in
  profiles have a null `user_id`.

**Priority:**
- [ ] High - Critical improvement
- [x] Medium - Nice to have
- [ ] Low - Future consideration

**Dependencies:**
- v1 import (IMP-01) shipped and used for a while, so the format is settled.

**Status:**
- [x] Proposed
- [ ] In Progress
- [ ] Completed
- [ ] Deferred

### 2026-10-27 - Projections (net worth and scenario budgets)

**Description:**
- Net-worth projections at fixed growth rates (5, 7, 10 %) or custom inputs (NW-06).
- Goal solver: "to reach X in N years at r %, invest Y per year", with r defaulting to the
  actual return so far (NW-07).
- "If this continues, in N years I'll have X" (NW-08).
- Scenario budgets: a monthly budget for a place (rent, transport, deductions) against a
  gross salary, as a share of income, like the Prévision budgétaire sheet (BUD-07). Possibly
  what the note "Projections comme suisse" meant.

**Motivation:**
- Answers "where is this heading" and "could I afford to live there", which the net-worth
  tracker and the forecast sheet answer by hand today.
- Scenarios can start from real averages instead of guesses; the forecast sheet itself notes
  that real food spending ran at twice the estimate.

**Potential Approach:**
- Pure functions over the net-worth series (compound growth with yearly contributions),
  computed in the server or the browser; nothing stored except saved scenarios.
- Scenario budgets as a `scenarios` table with lines per category, prefilled from the
  dashboard's monthly averages and converted to the scenario's currency.

**Priority:**
- [ ] High - Critical improvement
- [x] Medium - Nice to have
- [ ] Low - Future consideration

**Dependencies:**
- Net worth (roadmap phase 4) for NW-06..08; enough categorized history for BUD-07.

**Status:**
- [ ] Proposed
- [ ] In Progress
- [ ] Completed
- [x] Deferred

### 2026-10-27 - App-level encryption for free-text notes

**Description:**
- Encrypt `transactions.note` and other free text in the server before it reaches the
  database, with a per-user key.

**Motivation:**
- Notes are where names and context end up ("remboursement de ..."). Amounts must stay
  queryable; notes never need to be aggregated in SQL.

**Potential Approach:**
- libsodium secretbox in the server function, key derived from a server secret plus the user
  id. Search over notes would then happen in the server after decryption.

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

## Format

### YYYY-MM-DD - Improvement Title

**Description:**
- What the improvement would do
- Problem it would solve or value it would add

**Motivation:**
- Why this would be beneficial
- Use cases or scenarios

**Potential Approach:**
- Initial thoughts on implementation
- Technologies or patterns to consider

**Priority:**
- [ ] High - Critical improvement
- [ ] Medium - Nice to have
- [ ] Low - Future consideration

**Dependencies:**
- Prerequisites or related work needed
- Blockers or considerations

**Status:**
- [ ] Proposed
- [ ] In Progress
- [ ] Completed
- [ ] Deferred
