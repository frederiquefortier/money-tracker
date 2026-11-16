# Net worth

**Status:** not built. Shared rules: [02-screens.md](02-screens.md). Decision: [ADR-046](../../01_building/decisions.md). The holdings subpage is [19-holdings.md](19-holdings.md).

## Purpose

One tab for what the user owns and owes. A hub shows the net worth and, below it, a card for each of two subpages: the accounts and the holdings. They stay separate pages because their rows, actions and grouping differ.

## Requirements

NW-10, ACC-06. The chart, its filters and the percent change (NW-04, NW-05) come in phase 5.

## The hub

Route `/net-worth`, the "Net worth" tab (the name stays English in both languages, like "Dashboard").

- A large total card: the net worth in the display currency, amount in Inconsolata.
- Under it, a slot kept for the phase 5 chart. Nothing is drawn there yet.
- Two link cards, side by side from `md` up and stacked on phones. Each has an icon bubble, a name, its total, one quiet line and a chevron. The whole card opens its subpage.
  - **Comptes** (Accounts): the sum of the open accounts' balances, and "n comptes".
  - **Avoirs** (Holdings): investments plus assets minus debts, and "n avoirs" (one count, every kind together, since 2026-11-13), then "Mis à jour le {date}" with the most recent value date, hidden on phones.

## What the total counts

- Open accounts, hidden ones included. A credit card is an account with a negative balance, so debts of that kind are already in the accounts card.
- Open holdings: investments and assets add, debts subtract, each at its latest value. Closed holdings are left out. Nothing else is: what a holding or an account leaves out is a choice in the phase 5 chart, never a setting that changes these totals (NW-05, ADR-048).
- The grand total is the accounts card plus the holdings card.
- A figure with a missing exchange rate is "—", never a partial sum (ADR-004). The grand total is "—" when either card is.
- No holding yet: the Avoirs card reads "Aucun avoir pour l'instant." with no amount and still opens the subpage. The grand total is the accounts card alone, with no warning.
- No value yet on a holding: it adds nothing, and does not set the "Mis à jour le" date.

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
