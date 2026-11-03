# Transaction form

**Status:** reviewed 2026-11-03; aligned with the built screens 2026-11-03. Shared rules:
[02-screens.md](02-screens.md#shared-patterns).

## Purpose

Adding an expense or an income has to be fast enough to do at the till: amount, then a
tap or two. The same form edits a transaction later, splits it across categories, and
records a foreign-currency payment with its real cost.

## Requirements

TRX-01, 02, 05, 06, 09, 10, CUR-08, CAT-04, 06 (the category picker, below), MER-01
(through the merchant picker, spec 13). Transfers and adjustments are spec 16.

## The add button

- A round button with a plus, bottom right, above the tab bar on phones, in the primary
  colour with a white icon. On `md` and up it sits bottom right of the content.
- It shows on the Transactions tab only.
- It opens a new expense in a route sheet over the list (`/transactions/new`), so the back
  button and a reload work.

## Layout

```
┌──────────────────────────────┐
│ NOUVELLE TRANSACTION       ✕ │
│ [Dépense][Revenu][Transfert] │
│                              │
│        84,12   [CAD ▾]       │
│                              │
│ Compte *     [Chèque       ▾]│
│ Date *       [2026-11-03    ]│
│              Aujourd'hui Hier│
│ Heure        [              ]│
│ Marchand     [IGA          ✕]│
│ Catégorie *  [(◉) Épicerie ✕]│
│              Répartir        │
│ Note         [              ]│
│ ☐ En attente                 │
│          Annuler  Enregistrer│
└──────────────────────────────┘
```

The shared sheet: full screen on a phone, a panel from the right from `md` up. The fields
are the shared ones, in this order.

## Content and behaviour

### Kind

- Three tabs: Dépense (default), Revenu, Transfert, the same tab list as Catégories.
  Transfert switches to the transfer form (spec 16), keeping the amount, account and date.
- The amount is always typed positive; the kind gives the sign.

### Amount and currency (TRX-02, CUR-08)

- The amount is large, in Inconsolata, focused on open with the decimal keypad
  (`inputmode="decimal"`). It accepts the locale's separator: `84,12` in French, `84.12`
  in English.
- The currency chip is prefilled with the account's currency and follows it when the
  account changes. Its menu lists the user's currencies, favourites first (CUR-03).
- **Foreign currency:** choosing a currency other than the account's turns the amount
  into the original price, and two fields appear under it, joined by a line down their
  left side (`LinkedFields`):

  ```
          15,00 € [EUR ▾]
    │ Payé      [ 22,54 $ ]
    │ Frais     0,11 $ (0,5 %)
    │           1 € = 1,4952 $ au 3 nov. 2026
  ```

  - **Payé** is in the account's currency, prefilled with the original price at that
    day's rate, and editable: type what the statement shows.
  - **Frais** is read-only: what was paid minus the market value (CUR-08), with the rate
    used. Negative fees show as they are; a missing rate shows "Taux manquant" and no fee
    (ADR-004).
  - The transaction is booked in the account's currency (`amount`), the original kept
    beside it (`original_amount`, `original_currency`).

### Details

- **Compte**: open accounts not hidden from new transactions (ACC-03, 04). Prefilled with
  the account last used (remembered per browser). A list filtered to one account
  prefills that account.
- **Date** (TRX-01): today by default, "Aujourd'hui" and "Hier" as shortcuts beside the
  field. **Heure**: optional.
- **Marchand** (TRX-05): the merchant picker (spec 13). Choosing one fills the category
  from its default (MER-01) unless a category was already chosen by hand.
- **Catégorie**: the category picker, below.
- **Note** (TRX-10): free text, one line that grows.
- **En attente** (TRX-09): a checkbox, off by default (cleared).

### Category picker (CAT-04, 06)

The shared `Combobox`, as for the parent on the category form, with two additions to the
shared component (no second picker): options in labelled groups, and an action button at
the end of an option.

```
│ Catégorie *  [resto            ✕]│
│ FAVORIS                          │
│ (◉) Alimentation > Restaurants ★ │
│ DÉPENSES                         │
│ (◉) Alimentation               ☆ │
│ (◉) Alimentation > Épicerie    ☆ │
│ REVENUS                          │
│ (◉) Salaire                    ☆ │
```

- **Favoris** first (CAT-06), each as its full path, with a filled star. They are not
  repeated in the groups below.
- Then one group per type, the transaction's own type first, each category by its full
  path with its icon.
- The star on every option toggles favourite in place (CAT-06); the option moves to or
  from Favoris once the list closes, so it does not jump under the finger.
- Typing matches any part of the path.
- **Archived categories never appear** (CAT-04), as of the transaction's date: a category
  archived in March still appears for a February transaction.
- **Editing an old transaction** whose category is archived: the field shows it with an
  "Archivée" tag, and the list opens without it, so it can be changed (CAT-04).
- Parents are selectable too: spending can sit on "Alimentation" itself.
- **No category yet:** "Créer « {texte} »" creates a top-level category of the
  transaction's type, with a suggested icon and colour (spec 12).

### Splits (TRX-06)

"Répartir" under the category replaces the single category with lines:

```
  Répartir par  [Montant][Parts][%]
  [(◉) Épicerie     ✕] [ 60,00 ]
  [(◉) Maison       ✕] [ 24,12 ]
  + Ajouter une catégorie
  Reste à répartir    0,00 $
```

- One mode for the whole transaction: Montant, Parts or Pourcentage.
- **Montant:** each line in the transaction's currency; "Reste à répartir" must reach
  zero to save.
- **Parts** (1, 2, 1) and **Pourcentage** (must total 100): the amounts are computed, and
  the last line takes the rounding cent, so the lines always sum exactly to the total.
- Each line's computed amount shows muted beside its input in Parts and % mode.
- Clearing lines down to one returns to the single category field.
- Previews in the browser use integer minor units (ADR-004); the server recomputes and
  the database checks the sum (database.md, deferred constraint).

### Edit

- Tapping a row in the list opens the same sheet, titled "Modifier la transaction". It
  only edits.
- A transaction from an import shows "Importée le {date}" in the sheet's header; editing
  it is allowed.

### Saving

- Enregistrer validates (SET-07): an amount above zero, an account, a category or
  complete splits, a date. Errors show under each field; values are kept.
- Saved through one server function, `saveTransaction`, which calls the SQL function
  `save_transaction` so the transaction and its splits are written together (ADR-012).
- Saving closes the sheet with a toast, "Transaction ajoutée." or "Transaction
  enregistrée.", and the list shows the transaction's month, the row briefly highlighted.

## States

- **No account yet:** the sheet says "Aucun compte pour l'instant." with a link to Comptes.
- **Save fails:** values kept, the error above the sheet's buttons.
- **Leaving with changes:** "Abandonner les modifications?" before the sheet closes. This
  goes in `RouteSheet`, so every form gets it.

## Data

- Reads: open accounts, the user's currencies, the category and merchant pickers' data,
  the rate for (original currency, account currency, date) for the prefill and the fee.
- Writes: `saveTransaction`, `deleteTransaction`, `setCategoryFavourite` (spec 12). The
  fee is never stored; it is computed from the rate (database.md, Foreign currency).

## Copy

| Key | Français |
|---|---|
| Titles | Nouvelle transaction, Modifier la transaction |
| Kinds | Dépense, Revenu, Transfert |
| Fields | Compte, Date, Heure, Marchand, Catégorie, Note, En attente |
| Date shortcuts | Aujourd'hui, Hier |
| Foreign | Payé, Frais, 1 {from} = {rate} {to} au {date} |
| Picker | Favoris, Archivée, Retirer la catégorie, Créer « {text} » |
| Splits | Répartir, Répartir par, Montant, Parts, %, Ajouter une catégorie, Reste à répartir |
| Imported | Importée le {date} |
| Delete | Supprimer la transaction, Cette action est irréversible. |
| No account | Aucun compte pour l'instant. |
| Discard | Abandonner les modifications?, Abandonner |
| Actions | Annuler, Enregistrer |
| Saved | Transaction ajoutée., Transaction enregistrée. |

## Open questions

- **Where delete lives.** The rule is a trash on the row. On the transactions list a
  trash on every row takes width from the amount on a phone. Options: the trash on each
  row like elsewhere; a trash in the sheet's header, the one exception to "the sheet only
  edits"; or a swipe on the row.
- **Several receipts in a row.** "Enregistrer et ajouter" was dropped on accounts and
  categories. At the till, the round button reopens the form in one tap; if that is too
  slow in use, this is where it would come back.
