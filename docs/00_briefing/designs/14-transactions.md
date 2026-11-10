# Transactions

**Status:** reviewed 2026-11-03; aligned with the built screens 2026-11-03; built
2026-11-05, then reworked the same day after the author tried it, and the period and
filters redone for phones the same day (process.md): a list
over a chosen period, no tiles. Shared rules:
[02-screens.md](02-screens.md#shared-patterns).

## Purpose

The home tab and the screen used most: what came in and went out, day by day, over the
period chosen. It replaces scrolling the spreadsheet's ledger. It is a list: totals by
category and the month's spending belong to the dashboard (phase 4). Every amount reads
in the display currency, and it is always clear which ones were converted.

## Requirements

TRX-12 (search), TRX-13 (the period), TRX-14 (filters), TRX-04 (how a transfer reads), TRX-06 (several categories), TRX-09
(pending), TRX-10 (the note), CUR-06, 07, 09. The add button and the forms are spec 15
and 16.

## Layout

```
┌──────────────────────────────┐
│ [logo] MONEY TRACKER CAD▾ FR EN│
├──────────────────────────────┤
│ TRANSACTIONS                 │
│ [Rechercher               ]  │
│‹(▣ Novembre 2026▾)› (⧩ Filtres)│
│ LUNDI 3 NOVEMBRE    −96,40 $ │
│ ┌──────────────────────────┐ │
│ │(◉) IGA          −84,12 $ │ │
│ │    Épicerie · Chèque (Des…│ │
│ │(◉◉) Costco     −120,00 $ │ │
│ │    Épicerie, Maison · Visa│ │
│ │(◉) Café Olimpico −6,28 $ │ │
│ │    Café · Wise      4,20 €│ │
│ │(⇄) Transfert: Chèque      │ │
│ │    (Desjardins) → Épargne │ │
│ │                  500,00 $ │ │
│ └──────────────────────────┘ │
│ DIMANCHE 2 NOVEMBRE  ...     │
│            (more as you scroll)│
│                         (+)  │
├──────────────────────────────┤
│  Transactions Dashboard ...  │
└──────────────────────────────┘
```

From `md` up: the same list, centred, at most 48rem wide.

## Content and behaviour

### Period

- First in the row under the search, a bubble (`chip`) with the calendar icon: the
  month, the year, "Toutes les dates", or the two days ("1 oct. 2026 – 30 oct. 2026"),
  "Période: …" as its accessible name. For a month or a year, ‹ and › on either side
  step one back or forward; › stops at the current one. Tout by default.
- The bubble opens a popover: the four periods as the shared tabs (`TabList`: Tout,
  Année, Mois, Personnalisée), over the year grid (twelve years ending with the current
  one, filled column by column so they follow one another down each, arrows to earlier
  ones), the month grid (a year with arrows over its twelve months), or the date
  range field (ADR-027), whose calendar comes up from the bottom of the page, half its
  height, over a dim backdrop. Each tab is as wide as its label, so
  Personnalisée fits on a phone. Nothing after the current year, month or day can
  be picked, and the two days never cross. Tout applies and closes; a year or month
  applies and closes; Personnalisée applies at once on the last 30 days, the dates as
  they change.
- Every period loads a page at a time: about 150 transactions, always whole days, and
  the next page as the end of the list comes into view. Tout is the whole history this
  way.

### Search

- The shared `SearchField` under the title, looking within the period and the filters:
  "Rechercher" finds the text in anything a row shows (TRX-12): the merchant, the note,
  any of its categories, the account and its institution, and for a transfer either
  side. Case and accents are ignored; it runs once typing pauses.

### The row under the search

- One row, all bubbles the same height (`chip`): the period, then the filters. On
  phones, when the row runs out of room it scrolls sideways and fades at the right edge,
  so the list never moves down; from `md` up the bubbles wrap onto more lines (decided
  2026-11-05).
- On phones, one Filtres button with the filter icon, "Filtres · 3" and filled while
  any are in use, opens the sheet on Comptes.
- From `md` up, a button per filter instead, Comptes, Catégories, Magasins, each with a
  chevron. A filter's button names the one ticked ("Épicerie", the category's with its icon,
  "Chèque (Desjardins)"), or how many ("Catégories · 2"), and is filled while in use.
  It opens the filter sheet on that filter.

### Filters

