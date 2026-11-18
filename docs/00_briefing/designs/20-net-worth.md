# Net worth

**Status:** built. Shared rules: [02-screens.md](02-screens.md). Decisions: [ADR-046, ADR-060 and ADR-061](../../01_building/decisions.md). The holding's sheets are in [19-holdings.md](19-holdings.md).

## Purpose

One tab for what the user owns and owes, on one page: the net worth, its history, and every account and holding with their actions. The accounts and holdings subpages were merged into it on 2026-11-17 (ADR-061): the hub already listed every item with its form a tap away, so the subpages were a second list of the same things.

## Requirements

NW-10, ACC-06, ACC-07, NW-03 (the holding's figures on its row), and the chart with what it leaves out and its change (NW-04, NW-05).

## The page

Route `/net-worth`, the "Net worth" tab (the name stays English in both languages, like "Dashboard"). The forms open as sheets over it, under `/net-worth/accounts/…` and `/net-worth/holdings/…`; `/net-worth/accounts` and `/net-worth/holdings` alone redirect to the hub.

Each control sits with what it acts on: nothing beside the title but, when investment transactions name no holding, the orange "n transactions sans avoir" tag that opens the transactions on the investment categories; the eye in the net worth card; expand all, the grouping and the sort over the list, on the tabs' row from `xl` (author, 2026-11-18). The round + bottom right offers Ajouter un compte, Ajouter un avoir and Ajuster un solde.

The range tabs first, across the page, since every figure below is measured over them. From `xl` up, two halves side by side: the net worth card on the left, the list on the right (author, 2026-11-18). Narrower, one column at the width of every list page (48rem): the net worth card, the list's controls, the list.

- **Net worth card**: the net worth, large (amount in Inconsolata), with no label (the page title names it), without the hidden items and with no complete figure under it (ADR-059); then its change over the range, "▲ 1 200 $ (4,0 %) sur 1 an". On Tout every change on the page is per year, from each figure's first value: the amount divided by the years and the percent compounded, "▲ 1 000 $ (5,0 %) par an depuis 2015" ("/an" in the list); no percent when either end is zero or negative, and the plain change under a year of history (author, 2026-11-17). At its top right the eye (see Hidden items). Then the two charts (see The charts). The range is the page's one period: what the charts draw and what every change is measured over (author, 2026-11-17).
- **No composition card, no assets or debts figures** (author, 2026-11-18): the card's bars and group amounts repeated the list's group totals, and the Actifs and Dettes figures that replaced it for a moment went too. Debts read as the amount owed, positive, in red; 0 is plain; a card in credit reads "+50,00 $" in green, since that money is the user's (author, 2026-11-18). This holds on a debt's row and the Dettes total. A change is an arrow for its direction (▲ ▼) and an unsigned amount and percent, green when good (net worth or assets up, debts down), red when bad.

## What the total counts

- Open accounts, hidden-for-new ones included. A credit card is an account with a negative balance; the hub counts it as a debt.
- Open holdings: investments and assets add, debts subtract, each at its latest value. Closed items are left out. Hiding an item is a choice in the browser, never a setting on the item (NW-05, ADR-058).
- A figure with a missing exchange rate is a dash, never a partial sum (ADR-004).
- No value yet on a holding: it adds nothing.

## The charts

In the net worth card (NW-04, ADR-057).

- One point per month end, then today. A month with no new holding value keeps the last value. Each point is converted at its own date's rate; a point with a missing rate leaves a gap. A closed item keeps the month end of its closing: an account at its balance (0 after its last transfer out), a holding at 0. A credit card counts as a debt (author, 2026-11-17).
- The range is a row of tabs: 1M, 3M, 6M, 1A, 3A, 5A, 10A, Tout (1Y … All in English), full names for screen readers. It runs from the month end N months back to today, so its first point is the base of every change. Tout is the default and starts at the first account, holding, transaction or value. Remembered per browser; a stored 7 ans falls back to Tout.
- **The net worth line**: the net worth alone, with a light fill, on its own scale so its slope fills the chart. Four to six gridlines on a round step (1, 2, 2.5 or 5 times a power of ten), held to the figures, 0 only when the figures reach it. A tooltip gives the month (or today) and the figure. Over a year and a half of points the axis names years, under it months.
- **What moved it**: "Variation par année" (or "par mois" up to a year and a half of points), a bar per period split by group, gains above 0 and losses below, with a dot at the net change. Each period runs from the end of the one before; the first starts at the range's first point, and the current year is to date. A debt paid down is a gain, a new debt a loss. No legend (author, 2026-11-18): the colours are the list's groups, and the tooltip names each group with its change, signed, and the net.
- Pending transactions count, so today's point is the total when nothing is hidden.
- No account and no holding: the card shows only the net worth. A group that is zero over the whole history is not drawn.

## The list

Every open account and holding, as the spreadsheet's table. Each group is a card with its header inside, as the accounts and holdings pages had it (author, 2026-11-18; it followed the transactions' day headers for a day): the bold name folds the rows, and what the group adds to the net worth today, without the hidden items, sits at the far right.

