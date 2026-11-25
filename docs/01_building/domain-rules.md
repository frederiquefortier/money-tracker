# Domain rules

Business rules the schema and the screens do not make obvious. The code is the source for how; this says what must hold and why. Column and function details are in [database.md](database.md).

## Reimbursements and unknown parts

- An expense line can say someone owes me (`owes`). Its part may be unknown. A later income from that person, linked to the line, settles it and sets the part.
- **An empty amount is "not known yet"** and never blocks a save. An empty `owes` part is set by its reimbursement. An empty Moi or Invité takes what is left once the other parts are known: one part in Parts, an equal share in Amount and %.
- In Amount mode typed lines keep their amounts and the empty ones absorb what a reimbursement changes. With nothing else empty, Moi absorbs it, since Moi is what I really paid.
- A reimbursement pays the ticked lines with a known part first, in the order ticked, each taking at most what it is owed; then the parts not known yet share what is left equally, each within what its expense can give up (author, 2026-11-19: one income can repay several expenses). **What the income has over stays an income in the expense's category**, so that category's total can go below zero (a roommate paying two months at once).
- The first line linked gives the income its expense's category, as a refund, unless one was chosen by hand. An expense category on an income lowers that category's spending.
- Linking is done from the income only. Deleting the income unlinks it and an unknown part becomes unknown again. Re-saving an expense keeps its links.
- An income from "Sans nom" (a `from` line with no person) repays lines owed without a name.
- A row stays highlighted as owed while any `owes` line is open. No notifications.

## Splits and people

- Every expense and income has at least one split. With people, each person's share comes off each split proportionally.
- A person once per transaction; a group is only a shortcut to add its members.
- The seller (`seller_person_id`) is who I bought from, on expenses only. `with` lines carry no money.

## Currency and conversion

- Everything is displayed in the display currency, converted at the rate of the transaction's date; an amount already in it is never converted. A missing rate is an error, never zero, and one missing rate makes a total null rather than partial.
- Rates go back to 2018 for every currency Frankfurter has; one it lacks has rates only from the day it was added.
- The conversion cost is spending wherever it happens (purchase in another currency, transfer between currencies). It is computed from rates, never stored, and counted in the transfer fee category, so nothing is counted twice.
- Removing a currency never changes a transaction or account. The default currency and any currency an open account books in cannot be removed.

## Categories

- Archiving takes effect from a date: transactions before it keep the category, pickers stop offering it. Archiving a parent archives its branch from the same date. Reactivating a sub-category under an archived parent brings the parents back from the same date.
- A past pause (archived between two dates, active again after) is allowed; periods may not overlap, and a pause must sit inside one active period.
- A sub-category has its parent's kind. Need or want follows the nearest marked parent when empty.
- The import accepts an archived category up to and including its archive day (ADR-035).

## Events

- Only expenses and incomes link, the whole transaction whatever its splits. A transaction matches an event when its date is in the event's dates. Two matches: the narrower range wins, then the earlier created.
- A manual link is never changed by the rule. An automatic link is lost when the date leaves the range. Removing an automatic link by hand is remembered, and choosing the event again forgets it.
- Recomputed when an event's dates or `auto_link` change and when a transaction's date or kind changes.

## Net worth and holdings

- The total counts open accounts (hidden-for-new ones included) and open holdings at their latest value. Debts subtract, a credit card counts as a debt, a holding with no value yet adds nothing, closed items are left out.
- Hiding an item is a choice in the browser, never a setting on the item. A hidden item leaves the charts, the net worth and the group totals, and stays listed, marked (NW-05, ADR-058).
- The chart takes month ends, then today, each at its own date's rate. A month with no new value keeps the last one; a closed item keeps its closing month end (an account at its balance, a holding at 0). Pending transactions count.
- **Placed** is the money in (linked expenses at their own date's rate, external contributions, transfers in) and never goes down. **Withdrawn** is the money out (linked incomes, transfers out). **Profit** is the latest value plus withdrawn minus placed, and its percent is over placed. Both are empty, never zero, with no value, nothing placed or a missing rate.
- An investment's change over a range is its return: money put in or taken out is left out, weighted by time (ADR-062). On Tout every change is per year.
- A transaction links to a holding only when it is an expense or an income whose categories are all investments. A debt's value is typed positive; a debt payment does not link to it.
- A holding with a history (a linked transaction, a value, a contribution or a transfer) can only be archived, its currency is fixed, and it cannot close before its last entry. Two open holdings cannot share a name; unnamed ones never conflict.

## Filters and lists

- A transaction matches a filter when it matches any ticked value; a split matches on any of its categories. Ticking a category takes its whole branch. Transfers have no category or merchant, so those filters leave them out.
- With accounts ticked, each row is that account's own leg, so a transfer between two ticked accounts shows twice.
- Day nets are computed in SQL and count what is shown. Pages are about 150 rows and always whole days.
