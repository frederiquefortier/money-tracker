# Import

How a user's existing history gets into the app (IMP-01..05, ADR-010).

**v1 has one fixed CSV format.** The user prepares their data in that format before
importing: categories already organised, accounts named, transfers grouped. The app
validates, shows a summary, and commits. There is no source picker and no mapping step;
those belong to the import wizard, logged in
[improvements.md](../03_planning/improvements.md).

Converting a specific source (the Aspire spreadsheet) into this format happens outside the
app: in the spreadsheet itself, or with a one-off local script if that is faster. It is
never app code.

## The flow

```
1. Upload   accounts.csv, transactions.csv, optionally splits.csv (read in the browser)
2. Check    every row validated; errors listed by file and line, nothing written
3. Summary  counts, date range, and what will be created: new accounts, categories, merchants
4. Commit   one import batch, written in one database transaction; undoable in one action
```

Files are read in the browser with `File.text()` and never uploaded or stored. The server
receives the parsed rows, validates them again with Zod, and writes them.

Import is all or nothing: one invalid row blocks the batch, so a file is never half
imported.

## Format rules

- UTF-8, comma separator, a header row, columns in any order, unknown columns rejected.
- Dates `YYYY-MM-DD`, times `HH:MM` (24 h), decimals with `.`, no thousands separator.
- Amounts are signed from the account's point of view: money out is negative.
- Currencies are ISO 4217 codes and must be in the user's currency list.
- Category paths use ` > ` between levels: `Alimentation > Épicerie`. A path that does not
  exist yet is created, parents included, and listed in the summary.
- Empty cell means "no value".

Templates with invented example rows are in `src/data/reference/import-templates/`, and the
app offers them for download.

## accounts.csv

| Column | Required | Meaning |
|---|---|---|
| `name` | yes | Unique per user. Transactions refer to the account by this name. |
| `type` | yes | A code from `account-types.csv` (`checking`, `savings`, `credit_card`...) |
| `currency` | yes | |
| `institution` | no | Created if new |
| `institution_url` | no | |
| `opening_balance` | yes | |
| `opened_on` | yes | |
| `closed_on` | no | |

An account that already exists (same name) is matched, not duplicated; its fields are not
overwritten.

## transactions.csv

| Column | Required | Meaning |
|---|---|---|
| `ref` | yes | The row's stable ID, unique within the user's data. Re-importing a `ref` that exists is skipped, which makes re-imports safe. Any string: the Aspire UUID, a bank's reference, a row number. |
| `date` | yes | |
| `time` | no | |
| `account` | yes | An account name, from accounts.csv or already in the app |
| `kind` | yes | `expense`, `income`, `transfer`, `adjustment` |
| `amount` | yes | What the account moved, in `currency` |
| `currency` | yes | |
| `original_amount` | no | The receipt price, when paid in another currency |
| `original_currency` | with `original_amount` | |
| `category` | yes, except transfers | A category path. For a split, leave empty and use splits.csv. |
| `merchant` | no | Created if new, matched by exact name otherwise |
| `status` | no | `cleared` (default) or `pending` |
| `transfer_group` | for transfers | Same value on both legs, and on the fee row if there is one (a `kind = expense` row on the source account). Exactly two `transfer` rows per group, on two accounts. |
| `note` | no | |

## splits.csv (optional)

For transactions spread over several categories.

| Column | Required | Meaning |
|---|---|---|
| `ref` | yes | The transaction's `ref`; its `category` must be empty |
| `category` | yes | A category path |
| `amount` | yes | Same sign as the transaction. The splits of one `ref` must add up to its amount exactly. |

## Later columns

Features from later phases add optional columns (tags, people, events, reimbursement links)
and optional files (net-worth holdings and snapshots, IMP-02). A file in the v1 format stays
valid.

## Export

The app exports a user's data in this same format (IMP-04, SEC-04). Export then import
reproduces the data, which is also how the format is tested.

## Data model

| Table | Columns |
|---|---|
| `import_batches` | `file_names`, `row_count`, `created_counts` (jsonb: accounts, categories, merchants), `committed_at`, `undone_at` |

`transactions.import_batch_id` and `transactions.import_ref` (unique per user) complete it.
Accounts, categories and merchants created by a batch also carry its id, so undo removes
them when nothing else uses them.

## Preparing the first import together

The category tree and the mapping from the old Aspire categories are plain names and can be
worked out in a conversation. The transactions stay on the machine.
