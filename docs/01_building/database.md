# Database

The schema, updated with every migration. `profiles`, `currencies`, `exchange_rates`,
`user_currencies`, `account_types`, `institutions`, `accounts`, `categories`,
`category_status_events`, `merchants`, `transactions` and `transaction_splits` exist so
far; the rest is the design. IDs refer to [requirements.md](../00_briefing/requirements.md).

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
`update (locale, default_currency, display_currency, transfer_fee_category_id)`: a new user-editable profile column
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
| `profiles` | `user_id` (PK), `locale` (`fr` or `en`, ADR-019), `default_currency`, `display_currency` (both CAD on sign-up, composite FKs to `user_currencies`), `transfer_fee_category_id` (the one category of every transfer fee, marked in Catégories, set by `set_transfer_fee_category`; cleared when the category is deleted), `birth_date`, `home_country`, `show_budget_tooltips` | SET, CUR-05/06, BUD-06, TRX-04 |
| `user_currencies` | `code`, `removed_at` (`is_favourite` dropped 2026-11-05, CUR-03) | CUR-01..04. Unique (`user_id`, `code`). Five rows inserted by the sign-up trigger. Removing sets `removed_at`, so adding back skips the HexaRate check; there is no delete grant. Triggers refuse removing the default or a currency an open account books in, move the display currency to the default when it is removed, and keep both profile currencies pointing at active rows. Open accounts will block removal once `accounts` exists. |

Labels in reference tables come in pairs (`label_fr`, `label_en`; `name_fr`, `name_en`)
per ADR-008. User-owned rows (categories, merchants, notes) store one string, as typed.

### Accounts

| Table | Columns | Req |
|---|---|---|
| `institutions` | `name`, `website_url` (`https://` only) | ACC-05. Names unique per user, ignoring case. Deleting one that accounts use fails on the foreign key. |
| `accounts` | `institution_id` (nullable), `name`, `type` (→ `account_types`), `currency`, `opening_balance`, `opened_on`, `closed_on`, `hidden_for_new` | ACC-01..04. Names unique among open accounts of the same institution, ignoring case; accounts with no institution count as one group. `(user_id, currency)` references `user_currencies`, so an account books in one of the user's currencies; a trigger keeps an open account off a removed currency. Also `unique (user_id, id, currency)`, the target of the transactions currency FK. An account's currency cannot change once it has transactions: the transactions' composite key to `(user_id, id, currency)` refuses it. An account with transactions cannot be deleted. `last_reconciled_on` comes with ACC-08 (phase 4). |
| view `account_balances` | `account_id`, `currency`, `balance`, `pending`, `display_currency`, `display_balance` | ACC-06. The opening balance plus every transaction, pending included; `pending` is the pending part alone. `display_balance` is in the profile's display currency at today's rate, null when a rate is missing. |
| view `institution_totals` | `institution_id` (null: no institution), `display_currency`, `total`, `converted` | ACC-06, CUR-09. Open accounts only. One missing rate makes the total null, never a partial sum. |

### Categories

