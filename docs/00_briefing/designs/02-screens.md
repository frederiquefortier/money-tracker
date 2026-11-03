# Screens, phase 1

One spec per screen, written and reviewed before the screen is built (roadmap, phase 1).
The layout follows [00-layout-reference.md](00-layout-reference.md), the look
[01-visual-direction.md](01-visual-direction.md).

## Map

In build order. Each screen depends only on the ones above it. First run comes before
import: the owner sets up accounts and categories fresh, then imports the cleaned history
onto them.

| # | Spec | Screens | Requirements | Status |
|---|---|---|---|---|
| 10 | [Settings and currencies](10-settings-currencies.md) | Réglages hub, Devises, display currency switcher in the header | CUR-01..07, SET-06 | Built |
| 11 | [Accounts](11-accounts.md) | Accounts by institution, account form, institution form | ACC-01..07 | Built |
| 12 | [Categories](12-categories.md) | Category tree, category form, icon picker, category picker | CAT-01..07 | Reviewed |
| 13 | [Merchants](13-merchants.md) | Merchant list and form, merchant picker | MER-01, 05, TRX-05 | Reviewed |
| 14 | [Transactions](14-transactions.md) | The list (home tab), day groups, converted-amount marker | TRX-04, 09, CUR-06, 07, 09 | Reviewed |
| 15 | [Transaction form](15-transaction-form.md) | Expense and income, splits, foreign currency, the add button | TRX-01, 02, 05, 06, 09, 10, CUR-08, CAT-04, 06, MER-01 | Reviewed |
| 16 | [Transfer and adjustment](16-transfer-adjustment.md) | Transfer form (fee, two currencies), balance adjustment | TRX-03, 04, 11 | Reviewed |
| 17 | [First run](17-first-run.md) | Language, currencies, first accounts and categories | SET-01 | Reviewed |
| 18 | [Import and export](18-import-export.md) | File check, summary, commit, undo, export | IMP-01, 04, 05, 06, SEC-04 | Reviewed |

## Format of a spec

1. **Purpose**: what the screen is for, in two or three sentences.
2. **Requirements**: the IDs it covers.
3. **Layout**: a phone-width sketch, then what changes from `md` up.
4. **Content and behaviour**: each element, what it shows, what a tap does.
5. **States**: empty, loading, error, and any edge case.
6. **Data**: tables read and written, server functions.
7. **Copy**: the French strings (the source language); English is written at build time.
8. **Open questions**: for the author, removed once answered.
