# Import templates

The import format, with invented rows. Rules and columns: [import.md](../../../../docs/01_building/import.md).
The app offers these files for download.

| File | Required | What the example rows show |
|---|---|---|
| `accounts.csv` | yes | Two accounts in CAD and one in CHF |
| `transactions.csv` | yes, unless the files are holdings only | A plain expense, an income, a same-currency transfer, a purchase in CHF paid from a CAD account (linked to an event), a CAD to CHF transfer with its fee row, a reimbursement and an adjustment |
| `splits.csv` | yes | One category per expense and income, two on `t-0002` |
| `people.csv` | no | Alex owes half of `t-0002`, then repays it with `t-0010` |
| `aliases.csv` | no | Another spelling of a merchant and of a person, so the next import finds them |
| `holdings.csv` | no | A TFSA that closes, the one that receives it, an employer plan and a Swiss second pillar in CHF |
| `snapshots.csv` | no | Dated values for those holdings, including the 0.00 that closes the first TFSA |
| `contributions.csv` | no | An employer share and a payroll deduction, told apart by their label |
| `holding_transfers.csv` | no | The first TFSA moving to the second on the day it closes |

Transfers, fee rows and adjustments have no rows in `splits.csv`.
