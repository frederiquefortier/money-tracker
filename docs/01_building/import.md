# Import

How a user's existing history gets into the app (IMP-01..06, ADR-010, ADR-033).

**One fixed CSV format.** The user prepares their data in it before importing. The app
validates, shows a summary, and commits. There is no source picker and no mapping step;
those belong to the import wizard (IMP-03).

Converting a source (the Aspire spreadsheet) into this format happens outside the app, in
the spreadsheet or with a one-off local script. It is never app code.

## The flow

```
1. Upload   the CSV files, read in the browser
2. Check    every row validated; errors listed by file and line, nothing written
3. Summary  counts, date range, and everything that would be created; each new
            thing is created as written or merged into an existing one (IMP-06)
4. Commit   one request, one `import_batch(jsonb)` call, one database transaction
```

Files are read with `File.text()` and never uploaded or stored. The server receives all
parsed rows in one request (about 10,000 rows is 1 to 2 MB), validates them again with
Zod, and passes them to the `import_batch` SQL function, which commits or rolls back as a
whole (ADR-012, ADR-036). One invalid row blocks the batch.

`import_batch(payload, dry_run)` does steps 2 to 4 in the database. The payload is
`{files, accounts, transactions, splits, people, aliases, holdings, snapshots, contributions, holding_transfers}`, each an array of the rows of the CSV of
that name, every value a string (amounts too, ADR-004) with an optional `line` for the
messages. Step 3 is `dry_run = true`: it returns `{ok, will_create, counts}` and writes
nothing, or `{ok: false, errors}` where each error has its file, line and a code the
screen translates. The merge choices are applied by the server, by renaming in the rows
before the call. `import_undo(batch)` undoes a batch.

The call has the API's 8 seconds, and a function cannot ask for more (a `SET
statement_timeout` on it does not help). About 5,000 transactions import in about 5 s. A
larger file that times out is split by year and imported part by part: a `ref` already in
is skipped, so each part is safe to repeat.

## Matching and creating

Everything a row names is looked up first, ignoring case and accents (`fold_name`), and
created when missing. Nothing is ever overwritten: a match keeps the app's version.

| Named by a row | Looked up in | If missing |
|---|---|---|
| `currency`, `original_currency` | the user's currencies | added to the list, if it is an ISO 4217 code the app knows. Anything else blocks the file. |
| `account` | accounts | created from accounts.csv. A transaction naming an account that is neither in the file nor in the app blocks the file. |
| `institution` | institutions | created |
| `category` (a path, ` > ` between levels) | categories | created, parents included |
| `merchant` | merchants, then their aliases | created |
| `person` | people, then their aliases | created |
| `event` | events | created by name with no dates; the rows that name it are linked by hand |
| `holding` (holdings.csv) | holdings, by type, institution and name | created from holdings.csv. The institution is created when missing. |

A category that is archived still matches, for the transactions dated up to and including
the day it was archived (ADR-035). One dated after that is an error in the check, listed by
line.

The summary lists each missing item by kind. Each one is created as written unless the user
decides otherwise, for that import only: a new category, merchant, person or event can be
merged into another name; a new merchant, person or event can also be edited, with another
name or none and some of its text sent to the note of its transactions (`Train de Paris`
becomes the merchant `Train` with `de Paris` in the note, or `?` is dropped). A merge of a merchant, person or event can also send some text to the note of its transactions. A merge of a
merchant or a person is kept as an alias of what it was merged into (ADR-037), so the next
import finds it.

## Format rules

- UTF-8, comma separator, a header row, columns in any order, unknown columns rejected.
- Dates `YYYY-MM-DD`; there is no time of day. Decimals use `.`, no thousands separator.
- Amounts are signed from the account's point of view: money out is negative. An amount
  finer than the currency's minor unit is refused.
- An empty cell means "no value".
- A `ref` is the row's stable ID within the user's data (the Aspire UUID, a bank
  reference, a row number). Re-importing a `ref` that exists skips it.

## accounts.csv

| Column | Required | Meaning |
|---|---|---|
| `name` | yes | Transactions refer to the account by this name |
| `type` | yes | A code from `account-types.csv` |
| `currency` | yes | |
| `institution` | no | |
| `institution_url` | no | `https://` only |
| `opening_balance` | yes | |
| `opened_on` | yes | |
| `closed_on` | no | |

