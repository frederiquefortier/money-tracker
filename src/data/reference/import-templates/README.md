# Import templates

The import format, with invented rows. Rules and columns: [import.md](../../../../docs/01_building/import.md).
The app offers these files for download.

| File | Required | What the example rows show |
|---|---|---|
| `accounts.csv` | yes | Two accounts in CAD and one in CHF |
| `transactions.csv` | yes | A plain expense, an income, a same-currency transfer, a purchase in CHF paid from a CAD account (linked to an event), a CAD to CHF transfer with its fee row, a reimbursement and an adjustment |
| `splits.csv` | yes | One category per expense and income, two on `t-0002` |
| `people.csv` | no | Alex owes half of `t-0002`, then repays it with `t-0010` |
| `aliases.csv` | no | Another spelling of a merchant and of a person, so the next import finds them |

Transfers, fee rows and adjustments have no rows in `splits.csv`.