- The sheet (from the right from `md` up, full screen on a phone), titled Filtres, has
  three tabs, Comptes, Catégories, Magasins, each with its count ("Catégories · 2"),
  and a search under them for the open tab only ("Rechercher une catégorie"). Both stay
  put while the list scrolls (TRX-14). Only the groups fold, each a card like an
  institution's on Comptes: its name folds it and shows how many are ticked inside, and
  "Tout" on its right ticks all of it ("Aucun" once it is).
  - **Comptes**: a card per institution with its accounts, closed ones too, all open
    while there are four institutions or fewer.
  - **Catégories**: a card per type (Dépenses, Revenus, Placements) with the whole tree
    inside, Dépenses open, archived categories too; sub-categories hang from their
    parent on the tree's line. Ticking a category takes its whole branch: its
    sub-categories show ticked and greyed. Unticking one of those keeps the rest of the
    branch ticked (the parent gives way to its other children). A parent with some
    ticked below it shows partly ticked.
  - **Magasins**: one card, the ticked ones first, then the eight most used, fifty more
    with each "Afficher plus"; the search reaches all of them, however many there are.
  - A search lists the matches flat in one card, accounts with their institution and
    categories by their full path.
- Every row is one tap target, 48px tall, the checkbox at its end.
- The footer: Effacer clears the open tab's ticks; "Voir 128 résultats" closes the
  sheet. The count is every row the period, the filters and the search match, all pages
  together; "Voir les résultats" while it loads, "Aucun résultat" at none.
- Each tick applies at once, the list updating behind the sheet. A transaction shows
  when it matches any ticked account, any ticked category and any ticked merchant; a
  split matches on any of its categories. Transfers have neither a category nor a
  merchant, so those filters leave them out. With accounts ticked, each row is that
  account's own leg, so a transfer between two ticked accounts shows both. Day nets
  count what is shown.
- The period, the filters and the search are in the address (`?period=year&year=2026`,
  `?category=[…]`, `?q=…`), so a form opened over the list closes back to them, and back
  and reload keep them.
- No account actions here: this is the transactions page, and an account's form is on
  Comptes. No side panel on desktop: the list stays one centred column, and the sheet is
  the one already used for forms. No sort: the day groups are the order.

### Day groups

- A header per day, newest first: the weekday and date ("Lundi 3 novembre"), and on the
  right the day's net (incomes minus expenses, as the rows show them) in the display
  currency: a minus when the day spent more, no plus and no converted marker.
- Inside a day: the last entered first. Transactions have no time (spec 15).

### Rows

- **Left:** the category's icon in its colour circle (spec 12). Several categories
  (TRX-06): every icon, stacked like avatars, the largest share first and on top.
- **Title:** the merchant, else the categories' names.
- **Second line, muted:** the categories (when the title is the merchant), the
  account, named with its institution as everywhere, and the note (TRX-10): "Épicerie ·
  Chèque (Desjardins) · Épicerie de la semaine", cut with an ellipsis when long.
- **Amount, right**, in Inconsolata at one size (larger than the title), in the display
  currency, with room before the row's actions. Expenses with a minus sign in the text colour; incomes with a
  plus in green (`--income`, `oklch(0.5 0.13 150)`: 5.4:1 on a card, 4.9:1 on the
  background). The error red stays off amounts, where it would read as "negative".
- **Converted** (CUR-09): when the transaction is not in the display currency, the
  amount as booked sits under it, muted and smaller ("4,20 €"); that line is the marker, with no ≈ and
  no underline. On hover and for screen readers: "4,20 € converti au taux du 3 nov. 2026
  (1 EUR = 1,4952 CAD)", the rate written as on the transaction form. A tap opens the
  row, whose form shows the rate.
- **Pending** (TRX-09): the row on a light blue background, the spreadsheet's colour
  (`--pending`), with no label: the colour and the bubble say it, and screen readers
  hear "En attente" (hidden text). It stays in its day, so the day's net
  still matches its rows. While anything is pending, a blue "3 en attente" bubble starts
  the row of controls; pressed, the list keeps only what is pending, at any date, and
  choosing a period lets go of it. The count follows the filters and the search, not the
  period. **Owed** works the same way (spec 20): an amber "2 me doivent" bubble after
  it while some expense has a Me doit line, keeping only those when pressed.
- **Transfer** (TRX-04): a transfer icon, the title "Transfert: Chèque (Desjardins) →
  Épargne", the amount neutral (no sign). One row per transfer, even though it is two
  legs. "En attente" shows while either side is pending (spec 16). Between two
  currencies, what arrived sits under the amount, muted, after the title's arrow
  ("→ 60,00 €"), below the amount as booked when that is converted too.