An account with the same name and institution is matched, not duplicated. One that has no
transactions yet takes the file's `opening_balance` and `opened_on` in place of its own, and
the summary shows the change (ADR-034); any other field, and any account that already has
transactions, is kept as it is.

## transactions.csv

| Column | Required | Meaning |
|---|---|---|
| `ref` | yes | |
| `date` | yes | |
| `account` | yes | |
| `institution` | when needed | The account's institution, required only when two accounts share the name (a `Courant` at two banks) |
| `kind` | yes | `expense`, `income`, `transfer`, `adjustment` |
| `amount` | yes | What the account moved |
| `currency` | yes | The account's currency |
| `original_amount`, `original_currency` | together | The receipt price, when paid in another currency. Expenses and incomes only. |
| `merchant` | no | Expenses and incomes only (the screen can also mark a merchant text as a person: the payload then carries a `counterparties` list of names, which creates the person when missing). On an expense, a text equal to a person's name or alias (people file, or an `aliases` line of kind `person`) is that person as its seller (PPL-09, ADR-040): no merchant is made for them. On an income it stays a merchant, named for the person |
| `event` | no | Expenses and incomes only. Sets a manual link. A trip is one event per place and run of days (`Paris 2023`), made by the converter. |
| `status` | no | `cleared` (default) or `pending` |
| `transfer_group` | transfers | Same value on both legs and on the fee row. Exactly two `transfer` rows per group, on two accounts; same currency, the amounts mirror; different currencies, each leg holds what really moved. The fee is an `expense` row with the group's value on the departure account, booked in the profile's transfer-fee category. |
| `note` | no | |

The category is never on this file: an expense or income gets it from splits.csv.

## splits.csv

Every `expense` and `income` has at least one row here; a transfer, a fee row or an
adjustment has none. The fee row's category is the profile's transfer-fee category, so it
needs none either.

| Column | Required | Meaning |
|---|---|---|
| `ref` | yes | The transaction's `ref` |
| `category` | yes | A category path |
| `amount` | yes | Same sign as the transaction. The rows of one `ref` add up to its amount exactly. |

Splits are stored with `input_mode = amount`.

## people.csv (optional)

The people on a transaction, one row per person, the same lines as the transaction form
(PPL-03, PPL-04).

| Column | Required | Meaning |
|---|---|---|
| `ref` | yes | The transaction's `ref` |
| `role` | yes | `me`, `invited`, `owes`, `from` or `with` (someone with me, with no part; a person is required; expenses only, PPL-08) |
| `person` | no | A name or alias. Empty on an `invited`, `owes` or `from` line means a guest with no name (PPL-04); `me` has none. |
| `head_count` | no | Default 1. On an unnamed line, how many people it stands for. |
| `amount` | no | Only on a `from` line, where it is the income's amount (default). On an expense the parts are not set by the import: leave it empty. `me` takes what is left, `invited` and `with` have no part (ADR-052), and `owes` takes what its reimbursement pays. |
| `reimburses` | `from` only | The `ref` of the expense this income repays |

A group is never a line: the converter writes a group's members one by one, as the form does.

A `me` line is implied when missing, with an empty amount. An `owes` line with an empty
amount is set by the reimbursement that names it; a `from` line with `reimburses` needs an
`owes` line for the same person on that expense.

The rules of the app apply: one `me` per expense, an income only has `from` lines, a person
once per transaction, and the parts add up to the amount (the import leaves them to the
app, as above). A `from` line with `reimburses`
creates the reimbursement (TRX-07), taking at most what that person is owed on the expense.

