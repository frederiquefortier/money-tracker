# Net worth

**Status:** built. Shared rules: [02-screens.md](02-screens.md). Decision: [ADR-046](../../01_building/decisions.md). The holdings subpage is [19-holdings.md](19-holdings.md).

## Purpose

One tab for what the user owns and owes. A hub shows the net worth and, below it, a card for each of two subpages: the accounts and the holdings. They stay separate pages because their rows, actions and grouping differ.

## Requirements

NW-10, ACC-06, and the chart with what it leaves out and its change (NW-04, NW-05).

## The hub

Route `/net-worth`, the "Net worth" tab (the name stays English in both languages, like "Dashboard").

Two columns from `lg` up, on a twelve-column grid: on the left (eight columns) the net worth card, then the item list; on the right a sticky sidebar (four columns), the composition card with the two link cards directly under it. On phones: the net worth card, the composition, the link cards (side by side at `md`), then the item list. Beside the page title, an eye opens the list of items to hide (see Hidden items).

- **Net worth card**: "Patrimoine", the net worth, large (amount in Inconsolata), without the hidden items and with no complete figure under it (ADR-059); then its change over the range, "▲ 1 200 $ (4,0 %) sur 1 an". On Tout every change on the page is per year, from each figure's first value: the amount divided by the years and the percent compounded, "▲ 1 000 $ (5,0 %) par an depuis 2015" ("/an" in the item list); no percent when either end is zero or negative, and the plain change under a year of history (author, 2026-11-17). Then the range tabs and the two charts (see The charts). The range is the page's one period: what the charts draw and what every change is measured over (author, 2026-11-17).
- **Composition card**: Actifs and Dettes, each with its figure (at the transaction amount size, as the link cards' totals; changes and group amounts one size smaller) and its change over the range (as the spreadsheet's three cards, the net worth being the third), and a bar on one scale for both, so the share owed reads at a glance. The assets bar is split by group (Comptes, Placements, Autres actifs) with each group's amount under it. Debts read as the amount owed, positive, in red. A change is an arrow for its direction (▲ ▼) and an unsigned amount and percent, green when good (net worth or assets up, debts down), red when bad.
- **Link cards**: each has an icon bubble, a name, its total, one quiet line and a chevron. The whole card opens its subpage. They always count everything open.
  - **Comptes** (Accounts): the sum of the open accounts' balances, and "n comptes".
  - **Avoirs** (Holdings): investments plus assets minus debts, and "n avoirs" (one count, every kind together, since 2026-11-13). No update date (removed 2026-11-17).

## What the total counts

- Open accounts, hidden ones included. A credit card is an account with a negative balance, so debts of that kind are already in the accounts card.
- Open holdings: investments and assets add, debts subtract, each at its latest value. Closed holdings are left out. Hiding an item is a choice in the browser, never a setting on the item; it changes the sidebar's figures, not the link cards (NW-05, ADR-058).
- The grand total is the accounts card plus the holdings card.
- A figure with a missing exchange rate is "—", never a partial sum (ADR-004). The grand total is "—" when either card is.
- No holding yet: the Avoirs card reads "Aucun avoir pour l'instant." with no amount and still opens the subpage. The grand total is the accounts card alone, with no warning.
- No value yet on a holding: it adds nothing.

## The charts

In the net worth card (NW-04, ADR-057).

- One point per month end, then today. A month with no new holding value keeps the last value. Each point is converted at its own date's rate; a point with a missing rate leaves a gap. A closed item keeps the month end of its closing: an account at its balance (0 after its last transfer out), a holding at 0. A credit card counts as a debt (author, 2026-11-17).
- The range is a row of tabs: 1M, 3M, 6M, 1A, 3A, 5A, 10A, Tout (1Y … All in English), full names for screen readers. It runs from the month end N months back to today, so its first point is the base of every change. Tout is the default and starts at the first account, holding, transaction or value. Remembered per browser; a stored 7 ans falls back to Tout.
- **The net worth line**: the net worth alone, with a light fill, on its own scale so its slope fills the chart. Four to six gridlines on a round step (1, 2, 2.5 or 5 times a power of ten), held to the figures, 0 only when the figures reach it. A tooltip gives the month (or today) and the figure. Over a year and a half of points the axis names years, under it months.
- **What moved it**: "Variation par année" (or "par mois" up to a year and a half of points), a bar per period split by group, gains above 0 and losses below, with a dot at the net change. Each period runs from the end of the one before; the first starts at the range's first point, and the current year is to date. A debt paid down is a gain, a new debt a loss. A legend of dots and names, with "Variation nette" for the dot; the tooltip gives each group's change, signed, and the net.
- Pending transactions count, so today's point is the total when nothing is hidden.
- No account and no holding: the card shows only the net worth. A group that is zero over the whole history is not drawn and has no legend entry.

## The item list

Under the net worth card, as the spreadsheet's table, in the transactions' look (2026-11-17): groups Comptes, Placements, Autres actifs, Dettes, each header above its own card (the shared group header) with its colour's dot and its total today (debts owed). Each row: the item's name, a sparkline over the range in its group's colour (its own scale; hidden on phones so the name has room), its value at the transaction amount size in a column of one width, so the sparklines line up (a debt as owed), its change in percent over the range with an arrow ("—" when it has none: new in the range, or from 0), and a chevron. A row opens its own chart under it, as the net worth line but at the item's scale; several can be open. Only items with a figure in the range are listed.

## Hidden items

The eye beside the page title (an IconButton; eye-off while some are hidden) opens "Masquer des éléments", a sheet of the accounts and holdings, ticked when hidden, grouped by institution as on their pages, with Tout or Aucun on each group and the archived ones in their own group, last. A hidden item leaves the charts, the net worth and composition figures and the item list (NW-05, ADR-058). The import's placeholder account (rows from before the accounts were tracked, ADR-034) has a made-up past balance; the author hides it.

## The subpages

- `/net-worth/accounts`: the accounts page as built (ACC-06, ACC-07), except that it groups only institutions with an open account, and institutions are managed in Réglages ([21-institutions.md](21-institutions.md)). `/net-worth/holdings`: [19-holdings.md](19-holdings.md).
- Each has a link above its title, "‹ Net worth", back to the hub. The tab also goes to the hub and stays active on all three paths.
- Neither shows a total of its own in the title; the totals are on the hub cards. Each institution's drawer shows its own total, at the size of a transaction's amount.
- Each keeps its single round + bottom right, and its sheets keep their own URLs below the page (`/net-worth/accounts/new`, `/net-worth/holdings/$holdingId`).

## Edge cases

- Changing the display currency in Réglages changes every figure on the hub.
- A currency with no rate empties only the cards that hold it; the other card still shows.
- A failed load shows the error card with Réessayer.

## Open questions for the author

None.