- **Fees** (TRX-04, 11, CUR-08), drawn apart from those amounts: under the row, inside
  the same row, after the receipt's dashed rule under the amounts (as wide as their
  column), one tight line per fee, joined to the row's icon by the category tree's
  elbow line. Each has the fee category's icon (marked in Catégories) at a smaller size, its
  name, "Frais de conversion" (lost to the exchange, in the departure or account
  currency) or "Frais de transaction" (a transfer's fee, which still counts in the day's
  net), and its amount on the right, under the row's own. Both read unsigned, as costs;
  a gain on the exchange, rare, shows as a negative fee.
```
│ (⇄) Transfert: Chèque → Wise    100,00 $ │
│  │  Note du transfert       → 62,00 CHF │
│  │                          - - - - - - │
│  ├─(•) Frais de conversion       2,00 $ │
│  └─(•) Frais de transaction      2,50 $ │
``` The second line on the left keeps only the note. The fee has its own row only when filtering on
  categories, where the transfer itself never shows; it reads "Frais du transfert:
  Chèque (Desjardins) → Épargne". In an account-filtered list, the row shows that
  account's leg with its sign, and the departure leg keeps the money parts.
- **Paid in another currency** (CUR-08): a "Frais de conversion" fee line, what the
  purchase cost above the market value, in the account's currency.
- **Adjustment** (TRX-03): a scale icon, "Ajustement de solde", the account on the
  second line, the signed difference.
- Tapping a row opens it in its form (spec 15 or 16), a route sheet over the list. A
  transfer's fee opens the transfer; an adjustment opens
  `/transactions/adjustments/{id}`.
- From `md` up, an expense, an income, a transfer or an adjustment has the trash in its row's action
  slot; on phones it is in the sheet header (shared patterns). A transfer's fee has none:
  it goes with its transfer.

## States

- **Empty:** "Aucune transaction en novembre 2026.", "… en 2026.", "Aucune transaction
  du 1 oct. 2026 au 30 oct. 2026." or, for Tout, "Aucune transaction pour l'instant."
  With a search or a filter, "Aucun résultat." Adding is the round
  button. "Importer un historique", while there are no transactions at all, comes with
  spec 18.
- **Missing rate** (ADR-004): the amount shows "Taux manquant" with an error icon,
  never zero, and the day net that includes it shows the same error.
- **Loading:** the first page renders on the server. Changing the period shows the
  previous one until the next arrives, with the tabs and the period's bubble disabled.
  The filter sheet's lists load the first time it opens. Older pages show "Chargement…"
  at the end while they load; a failure is a toast.

## Data

- Reads: one server function, `listTransactions({ from, to, accountIds?, categoryIds?,
  merchantIds?, search?, before? })`,
  over the SQL function `list_transactions` (database.md), returning whole days of rows
  with their day nets, already converted in SQL to the display currency (amounts as
  strings, ADR-004), the day the next page starts before, and the names of the filters
  in use for their bubbles. Conversion uses the rate on each transaction's date (CUR-07).
- Day nets are computed in SQL, never summed in the browser.
- Transfers come back as one row per `transfer_id`.

## Copy

| Key | Français |
|---|---|
| Period | Tabs Tout, Année, Mois, Personnalisée; Toutes les dates; Période: {period}; Du, Au; Mois précédent, Mois suivant |
| Filters | Filtres, Filtres · {count}, Comptes, Catégories, Magasins, {name} · {count}; Rechercher un compte, une catégorie, un magasin; Tout, Aucun, Tout cocher dans “{name}”, Tout décocher dans “{name}”; Effacer, Voir {count} résultat(s), Voir les résultats, Aucun résultat |
| Converted detail | {original} converti au taux du {date} ({rate}) |
| Pending | En attente, {count} en attente |
| Owed | {count} me doit / me doivent; Quelqu'un me doit sa part (screen readers) |
| Fee lines | Frais de conversion, Frais de transaction |
| Transfer fee | Frais du transfert: {from} → {to} |
| Transfer | Transfert: {from} → {to} |
| Adjustment | Ajustement de solde |
| Empty | Aucune transaction en {period}. Aucune transaction du {start} au {end}. Aucune transaction pour l'instant. Aucun résultat. |
| Actions | Importer un historique |
| Missing rate | Taux manquant |
| Grids | Année précédente, Année suivante, Années précédentes, Années suivantes |