## aliases.csv (optional)

Another spelling of a merchant or a person, so an import finds them by it.

| Column | Required | Meaning |
|---|---|---|
| `kind` | yes | `merchant` or `person` |
| `name` | yes | The merchant or person, in the app or in this import |
| `alias` | yes | The other spelling. It cannot be the name or alias of anyone else. |

An alias already stored is kept as it is.

## holdings.csv (optional)

The net-worth history (IMP-02, ADR-050). Four files, each optional, in this order of use.
A holding is named by a key in `holding`, which the other three files repeat. The key means
nothing to the app; it only ties the rows together.

| Column | Required | Meaning |
|---|---|---|
| `holding` | yes | The key the other files use |
| `type` | yes | A code from `holding-types.csv` |
| `institution` | no | Created when missing |
| `name` | no | Most holdings have none; type and institution name them |
| `country` | when needed | `CA`, `CH`. Taken from the type when the type has one. |
| `currency` | yes | Fixed once the holding has entries |
| `opened_on` | for a new holding | |
| `closed_on` | no | Nothing may be dated after it |

A holding is matched to one in the app by type, institution and name (a missing one matches
a missing one). The app's version is kept; a different currency is an error, and several
matches ask for a name that tells them apart. Anything not matched is created.

`snapshots.csv`: `holding`, `date`, `amount` (not negative; one per holding per date).
`contributions.csv`: `holding`, `date`, `amount` (above zero), `label` (optional). Only money
that never passes through an account: an employer's share, and a payroll deduction.
`holding_transfers.csv`: `from_holding`, `to_holding`, `date`, `amount`. Two investments in
one currency. Amounts are no finer than the currency's minor unit, in the holding's currency.

A value, contribution or transfer already in the app (same holding and date, and the same
amount and label for the last two) is skipped, so a file can be sent again. An undo removes
what the batch wrote, and a holding it created when nothing else points at it.

Linking existing transactions to a holding (a `holding` column on transactions.csv) is not
part of the format yet; a transaction already imported is skipped by its `ref`.

## Export

"Exporter mes données", in the data page's Exporter tab, downloads the files ticked there (all at first) that have rows, as one zip
(IMP-04, SEC-04, ADR-067). Export then import into an empty account reproduces the data the
format can hold; pgTAP 38 checks it.

- A transaction's `ref` is its import ref, or its id when it was entered in the app.
- A seller who is a person is written in `merchant`; the import reads it back as them.
- `me` lines are left out (implied) and no part amount is written: the import sets them.
- A holding's key is its name or type and its institution, numbered when two share it.

Not carried, so lost on a round trip: archived states, colours, icons and necessity,
event dates, types and skips (every link is written, so an automatic one comes back
manual), people, merchants and events with no transaction, a part set by hand, a
reimbursement after the first when an income repays several expenses, the link from a
transaction to a holding (ADR-045), and a holding whose type was typed (its label is
written, which the import refuses).

## Later

Event dates and types (an `events.csv`), parts
set by amount on an expense, and recurring rules join as optional files and columns; a file
in this format stays valid. Reading a source in its own format, with column mapping and
saved profiles (IMP-03), is the only thing a "wizard" would still add: the author's own
import is this one.

## Data model

| Table | Columns |
|---|---|
| `import_batches` | `file_names`, `row_count`, `created_counts` (jsonb, per kind: transactions, currencies, institutions, accounts, categories, merchants, people, events, holdings, snapshots, contributions, holding transfers), `restored` (the opening balances and dates it replaced, for the undo), `committed_at`, `undone_at` |

`transactions.import_batch_id` and `transactions.import_ref` (unique per user) complete it. So do `import_batch_id` on holdings, snapshots, contributions and holding transfers.
Every institution, account, category, merchant, person and event a batch creates carries its
id, so the undo removes them when nothing else uses them. Added currencies are kept.
