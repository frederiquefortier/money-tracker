# Reference spreadsheets

Two spreadsheets are the current system. Copies live in `src/data/local/sources/`
(gitignored). This file describes their **shape** only; no figures, names or memos from
them belong in Git.

## 1. Aspire Budgeting (2018 to now)

An envelope-budgeting Google Sheet ([Aspire Budgeting](https://aspirebudget.com)), used
continuously since 2018. It is the history the app has to import (IMP-01) and the baseline
the app has to beat.

### Sheets that hold data

| Sheet | Shape | Maps to |
|---|---|---|
| Configuration | Category groups (✦) and categories (✧), each with a monthly amount, an optional goal amount and an on/off flag. A list of bank accounts, a list of credit cards, a list of income categories. Monthly income and a 6-month emergency fund figure. | `categories` (two levels), `accounts`, `budgets`, `budget_settings` |
| Transactions | `DATE, OUTFLOW, INFLOW, OUTFLOW IN, INFLOW IN, CATEGORY, ACCOUNT, MEMO, STATUS, VENDOR, UUID`. The `... IN` columns hold the original amount and currency code (`chf`) when the account currency differs. `STATUS` is cleared or pending. | `transactions`, `transaction_splits`, `merchants` |
| Net Worth Reports | `DATE, AMOUNT, NET WORTH CATEGORY, NOTES`: dated snapshots per holding (CELI, REER, REER-RPDB, CELIAPP, life insurance, 2nd pillar in CHF). | `holdings`, `holding_snapshots` |
| Category Transfers | Envelope moves between categories. | Not imported: the app budgets by target, not by envelope. |

### Conventions worth knowing before the import

- **Special categories** stand in for transaction kinds: `↕️ Account Transfer`,
  `🔢 Balance Adjustment`, `➡️ Starting Balance`. They become `kind = transfer`,
  `adjustment` and the account's opening balance, not categories.
- **Transfers are two rows** with the same date and amount on two accounts, both
  categorised `↕️ Account Transfer`. The importer pairs them; an unpaired row is reported,
  not guessed.
- **Reimbursements are inflows on the expense category**, with the payer named in the memo
  ("... - remboursement <prénom>"). The importer can propose reimbursement links (TRX-07)
  and people (PPL-01) from those memos, for review.
- **Category names encode a hierarchy** with a prefix: `V - Transport`, `V - Logements`,
  `V - Activités` are travel sub-categories, `S - Assurance` is a Swiss one. The importer
  should offer to turn prefixes into parents.
- **Income categories** include employer names and one-off sources (government refunds,
  interest, sales, rewards). Employer names become `employers` (NW-09).
- **Amounts in a foreign currency** carry up to six decimals after conversion. The import
  keeps the original amount and currency and recomputes the converted value, rather than
  trusting the stored float.
- Around 70 categories in 13 groups and 10 accounts, as of October 2026.

### What the dashboard does that the notes did not mention

Header tiles (total available, spent this month, invested this month, pending
transactions), per-account "last reconciled" and "last transaction" ages, a category table
with this month, last 6 months, target, goal, last 12 months and monthly average, and a
yearly ranking of categories by real outflow (outflow minus inflow). Captured as DSH-06,
DSH-07 and ACC-08.

## 2. Prévision budgétaire (forecast by city)

One sheet per city considered. Each lists monthly costs grouped as
housing, transport, food, activities, travel, savings, then payroll deductions (insurance,
tax, AVS, LPP), against a gross salary. Columns give monthly, yearly, the CAD equivalent
and the share of gross income. A note records that real food spending over two months ran
at about twice the forecast.

This is a scenario planner: "what would my month look like if I lived there on that
salary". It is captured as BUD-07. The note about real vs. forecast food spending is the
interesting part: the app can fill a scenario from actual averages instead of guesses.
