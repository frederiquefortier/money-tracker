# Database

The rules and traps of the schema. Columns, types and constraints live in
`src/supabase/migrations/` and the generated types; this file records what they do not say.
IDs refer to [requirements.md](../00_briefing/requirements.md).

## Conventions

Every user-owned table has `id`, `user_id` (default `auth.uid()`, cascade on user delete),
`created_at`, a trigger-maintained `updated_at`, and `unique (user_id, id)` as the target of
composite foreign keys (ADR-005). RLS policies and grants follow
[security.md](security.md#database). Foreign keys to other user tables include `user_id`.

- `profiles` grants `select` and `update (locale, default_currency, display_currency,
  transfer_fee_category_id)`. A new user-editable profile column joins that grant in its
  migration.
- Run `npm run db:types` after every migration. A numeric column the app writes gets a string
  override in `src/lib/database.ts` (ADR-023).
- Soft states are dates (`closed_on`, `archived_at`, `ends_on`) wherever the date matters.
  History the user can view is its own append-only table, never an overwritten column.
- Labels in reference tables come in pairs (`label_fr`, `label_en`, ADR-008). User-owned rows
  store one string, as typed.
- Names are unique per user ignoring case and accents: a unique index on `fold_name(name)`,
  which is `lower(unaccent(name))` wrapped as immutable so an index can use it.
- Writes that touch several rows are `security invoker` SQL functions (ADR-012). A function
  that returns a numeric also has a `_text` twin, because PostgREST sends numerics as JSON
  numbers and the browser would read a float (ADR-004).

## Money

- Amounts are `numeric(19,4)`, rates `numeric(24,12)`, currencies `char(3)` ISO 4217. Never float.
- **A transaction's `amount` is in its account's currency**, enforced by a composite FK
  `(user_id, account_id, currency)` to `accounts`. A purchase in another currency keeps the
  receipt price in `original_amount` / `original_currency`.
- Amounts are signed from the account's point of view: expenses and outgoing transfer legs
  negative, income and incoming legs positive. Functions take positive amounts and the kind
  gives the sign.
- Amounts not tied to an account (budgets, expected income) carry their own `currency`.
- Over the wire amounts are strings; sums and conversions happen in SQL.
- `exchange_rates` are all EUR-based (a check); cross rates are computed. `exchange_rate(from,
  to, on_date)` takes the last rate on or before the date per leg, returns 1 for the same
  currency and null (never zero) when a leg has no rate (ADR-004, ADR-009).
- Views that convert (`account_balances`, `institution_totals`) return null when one rate is
  missing, never a partial sum.

## Tables, by what is not obvious

**Currencies.** `user_currencies.removed_at` instead of a delete, so adding a currency back
skips the HexaRate check. Triggers refuse removing the default currency or one an open
account books in, and keep both profile currencies on active rows.

**Accounts.** Opening balance lives on `accounts`, not as a fake transaction. An account's
currency cannot change once it has transactions (the composite key refuses it), and an
account with transactions cannot be deleted. Account names are unique among open accounts of
one institution.

**Categories.** Archiving is `category_status_events` (append-only, alternating, starting with
an archive, never before the previous event). `archive_category`, `reactivate_category` and
`add_category_pause` act on a whole branch and fill `via_category_id` on the events they add
for other categories; the pause function sets `money.category_pause` so its own inserts skip
the ordering trigger. View `category_active_periods` is what pickers and charts both read, so
they never disagree. A trigger rejects cycles and keeps a sub-category in its parent's `kind`.
`necessity` (need/want) is allowed on expense categories only and null follows the nearest
marked parent (`category_necessity`). `recolor_categories` rewrites automatic colours only.
Category kind does not constrain transaction kind: a refund is an income on an expense category.

**Merchants.** `merge_merchants(source, target)` moves transactions, aliases and the source's
name (as an alias) to the target. A name or an alias points to one merchant only (triggers);
the same rule holds for people. `save_merchant` replaces the alias list. View
`merchant_suggested_category` gives each merchant the category with the most of its
transactions, the last used on a tie (MER-08); the list offers it when there is no default.

**Transactions.**
- `occurred_on` is a `date`, with no time, so no time zone can shift it.
- Every expense and income has at least one split; transfers and adjustments have none. A
  deferred constraint trigger checks the splits sum to the amount, so a transaction and its
  splits are written together by `save_transaction`. Shares and percentages are turned into
  amounts by the server, and the last line takes the rounding.
- **Transfers** are two `transfer` rows sharing a `transfer_id`, one per account, each in its
  own currency, plus an optional third row (the fee, `kind = expense`) in
  `profiles.transfer_fee_category_id`. `save_transfer`, `delete_transfer` and
  `set_transfer_fee_category` act on all rows at once. A deferred trigger (`check_transfer`)
  rejects a broken transfer at commit, such as one deleted leg.
- **Adjustment**: the form takes the real balance, `save_adjustment` stores the difference
  against the balance at the end of that day (`adjustment_base`), pending included.
- **Conversion cost** (CUR-08, TRX-11) is never stored. On a purchase it is `amount -
  original_amount × rate(original to paid, occurred_on)`; on a cross-currency transfer, what
  was sent minus what arrived valued back at that day's rate. The dashboard counts it in the
  transfer fee category.
- `list_transactions` returns whole days (about 150 rows a page), every amount converted at
  the rate of its date, as text. A transfer is one row without an account filter and one row
  per chosen account's leg with it; the fee rides on the departure row. `total` counts rows
  before paging. `kinds` keeps expenses, incomes or transfers; an adjustment is in none. Usage views (`merchant_usage`, `merchant_suggested_category`, `frequent_categories`) count in SQL because
  PostgREST returns at most 1,000 rows. It is plpgsql planned per call (ADR-053).
- `used_category_ids()`, `used_account_ids()` and `holdings_with_history()` return the ids
  in use (security invoker); those are archived, not deleted.
- `reimbursements` link an income to `owes` lines of an expense, each taking at most what it
  is owed; written by `save_transaction`, deleted with either side. The known parts are paid
  first in the order ticked, then the parts not known yet share what is left equally within
  each expense's `empty_part_room` (20261119120000, pgTAP 36). Views `owed_lines` and
  `person_balances`.
- `import_ref` (unique per user) makes re-importing skip what is in. See [import.md](import.md).
- `recurring_rules` use plain columns, not an iCal RRULE, which would need a parser for
  schedules this simple. A rule's amount history is `recurring_rule_amounts`.

**People.** `transaction_people.role` is `me`, `invited`, `owes`, `from` or `with` (`with`
carries no money; `invited` may have a part of 0, ADR-052). One `me` per expense, an income only `from`, a person once per
transaction, parts sum to the amount (deferred trigger). A group is only a way to add its
members, never a line. Deleting a person keeps their lines as lines without a name.
`merge_people` refuses a transaction both people share (ADR-039). The seller of an expense is
`transactions.seller_person_id` (ADR-040).

**Events.** A transaction has one event and an `event_source` (`manual` or `auto`).
Automatic links are recomputed when an event's dates or `auto_link` change and when a
transaction's date or kind changes; manual links are never touched. Two matching events: the
narrower range wins, then the earlier created. `event_exclusions` remember an automatic link
removed by hand so it never comes back. `event_default_skips` and `event_skips` are the
categories the link skips (an event with `skips_own` uses its own list, even empty, instead of the default, ADR-056; a category takes its
sub-categories, a transaction is skipped only when all its splits are, ADR-055).
`matching_event` links one transaction (the form, `save_transaction`); `relink_events`
applies the same rules to a date range in one pass (the import, saving an event or the
default list), since one call per transaction took 87 s over the whole history.

**Dashboard.** `my_lines(from, to)` gives one row per split of an expense or income at my share in the display currency: an expense less its known owed parts, an income less what it repaid. NULL with a missing rate; null dates mean everything. `event_totals()` sums it per event, `event_category_totals()` per event and leaf category (EVT-05's stacked columns, folded into top-level groups in the browser), and `my_monthly()` per month and category (ADR-063). `merchant_monthly()` sums each expense's lines back into one bill at my share, then per merchant and month: transactions, total, smallest and largest, NULL with a missing rate (ADR-064).

**Holdings.** `holdings` are investments, assets and debts (bank accounts count through their
balance). `holding_snapshots` are the dated values, one per holding per date, in the holding's
currency; `holding_contributions` only the external (employer or government) money; `holding_transfers` are dated amounts moved from one holding to another, both investments in one currency (a withdrawal on one side, a contribution on the other). My own contributions
are the transactions with a `holding_id`, allowed on an expense or an income whose categories are
all investment-kind, so a withdrawal is an income. Deleting a holding with transactions or transfers is
refused by the database, and by the server once it has values or contributions (a history means archive); the currency is fixed once it has entries; it cannot close before its last entry, and
takes nothing dated after. `holding_totals` gives placed (money in, never down), withdrawn (money out), latest value, profit (value plus withdrawn minus placed) and percent,
null (never zero or partial) when a rate or a value is missing (ADR-045). A category with
linked transactions stays an investment. The four holding tables carry `import_batch_id`, so an import is undone (ADR-050).

**Net worth series.** `net_worth_series()` gives the hub's chart one row per month end (then
today) per account and per holding with a value: the account's balance, pending included, or the
holding's last value on or before the date (debts negative), as text in the display currency at
that date's rate, null when a rate is missing. An item counts until the day it closes. The
browser leaves items out and sums (ADR-057).

**Holding flows.** `holding_flows()` gives each investment's money in (positive) and out
(negative) per day: the moves `holding_totals` sums, as text in the display currency at that
day's rate, null when a rate is missing, nothing dated after today. The hub computes each
investment's return over the range from it and the series (ADR-062).

## Not built yet

| Table | Notes |
|---|---|
| `budgets` | `category_id` or `event_id` (exactly one), period, `metric` (amount/count), `direction` (max/min), `value`. BUD-01, 02, EVT-06. |
| `budget_settings` | Expected monthly income, emergency fund months and account. BUD-03, 04. |
| `employers`, `salaries` | NW-09. |
| Tags | Decided against, see [improvements.md](../03_planning/improvements.md#decided-against). |
