# Transactions

**Status:** reviewed 2026-11-03; aligned with the built screens 2026-11-03. Shared rules:
[02-screens.md](02-screens.md#shared-patterns).

## Purpose

The home tab and the screen used most: what came in and went out, day by day, for one
month at a time. It replaces scrolling the spreadsheet's ledger. Every amount reads in the
display currency, and it is always clear which ones were converted.

## Requirements

TRX-04 (how a transfer reads), TRX-09 (pending), CUR-06, 07, 09. The add button and the
forms are spec 15 and 16; filters, stats and text search (TRX-12) come in phase 2.

## Layout

```
┌──────────────────────────────┐
│ [logo] MONEY TRACKER CAD▾ FR EN│
├──────────────────────────────┤
│   ‹   NOVEMBRE 2026   ›      │
│ ┌─────────────┐┌───────────┐ │
│ │ DÉPENSES    ││ REVENUS   │ │
│ │ 1 286,84 $  ││ 3 400,00 $│ │
│ └─────────────┘└───────────┘ │
│ LUNDI 3 NOVEMBRE    −96,40 $ │
│ ┌──────────────────────────┐ │
│ │(◉) IGA          −84,12 $ │ │
│ │    Épicerie · Chèque      │ │
│ │(◉) Café Olimpico ≈−6,28 $│ │
│ │    Café · Wise EUR  4,20 €│ │
│ │(⇄) Transfert: Chèque →    │ │
│ │    Épargne       500,00 $ │ │
│ └──────────────────────────┘ │
│ DIMANCHE 2 NOVEMBRE  ...     │
│                         (+)  │
├──────────────────────────────┤
│  Transactions Dashboard ...  │
└──────────────────────────────┘
```

From `md` up: the same list, centred, at most 48rem wide; the tiles sit side by side
above it.

## Content and behaviour

### Month

- "‹ Novembre 2026 ›" at the top: the arrows step one month; tapping the label opens a
  month and year picker. The current month by default; the last one viewed is kept for
  the session.
- Filtered to one account when opened from the accounts screen (spec 11): a chip under
  the month, "Chèque ✕", removes the filter. The header then carries the account's icon
  actions: a pencil (the account form) and "Ajuster le solde" (spec 16).

### Tiles

- Two tiles: Dépenses and Revenus for the month, in the display currency. Transfers and
  adjustments count in neither.
- A refund (an income on an expense category) lowers Dépenses instead of raising
  Revenus, so the tile matches what the category charts will show (database.md).
- If any amount in a tile was converted, the tile total carries the converted marker and
  "Inclut des montants convertis" on tap (CUR-09).

### Day groups

- A header per day, newest first: the weekday and date ("Lundi 3 novembre"), and on the
  right the day's net (incomes minus expenses) in the display currency.
- Inside a day: the last entered first. Transactions have no time (spec 15).

### Rows

- **Left:** the category's icon in its colour circle (spec 12). Several categories
  (TRX-06): a split icon, neutral.
- **Title:** the merchant, else the note, else the category name.
- **Second line, muted:** the category (or "3 catégories") and the account.
- **Amount, right**, in Inconsolata with the cents set smaller (layout reference), in the
  display currency. Expenses with a minus sign in the text colour; incomes with a plus in
  green (`--income`, `oklch(0.5 0.13 150)`: 5.4:1 on a card, 4.9:1 on the background).
  The error red stays off amounts, where it would read as "negative".
- **Converted** (CUR-09): when the transaction is not in the display currency, the amount
  starts with `≈` and has a dotted underline; under it, muted, the amount as booked
  ("4,20 €"). Tap or hover: "4,20 € converti au taux du 3 nov. 2026 (1 € = 1,4952 $)".
  Native amounts show plain, no marker.
- **Pending** (TRX-09): a small "En attente" label with a clock icon after the second
  line. The amount counts in the tiles like any other.
- **Transfer** (TRX-04): a transfer icon, the title "Transfert: Chèque → Épargne", the
  amount neutral (no sign). One row per transfer, even though it is two legs. "En
  attente" shows while either side is pending (spec 16). A fee shows
  as its own expense row, right under it. In an account-filtered list, the row shows that
  account's leg with its sign.
- **Adjustment** (TRX-03): a scale icon, "Ajustement de solde", the signed difference.
- Tapping a row opens it in its form (spec 15 or 16), a route sheet over the list.

## States

- **Empty month:** "Aucune transaction en novembre 2026." and, while there are no
  transactions at all, "Importer un historique" (spec 18). Adding is the round button.
- **Missing rate** (ADR-004): the amount shows "Taux manquant" with an error icon,
  never zero, and every total that includes it shows the same error.
- **Loading:** the month renders on the server. Stepping months shows the previous month
  until the next one arrives, with the arrows disabled.

## Data

- Reads: one server function, `listTransactions({ month, accountId? })`, returning the
  rows, the day totals and the tile totals, already converted in SQL to the display
  currency (amounts as strings, ADR-004). Conversion uses the rate on each transaction's
  date (CUR-07).
- Day and tile totals are computed in SQL, never summed in the browser.
- Transfers come back as one row per `transfer_id`.

## Copy

| Key | Français |
|---|---|
| Tiles | Dépenses, Revenus |
| Converted total | Inclut des montants convertis |
| Converted detail | {original} converti au taux du {date} ({rate}) |
| Several categories | {count} catégories |
| Pending | En attente |
| Transfer | Transfert: {from} → {to} |
| Adjustment | Ajustement de solde |
| Empty | Aucune transaction en {month}. |
| Actions | Importer un historique, Ajuster le solde |
| Missing rate | Taux manquant |