| Table | Columns | Req |
|---|---|---|
| `categories` | `parent_id` (nullable, self, composite FK with `user_id`), `name`, `kind` (`expense`/`income`/`investment`), `icon` (a coolicons name, ADR-020, default `tag`), `icon_is_auto`, `color` (hex `#rrggbb`, free choice; a sub-category starts from a variation of its parent's), `color_is_auto` (designs/12-categories.md), `necessity` (`need`/`want`, nullable: null follows the nearest marked parent) | CAT-01, 02, 07, 10. A check allows `necessity` on `expense` categories only. `is_favourite` was dropped on 2026-11-04 (CAT-06 now works out frequent categories from transactions). Names unique among siblings of the same kind, ignoring case; top-level categories count as siblings. Deleting one with children fails on the foreign key. `exclude_from_emergency_fund` comes with CAT-08 (phase 4). |
| `category_status_events` | `category_id`, `status` (`archived`/`active`), `effective_on`, `via_category_id` | CAT-03. Append-only: insert and select grants only. A category with no events is active; a trigger makes events alternate starting with an archive, refuses a date before the previous event, and refuses reactivating a sub-category whose parent is archived. `via_category_id` names the category an event came through (the parent that archived the branch, the sub-category that brought its parents back), null for an event of its own; its foreign key includes `user_id` and is set to null when that category is deleted. Deleted with its category. |
| view `category_active_periods` | `category_id`, `active_from`, `active_to` | Periods `[active_from, active_to)`, null bounds open; one open period when there is no history. Pickers (CAT-04) and charts (DSH-03) both read this, so they never disagree. |
| view `category_necessity` (comes with DSH-09) | `category_id`, `necessity` (`need`/`want`/null) | DSH-09. Expense categories only. A recursive walk up `parent_id` to the nearest category with a mark; null when none has one. `security_invoker`, so RLS on `categories` applies. The category form works the same rule out from the tree it already loads (`inheritedNecessity`). |

A trigger on `parent_id` and `kind` rejects cycles (no depth limit, but no loops) and
requires a sub-category to have its parent's `kind`; changing a top-level category's kind
carries its branch along. Moving a branch out of `expense` clears `necessity` on every
category in it (a before-update trigger on `kind`), so the check holds. Category kind does not constrain transaction kind: a refund is an
`income` transaction on an `expense` category, and it reduces that category's spending.

Functions: `category_status(id)` gives the status after all events.
`archive_category(id, from)` archives a category and every active category in its branch
from the same date, and returns how many sub-categories went with it (ADR-012).
`reactivate_category(id, from)` reactivates a category and, from the same date, every
archived parent above it up to the first active one, top-down so the insert trigger finds
each parent active; it returns how many parents came back. The three functions fill
`via_category_id` on the events they add for other categories.
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
| `merchants` | `name`, `default_category_id` (nullable, composite FK with `user_id`, cleared when the category is deleted) | MER-01. Names unique per user ignoring case and accents: a unique index on `fold_name(name)`. `country` comes with MER-03 (later). |
| `merchant_aliases` | `merchant_id`, `alias`, `import_batch_id` | MER-02. Built 2026-11-10 (migration `merchant_aliases`, pgTAP `18_merchant_aliases`). As for people, a name or an alias points to one merchant only: triggers refuse an alias equal to any merchant's name or another alias (`alias_taken`) and a name equal to an alias (`name_is_alias`). `merge_merchants` moves the source's aliases to the target and adds the source's name as one. `save_merchant` writes the merchant with its aliases, replacing the list as `save_person` does; the merchant form edits them, the list does not show them (2026-11-11, pgTAP `22_save_merchant`). |

`fold_name(text)` is `lower(unaccent(text))`, marked immutable so an index can use it
(`unaccent` itself is only stable; the wrapper names its dictionary so it cannot change
with the search path). `merge_merchants(source, target)` moves the source's transactions to the target, then
deletes the source; the target keeps its name and default category (MER-05, ADR-012).
Deleting a merchant clears it on its transactions.

### Transactions

| Table | Columns | Req |
|---|---|---|
| `transactions` | `account_id`, `kind` (`expense`/`income`/`transfer`/`adjustment`), `occurred_on` (a `date`, no time, decided 2026-11-04: `occurred_at_time` was dropped so no time zone can shift a date), `amount`, `currency`, `original_amount`, `original_currency` (both nullable), `status` (`pending`/`cleared`), `merchant_id` (cleared when the merchant is deleted), `seller_person_id` (nullable, composite FK to `people`, set null on delete; expenses only, PPL-09, ADR-040), `note`, `transfer_id`; later with their tables: `event_id`, `event_source`, `recurring_rule_id`, `holding_id`, `source`, `import_ref`, `import_batch_id` | TRX-01..05, 09..11, CUR-08, NW-03. Checks: an expense is negative, an income positive, a transfer leg or adjustment non-zero; `original_*` only on expenses and incomes, in another currency than the account's (a composite FK to `user_currencies`), signed like `amount`; a `transfer` row has a `transfer_id`, and only transfers and their fee carry one. |
| `transaction_splits` | `transaction_id`, `category_id`, `input_mode` (`amount`/`share`/`percent`), `input_value`, `amount` | TRX-06. Every `expense` and `income` transaction has at least one split; transfers and adjustments have none. One input mode per transaction, one split per category, each signed like the transaction. A deferred constraint trigger checks the splits sum to the transaction amount, so transaction and splits are written together by `save_transaction` (ADR-012). A category with splits cannot be deleted. |
| `reimbursements` | `owed_line_id` (→ `transaction_people`, an `owes` line), `income_id`, `amount` | TRX-07, DSH-05. Built 2026-11-05 (spec 21). Written by `save_transaction` on an income (`reimburses`), each line taking at most what it is owed; deleted with either side, which recomputes the expense. Views `owed_lines` and `person_balances` (PPL-05). |
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
- **Conversion cost** (CUR-08, TRX-11, decided 2026-11-05). Money lost to the exchange is
  spending wherever it happens. On a purchase it is the fee above; on a transfer between
  currencies, what was sent minus what arrived valued back at that day's rate. Neither
  is stored: the balances are already right, and the cost follows from the rates. The
  dashboard (phase 4) counts it in `profiles.transfer_fee_category_id`'s category, and a
  purchase's own categories count only its market value, so nothing is counted twice.
- **Opening balance** lives on `accounts`, not as a fake transaction.
- **Adjustment** (TRX-03): the form takes the real balance; the server computes and stores
  the difference.
- **Functions** (ADR-012), all `security invoker`. Amounts come in positive; the kind
  gives the sign, and an amount finer than the currency's minor unit is refused.
  - `save_transaction(transaction_id, account_id, kind, occurred_on, amount, splits, …)`
    creates or edits an expense or income. `splits` is `[{category_id, input_mode,
    input_value}]`; for shares and percentages the server computes the amounts and the
    last line takes the rounding. Editing replaces the splits. It refuses a transfer leg
    or fee.
  - `save_transfer(transfer_id, from_account, to_account, amount, occurred_on, received,
    fee, note, from_pending, to_pending)` creates or edits the legs and the fee in place;
    the fee goes to the profile's fee category and is refused without one.
    `delete_transfer(transfer_id)`. `set_transfer_fee_category(category)` sets that
    category (an expense one) and moves every transfer fee already saved to it.
  - `save_adjustment(adjustment_id, account_id, real_balance, occurred_on, note)` stores
    the difference with `adjustment_base(account_id, on_date, adjustment_id)`: the balance
    at the end of that day, pending included (`account_balance_on`), without the
    adjustment being edited. A null `adjustment_id` adds one; an edit keeps its account and
    stores the new gap. `adjustment_balance_text` returns the same balance as text for the
    form, since a numeric over the API arrives as a float (ADR-004).
- **Deferred checks.** Constraint triggers on both tables run at commit:
  `check_transaction_splits` (above) and `check_transfer` (one leg out, one leg in, two
  accounts, at most one fee on the departure account, mirrored amounts in one currency).
  A direct write that breaks a transfer, like deleting one leg, fails at commit.
- **Usage** (spec 13, spec 15). View `merchant_usage` (`merchant_id`,
  `transaction_count`) ranks the merchant picker; view `frequent_categories` (`kind`,
  `category_id`, `rank`) gives, per kind, the five categories with the most splits over
  the last 90 days, ties to the one used last, transfer fees left out (CAT-06). Both
  `security_invoker`. Counted in SQL because PostgREST returns at most 1,000 rows.
  `exchange_rate_text(from, to, on_date)` is `exchange_rate` as text: PostgREST sends a
  numeric result as a JSON number, which the browser would read as a float (ADR-004).
- **The list** (spec 14, TRX-12..14). `list_transactions(from_date, to_date,
  account_ids, category_ids, merchant_ids, search, before, pending_only, max_rows)` returns the
  transactions between two dates (either open), newest day first and the last entered
  first within a day, every amount converted to the profile's display currency at the
  rate of its date (CUR-07), as text. Each list keeps the transactions matching any of
  its values, an empty list being no filter: `category_ids` with every sub-category (a
  recursive walk down `parent_id`) and a split matching on any of its categories;
  `search` keeps the ones where the text appears in the merchant, the note, any split's
  category, the account or its institution (for a transfer, either side's), compared
  through `fold_name`. A page holds about `max_rows` (150) rows and always whole days; `more`
  says older rows remain, and the next page asks for the days `before` the page's last
  one. `total` counts every row matched before the page is cut (and before `before`),
  for the filter sheet's "Voir 128 résultats". `pending_only` keeps what is pending;
  `pending_count` counts the pending rows the filters and search match at any date (TRX-09).
  Without accounts, a transfer is one row (its outgoing leg, unsigned, pending while
  either leg is); with them, each row is a chosen account's own leg. A fee rides on the
  departure leg's row (`fee_amount`, `fee_category`) and counts in the day net; it has
  its own row only when filtering on categories, naming both accounts. The departure
  row between two currencies carries `received_amount`, `received_currency` and
  `received_value` (its value in the departure currency). `conversion_cost`, in the
  row's currency, is set on that row and on any expense or income paid in another
  currency. Rows carry the account's institution (both of a transfer's), and `categories`,
  every split's category as JSON, the largest share first. The day net (expenses and
  incomes as listed) is computed in SQL and null when it includes a missing rate.
  `security invoker`.
