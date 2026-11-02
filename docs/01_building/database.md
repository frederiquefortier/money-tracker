# Database

Design draft. No migration exists yet; when the first one lands, this file describes what
the migrations do and is updated with every schema change. Requirement IDs refer to
[requirements.md](../00_briefing/requirements.md).

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
- Over the wire amounts are strings; sums and conversions happen in SQL. The few TypeScript calculations
  (form previews) use integer minor units with `BigInt` (ADR-011).

## Tables

### Reference (global, read-only to users)

| Table | Columns | Notes |
|---|---|---|
| `currencies` | `code`, `name_fr`, `name_en`, `symbol`, `minor_units` | ISO 4217 list, loaded by a migration. CUR-02 validates against HexaRate before a user can add one. |
| `exchange_rates` | `base`, `quote`, `rate_date`, `rate`, `source` (`frankfurter`/`hexarate`) | Unique on (`base`, `quote`, `rate_date`). Backfilled to 2018 and filled daily (ADR-009). One base (EUR, the ECB's) is enough; cross rates are computed. |
| `account_types`, `holding_types` | `code`, `country`, `kind`, `label_fr`, `label_en` | Region pack data (LOC-02). CSVs in `src/data/reference/`. |

### Profile and currencies

| Table | Columns | Req |
|---|---|---|
| `profiles` | `user_id` (PK), `locale` (`fr` or `en`, ADR-019; old regional values accepted until the contract migration), `default_currency`, `display_currency`, `transfer_fee_category_id`, `birth_date`, `home_country`, `show_budget_tooltips` | SET, CUR-05/06, BUD-06, TRX-04 |
| `user_currencies` | `code`, `is_default`, `is_favourite`, `display_order` | CUR-01..04. Five rows inserted by a trigger on sign-up. |

Labels in reference tables come in pairs (`label_fr`, `label_en`; `name_fr`, `name_en`)
per ADR-008. User-owned rows (categories, merchants, notes) store one string, as typed.

### Accounts

| Table | Columns | Req |
|---|---|---|
| `institutions` | `name`, `website_url` | ACC-05 |
| `accounts` | `institution_id`, `name`, `type` (→ `account_types`), `currency`, `opening_balance`, `opened_on`, `closed_on`, `hidden_for_new`, `last_reconciled_on` | ACC-01..04, 08. Also `unique (user_id, id, currency)`, the target of the transactions currency FK. An account's currency cannot change once it has transactions. |

### Categories

| Table | Columns | Req |
|---|---|---|
| `categories` | `parent_id` (nullable, self), `name`, `kind` (`expense`/`income`/`investment`), `icon` (a coolicons name, ADR-020), `icon_is_auto`, `color` (from a fixed palette, for the icon circle and charts; designs/00-layout-reference.md), `is_favourite`, `exclude_from_emergency_fund` | CAT-01, 02, 06, 07, 08 |
| `category_status_events` | `category_id`, `status` (`archived`/`active`), `effective_on` | CAT-03. Append-only. |
| view `category_active_periods` | `category_id`, `active_from`, `active_to` | Derived from the events. Pickers (CAT-04) and charts (DSH-03) both read this, so they never disagree. |

A trigger on `parent_id` rejects cycles (no depth limit, but no loops) and requires a
sub-category to have its parent's `kind`. Category kind does not constrain transaction kind:
a refund is an `income` transaction on an `expense` category, and it reduces that
category's spending.

### Merchants

| Table | Columns | Req |
|---|---|---|
| `merchants` | `name`, `default_category_id`, `country` | MER-01, 03 |
| `merchant_aliases` | `merchant_id`, `pattern` | MER-02, **later** (with the import wizard). Not created in v1. |

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
