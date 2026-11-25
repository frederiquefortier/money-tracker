# Reference spreadsheets

The spreadsheets the app replaces. Copies live in `src/data/local/sources/` (gitignored).
This file describes their **shape** only; no figures, names or memos from them belong in
Git. Requirements they add carry the `sheet` source.

## 1. Aspire Budgeting (2018 to now)

An envelope-budgeting Google Sheet ([Aspire Budgeting](https://aspirebudget.com)). Its
history came in through the import (IMP-01); the conversion to the import format was done
outside the app.

| Sheet | Shape | Maps to |
|---|---|---|
| Configuration | Category groups and categories with a monthly amount, a goal and an on/off flag; accounts, credit cards, income categories; monthly income and an emergency fund figure. | `categories`, `accounts`, budgets (BUD-01..04) |
| Transactions | Date, outflow, inflow, the original amount and currency when they differ, category, account, memo, status, vendor, a UUID. | `transactions`, `transaction_splits`, `merchants` |
| Net Worth Reports | Dated snapshots per holding. | `holdings`, `holding_snapshots` |
| Category Transfers | Envelope moves between categories. | Not imported: the app budgets by target. |

Its dashboard (header tiles, per-account reconciliation ages, the category table, a yearly
ranking) became DSH-06, DSH-07 and ACC-08.

## 2. Prévision budgétaire (forecast by city)

One sheet per city considered: monthly costs by group (housing, transport, food, activities,
travel, savings, payroll deductions) against a gross salary, monthly, yearly, in CAD and as a
share of income. A scenario planner, captured as BUD-07; the app could fill a scenario from
real averages instead of guesses.