- **Import** (built 2026-11-10, migration `import`, pgTAP `17_import`, ADR-036). Columns
  `import_ref` (unique per user, so re-running an import skips what is in) and
  `import_batch_id` on `transactions`, and `import_batch_id` on `institutions`,
  `accounts`, `categories`, `merchants`, `people` and `events`. Table `import_batches`
  (RLS and MFA policy as the others; the data model is in [import.md](import.md#data-model)).
  Functions, all `security invoker`: `import_batch(payload jsonb, dry_run boolean)` checks
  every row and writes only when there is no error, in bulk except for rows with people,
  which go through `save_transaction`; `import_undo(batch)`; and the helpers
  `split_category_path`, `category_key` and `category_keys`. A merchant is found by its name
  or an alias; an `aliases` list in the payload (kind, name, alias) teaches new spellings of
  a merchant or a person, and `person_aliases` and `merchant_aliases` carry the batch id so
  the undo removes them. The API gives a statement 8
  seconds, so nothing in it loops over rows except the people lines. Its temporary tables
  are declared to the linter with `internal.plpgsql_check_pragma`, a no-op in a schema of
  its own (`plpgsql_check` cannot see a table made inside a function).

### Tags

Later (TAG-01, 03): tags moved out of the plan on 2026-11-05, and their automatic linking
went to events (EVT-07). Kept as the draft for when they come back.

| Table | Columns | Req |
|---|---|---|
| `tags` | `name`, `color`, `starts_on`, `ends_on` (both nullable) | TAG-01 |
| `tag_categories` | `tag_id`, `category_id` | TAG-02 |
| `transaction_tags` | `transaction_id`, `tag_id`, `source` (`manual`/`auto`) | TAG-02. Auto rows are recomputed when a tag's range or categories change, and for one transaction when its date or splits change. Manual rows are never touched by either. |

### People and events

| Table | Columns | Req |
|---|---|---|
| `people` | `name`, `archived_on` | PPL-01, 02. Built 2026-11-05. No icon: the avatar is the name's first letter (spec 19). Names unique ignoring case and accents (`fold_name`). |
| `person_groups` | `name`, `archived_on` | PPL-01, 02. Built 2026-11-05. Its icon is its members' avatars. Names unique the same way. |
| `person_aliases` | `person_id`, `alias` | PPL-06. Built 2026-11-05. Unique per user on `fold_name(alias)`. Triggers refuse an alias equal to any person's name or another alias, and a name equal to an alias, so an import match points to one person. Written by `save_person`, which replaces the list; deleted with the person. `merge_people(source, target)` (PPL-07, ADR-039) moves the source's aliases to the target and adds the source's name as one. |
| `person_group_members` | `group_id`, `person_id` | PPL-01. Composite keys with `user_id` to both (ADR-005), deleted with either side. Written with the person or the group by `save_person` and `save_person_group` (ADR-012). |
| `transaction_people` | `transaction_id`, `position`, `role` (`me`/`invited`/`owes`/`from`/`with`: with has no money, `amount` 0, a person, head count 1, expenses only, PPL-08), `person_id` (null for Moi and lines without a name), `head_count`, `input_mode`, `input_value`, `amount` (null on an unknown part), `amount_unknown`, `fills_rest` (spec 21) | PPL-03, 04. Built 2026-11-05 (spec 20). A group is never a line, only its members. One Moi per expense; an income only `from`; a person once per transaction; the parts sum to the amount (deferred constraint trigger, also run when the transaction changes). Deleting a person keeps their lines without a name. Written by `save_transaction` with the splits. `merge_people` re-points the lines of the merged person (the `update (person_id)` grant exists for it); reimbursements follow, as they name the line. View `person_usage` counts each person's transactions. The share comes off each split proportionally (Q5); view `my_split_amounts` gives "my share per category", which the dashboard uses by default. |
| `event_types` | `name`, `color` (hex `#rrggbb`, free choice; the icon was dropped 2026-11-09) | EVT-01. Names unique ignoring case and accents. Deleting one sets `events.type_id` to null. |
| `events` | `type_id` (nullable), `name`, `starts_on`, `ends_on` (both nullable: no end is one day, no start is open on that side), `auto_link` (default true; false links by hand only, migration `event_auto_link`) | EVT-02. No archive: an event is past once its end date has passed (spec 22). |
| `event_people` | `event_id`, `person_id` | EVT-02. Kept apart from `transaction_people`. |
| `event_exclusions` | `event_id`, `transaction_id` | EVT-07. An automatic link removed by hand; recomputing never restores it, and choosing the event by hand deletes the row. |

A transaction has one event (`transactions.event_id`) and `event_source`
(`manual`/`auto`). Automatic links are recomputed when an event's dates change, and for one
transaction when its date or kind changes; a manual link is never
touched. Only expenses and incomes carry an event. Two automatic events matching the same
transaction: the narrower range wins, then the earlier created. A link removed by hand is
kept from coming back by `event_exclusions` (designs/22-events.md). Built 2026-11-09
(migration `events`, pgTAP `16_events`): view `event_usage`; `matching_event`,
`event_first_day`, `event_last_day`, `relink_events`, `save_event`, `save_event_type`, `delete_event`;
`save_transaction` and `list_transactions` carry the event. `event_source` is read only
while `event_id` is set. The table `event_categories` and the Sauf flag existed for a few hours on
2026-11-09 and were dropped (migration `events_without_categories`).

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