- **Par type** (the default): Comptes, Placements, Autres actifs, Dettes, each with its colour's dot; the Dettes total reads as owed, in red. Items are named with their institution.
- **Par institution**: A to Z, then "Sans institution", for the monthly round of updating values bank by bank (author, 2026-11-17). The total nets debts. The institution's website, when it has one, is an icon after its name. Items are named without the institution, since the group says it.
- The choice and the sort (name, type, currency, value ascending, value descending; ACC-07) are remembered per browser. Values sort in the display currency, a debt below zero since it subtracts, a missing rate last.

Each row: the name, with a `circle-slash` when the account is hidden from new transactions and an `eye-off` when it is hidden from the net worth; under it the type and currency, then what is pending on an account ("dont 120 $ en attente") or what a holding other than an investment had withdrawn (ADR-062). On the right the sparkline over the range in the group's colour, a button just its size that opens the item's chart under the row at its own scale (author, 2026-11-18, replacing a chevron), an investment's with Placé, Retiré (above 0) and Profit total in amount and percent over it, aligned right, since it opened whatever the range; the value in the item's own currency at the transaction amount size, 0 when it has none yet (a debt as owed, in red unless 0), over its change in percent over the range (a dash when it has none), on an investment its return: the change less the money put in and plus the money taken out, over the money that was in, weighted by time (ADR-062, author 2026-11-18); then a ⋮ at every width whose menu holds the item's actions: Valeurs, Contributions externes and Transferts on a holding, then Archiver (or Réactiver) and Supprimer, muted when it cannot apply (author, 2026-11-18; five icons per holding crowded the row). The rest of the row opens the item's form (its link covers the row, the line's button sits over it). A hidden item stays listed, marked, and leaves the totals.

Archived accounts and holdings sit in one collapsed "Archivés (n)" toggle after the group cards, muted, as the same rows (author, 2026-11-18): the line and its chart over the item's whole history whatever the range, an investment's Placé, Retiré and Profit total over it, the closing date in place of the value and change (the line ends at 0, so a change would only read the closing), and the same ⋮. No account and no holding: "Aucun compte ni avoir pour l'instant."

## Hidden items

The eye in the net worth card (an IconButton; eye-off while some are hidden) opens "Masquer des éléments", a sheet of the accounts and holdings, ticked when hidden, in the list's type groups (Comptes, Placements, Autres actifs, Dettes), each named with its institution, with Tout or Aucun on each group and the archived ones in their own group, last. A hidden item leaves the charts, the net worth and the group totals (NW-05, ADR-058). The import's placeholder account (rows from before the accounts were tracked, ADR-034) has a made-up past balance; the author hides it.

## Edge cases

- Changing the display currency in Réglages changes every figure on the hub.
- A currency with no rate empties the figures that hold it: the net worth and its group's total. The rows keep their own-currency values.
- A failed load shows the error card with Réessayer.

## Open questions for the author

None.
