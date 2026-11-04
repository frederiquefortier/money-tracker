# Database

The schema, updated with every migration. `profiles`, `currencies`, `exchange_rates`,
`user_currencies`, `account_types`, `institutions` and `accounts` exist so far; the rest is the design. IDs refer to [requirements.md](../00_briefing/requirements.md).

## Conventions

Every user-owned table has:

```sql
id         uuid primary key default gen_random_uuid(),
user_id    uuid not null default auth.uid() references auth.users on delete cascade,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),   -- trigger-maintained
unique (user_id, id)                              -- target for composite FKs (ADR-005)
```

and the RLS policies from [security.md](security.md#database). Foreign keys to other user
tables are composite: `foreign key (user_id, account_id) references accounts (user_id, id)`.

Grants follow [security.md](security.md#database), rule 8. `profiles` grants `select` and
`update (locale, default_currency, display_currency)`: a new user-editable profile column
joins that grant in its migration.

The app's types come from the schema: `npm run db:types` after every migration, and a
numeric column the app writes gets a string override in `src/lib/database.ts` (ADR-023).

Soft states are dates, not booleans, wherever the date matters: `closed_on`, `archived_at`,
`ends_on`. History that the user can view is its own table of events, never an overwritten
column.

## Money

- Amounts are `numeric(19,4)`, rates `numeric(24,12)`. Never `float`/`real`.
- Currency columns are `char(3)` ISO 4217 codes, referencing `currencies`.
- **A transaction's `amount` is always in its account's currency.** Enforced by a composite
  FK `(user_id, account_id, currency) references accounts (user_id, id, currency)`. A
  purchase in another currency keeps the receipt price in `original_amount` /
  `original_currency`.
- Every amount that is not tied to an account (budgets, expected income) carries its own
  `currency` column.
- Sign convention: an amount is signed from the account's point of view. Expenses and
  outgoing transfer legs are negative, income and incoming legs positive.
- Over the wire amounts are strings; sums and conversions happen in SQL. TypeScript
  previews use integer minor units with `BigInt` (ADR-011).

## Tables

### Reference (global, read-only to users)

| Table | Columns | Notes |
|---|---|---|
| `currencies` | `code`, `name_fr`, `name_en`, `symbol`, `minor_units` | The 162 currencies in current use per ICU (Node 24 `Intl`), loaded by a migration. CUR-02 validates against HexaRate before a user can add one. |
| `exchange_rates` | `base`, `quote`, `rate_date`, `rate`, `source` (`frankfurter`/`hexarate`) | Primary key (`base`, `quote`, `rate_date`). `base` is always EUR (a check), the ECB's; cross rates are computed. Backfilled to 2018 and filled daily by the rates job (ADR-009). |
| function `exchange_rate(from, to, on_date)` | | Units of `to` for one `from`. Each leg takes the last rate on or before the date, so weekends and holidays use the previous business day. 1 for the same currency; null when a leg has no rate yet, never zero (ADR-004). |
| `account_types` | `code`, `label_fr`, `label_en` | ACC-01. Loaded from `src/data/reference/account-types.csv`. |
| `holding_types` | `code`, `country`, `kind`, `label_fr`, `label_en` | Region pack data (LOC-02). CSV in `src/data/reference/`. |

### Profile and currencies

| Table | Columns | Req |
|---|---|---|
| `profiles` | `user_id` (PK), `locale` (`fr` or `en`, ADR-019), `default_currency`, `display_currency` (both CAD on sign-up, composite FKs to `user_currencies`), `transfer_fee_category_id`, `birth_date`, `home_country`, `show_budget_tooltips` | SET, CUR-05/06, BUD-06, TRX-04 |
| `user_currencies` | `code`, `is_favourite`, `removed_at` | CUR-01..04. Unique (`user_id`, `code`). Five rows inserted by the sign-up trigger. Removing sets `removed_at`, so adding back skips the HexaRate check; there is no delete grant. Triggers refuse removing the default or a currency an open account books in, move the display currency to the default when it is removed, and keep both profile currencies pointing at active rows. Open accounts will block removal once `accounts` exists. |

Labels in reference tables come in pairs (`label_fr`, `label_en`; `name_fr`, `name_en`)
per ADR-008. User-owned rows (categories, merchants, notes) store one string, as typed.

### Accounts

| Table | Columns | Req |
|---|---|---|
| `institutions` | `name`, `website_url` (`https://` only) | ACC-05. Names unique per user, ignoring case. Deleting one that accounts use fails on the foreign key. |
| `accounts` | `institution_id` (nullable), `name`, `type` (→ `account_types`), `currency`, `opening_balance`, `opened_on`, `closed_on`, `hidden_for_new` | ACC-01..04. Names unique among open accounts of the same institution, ignoring case; accounts with no institution count as one group. `(user_id, currency)` references `user_currencies`, so an account books in one of the user's currencies; a trigger keeps an open account off a removed currency. Also `unique (user_id, id, currency)`, the target of the transactions currency FK. An account's currency cannot change once it has transactions (with the transactions migration). `last_reconciled_on` comes with ACC-08 (phase 2). |
| view `account_balances` | `account_id`, `currency`, `balance`, `pending`, `display_currency`, `display_balance` | ACC-06. The opening balance until transactions exist; the transactions migration adds their sum and the pending part. `display_balance` is in the profile's display currency at today's rate, null when a rate is missing. |
| view `institution_totals` | `institution_id` (null: no institution), `display_currency`, `total`, `converted` | ACC-06, CUR-09. Open accounts only. One missing rate makes the total null, never a partial sum. |

### Categories

| Table | Columns | Req |
|---|---|---|
| `categories` | `parent_id` (nullable, self, composite FK with `user_id`), `name`, `kind` (`expense`/`income`/`investment`), `icon` (a coolicons name, ADR-020, default `tag`), `icon_is_auto`, `color` (hex `#rrggbb`, free choice; a sub-category starts from a variation of its parent's), `color_is_auto` (designs/12-categories.md) | CAT-01, 02, 07. `is_favourite` was dropped on 2026-11-04 (CAT-06 now works out frequent categories from transactions). Names unique among siblings of the same kind, ignoring case; top-level categories count as siblings. Deleting one with children fails on the foreign key. `exclude_from_emergency_fund` comes with CAT-08 (phase 2). |
| `category_status_events` | `category_id`, `status` (`archived`/`active`), `effective_on` | CAT-03. Append-only: insert and select grants only. A category with no events is active; a trigger makes events alternate starting with an archive, refuses a date before the previous event, and refuses reactivating a sub-category whose parent is archived. Deleted with its category. |
| view `category_active_periods` | `category_id`, `active_from`, `active_to` | Periods `[active_from, active_to)`, null bounds open; one open period when there is no history. Pickers (CAT-04) and charts (DSH-03) both read this, so they never disagree. |

A trigger on `parent_id` and `kind` rejects cycles (no depth limit, but no loops) and
requires a sub-category to have its parent's `kind`; changing a top-level category's kind
carries its branch along. Category kind does not constrain transaction kind: a refund is an
`income` transaction on an `expense` category, and it reduces that category's spending.

Functions: `category_status(id)` gives the status after all events.
`archive_category(id, from)` archives a category and every active category in its branch
from the same date, and returns how many sub-categories went with it (ADR-012).
Reactivating is a single insert into `category_status_events`.
`add_category_pause(id, archive_from, active_from)` adds a past archived period to a
category and its branch, and returns how many sub-categories got it. It refuses a period
that is not strictly inside one active period, ends in the future, or reactivates under
an archived parent. The insert trigger refuses events before the last one, so the
function sets `money.category_pause` for its own transaction and the trigger lets its
rows through; the function has done the checks.
`recolor_categories(colors)` writes the automatic colours the server computed for a
branch, in one statement; a colour picked by hand is never touched (ADR-012).

### Merchants

| Table | Columns | Req |
|---|---|---|
| `merchants` | `name`, `default_category_id` (nullable, composite FK with `user_id`, cleared when the category is deleted) | MER-01. Names unique per user ignoring case and accents: a unique index on `fold_name(name)`. `country` comes with MER-03 (phase 5). |
| `merchant_aliases` | `merchant_id`, `pattern` | MER-02, **later** (with the import wizard). Not created in v1. `merge_merchants` then moves the source's aliases to the target and adds the source's name as one. |

`fold_name(text)` is `lower(unaccent(text))`, marked immutable so an index can use it
(`unaccent` itself is only stable; the wrapper names its dictionary so it cannot change
with the search path). `merge_merchants(source, target)` deletes the source and keeps the
target's name and default category (MER-05); the transactions migration makes it move the
source's transactions first, in the same call (ADR-012).

### Transactions

| Table | Columns | Req |
|---|---|---|
| `transactions` | `account_id`, `kind` (`expense`/`income`/`transfer`/`adjustment`), `occurred_on`, `occurred_at_time` (nullable), `amount`, `currency`, `original_amount`, `original_currency` (both nullable), `status` (`pending`/`cleared`), `merchant_id`, `event_id`, `note`, `transfer_id`, `recurring_rule_id`, `treated_count`, `treated_amount`, `expected_reimbursement`, `holding_id`, `source`, `import_ref`, `import_batch_id` | TRX-01..05, 09..11, CUR-08, PPL-04, NW-03 |
| `transaction_splits` | `transaction_id`, `category_id`, `input_mode` (`amount`/`share`/`percent`), `input_value`, `amount` | TRX-06. Every `expense` and `income` transaction has at least one split; transfers and adjustments have none. A deferred constraint trigger checks the splits sum to the transaction amount, so transaction and splits are written together by `save_transaction` (ADR-012). |
| `reimbursements` | `expense_id`, `income_id`, `amount` | TRX-07, DSH-05 |
| `recurring_rules` | `account_id`, `category_id`, `merchant_id`, `kind`, `frequency` (`weekly`/`monthly`/`yearly`), `interval`, `day_of_month`, `starts_on`, `ends_on` | TRX-08. `ends_on` set = recurrence stopped. Plain columns rather than an iCal RRULE string, which would need a parsing library for schedules this simple. |
| `recurring_rule_amounts` | `rule_id`, `amount`, `currency`, `effective_from` | TRX-08 history: changing the amount inserts a row. |

Notes:

- **Transfers** (TRX-04, TRX-11): two `transfer` rows, one per account, sharing a
  `transfer_id`, each in its own account's currency. Same currency: the amounts mirror.
  Different currencies (CAD to CHF): each leg holds what really moved, and the gap against
  the market rate that day is shown as the conversion cost, computed like CUR-08. An explicit
  fee is a third row, `kind = expense`, same `transfer_id`, in the category set in
  `profiles.transfer_fee_category_id`. `save_transfer` and `delete_transfer` act on all rows
  at once (ADR-012). This departs from C5's
  `linked_transfer_id` pair, which needs two rows pointing at each other and an update after
  insert.
- **Foreign currency** (CUR-08): `amount`/`currency` is what was paid, `original_amount`/
  `original_currency` is the receipt price. The fee is computed, not stored:
  `amount - original_amount × rate(original→paid, occurred_on)`.
- **Opening balance** lives on `accounts`, not as a fake transaction.
- **Adjustment** (TRX-03): the form takes the real balance; the server computes and stores
  the difference.
- `import_ref` is unique per user, so re-running an import is idempotent.
  `import_batch_id` lets a whole import be undone; `import_batches` is described in
  [import.md](import.md#data-model).

### Tags

| Table | Columns | Req |
|---|---|---|
| `tags` | `name`, `color`, `starts_on`, `ends_on` (both nullable) | TAG-01 |
| `tag_categories` | `tag_id`, `category_id` | TAG-02 |
| `transaction_tags` | `transaction_id`, `tag_id`, `source` (`manual`/`auto`) | TAG-02. Auto rows are recomputed when a tag's range or categories change, and for one transaction when its date or splits change. Manual rows are never touched by either. |

### People and events

| Table | Columns | Req |
|---|---|---|
| `people` | `name`, `icon`, `archived_at` | PPL-01, 02 |
| `person_groups` | `name`, `icon`, `archived_at` | PPL-01, 02 |
| `person_group_members` | `group_id`, `person_id` | |
| `transaction_people` | `transaction_id`, `person_id` or `group_id` (exactly one), `role` (`invited`/`owes`), `input_mode`, `input_value`, `amount`, `settled_by_id` (→ `reimbursements`) | PPL-03, 05. The share comes off each split proportionally (Q5); view `my_split_amounts` gives "my share per category", which the dashboard uses by default. |
| `event_types` | `name`, `icon` | EVT-01 |
| `events` | `type_id`, `name`, `starts_on`, `ends_on` | EVT-02 |
| `event_people` | `event_id`, `person_id` | EVT-02 |

### Budget

| Table | Columns | Req |
|---|---|---|
| `budgets` | `category_id` or `event_id` (exactly one), `starts_on`, `ends_on`, `metric` (`amount`/`count`), `direction` (`max`/`min`), `value`, `currency` (required when `metric = amount`) | BUD-01, 02, EVT-06 (Q6) |
| `budget_settings` | `user_id` (PK), `expected_monthly_income`, `currency`, `emergency_fund_months`, `emergency_fund_account_id` | BUD-03, 04. The emergency fund target is months of spending, converted to the fund account's currency. |

### Net worth

| Table | Columns | Req |
|---|---|---|
| `holdings` | `name`, `kind` (`investment`/`asset`/`debt`), `type` (→ `holding_types`), `institution_id`, `country`, `currency`, `include_in_net_worth`, `opened_on`, `closed_on` | NW-01, 05 |
| `holding_snapshots` | `holding_id`, `as_of`, `value` | NW-02 |
| `holding_contributions` | `holding_id`, `on`, `amount`, `source` (`employer`/`government`/`other`) | NW-03. Only money that did not leave one of my accounts. My own contributions are the transactions whose `holding_id` points here, so they are never entered twice. |
| `employers` | `name` | NW-09 |
| `salaries` | `employer_id`, `starts_on`, `ends_on`, `gross_amount`, `currency`, `period` (`year`/`month`), `note` | NW-09 |

Bank accounts count toward net worth through their computed balance; they are not
duplicated as holdings.
