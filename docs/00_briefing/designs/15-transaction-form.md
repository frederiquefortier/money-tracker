# Transaction form

**Status:** built 2026-11-04, tried in local dev once the list (spec 14) can open an
edit. Shared rules:
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
  button and a reload work. The Transactions tab lives at `/transactions`; `/` leads
  there.

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
  Until spec 16 is built, Transfert is muted and a tap says "Les transferts arrivent avec
  le prochain écran.".
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
  field. No time: a transaction has a calendar date only, stored as a `date`, read and
  shown without a time zone, so 17.08.2026 is 17.08.2026 on every screen (decided
  2026-11-04).
- **Marchand** (TRX-05): the merchant picker (spec 13). Choosing one fills the category
  from its default (MER-01) unless a category was already chosen by hand.
- **Catégorie**: the category picker, below.
- **Note** (TRX-10): free text, one line that grows.
- **En attente** (TRX-09): a checkbox, off by default (cleared).

### Category picker (CAT-04, 06)

`CategoryPicker` (built with spec 13, first used for a merchant's default category): the
shared `Combobox` with labelled groups (no second picker). It takes the transaction's type
and date.

```
│ Catégorie *  [                 ▾]│
│ FRÉQUENTES                       │
│ (◉) Alimentation > Épicerie      │
│ (◉) Transport > Essence          │
│ DÉPENSES                         │
│ (◉) Alimentation                 │
│ ├─ (◉) Épicerie                  │
│ └─ (◉) Restaurants               │
│ REVENUS                          │
│ (◉) Salaire                      │
```

- **Fréquentes** first (CAT-06), built with this form: the five categories of the
  transaction's type used most over the last 90 days, by count, each as its full path.
  Worked out from the transactions, nothing to keep up by hand. Hidden until there are
  transactions, and while typing. A frequent category also keeps its place in its tree
  below, so no branch loses its parent.
- Then one group per type, the transaction's own type first, each drawn as the
  Catégories tree: elbow connectors, the icon and the name. The field shows the full
  path once chosen.
- Typing matches names; each match keeps its parents, so its place in the tree shows.
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
- **Parts** (1, 2, 1) and **Pourcentage** (must total 100, and never more: a value above
  what the other lines leave is cut to it as it is typed): the amounts are computed, and
  the last line takes the rounding cent, so the lines always sum exactly to the total.
- Each line's computed amount shows muted beside its input in Parts and % mode.
- Clearing lines down to one returns to the single category field.
- Previews in the browser use integer minor units (ADR-004); the server recomputes and
  the database checks the sum (database.md, deferred constraint).

### Edit

- Tapping a row in the list opens the same sheet, titled "Modifier la transaction"
  (`/transactions/{id}`). Its body only edits.
- **Delete** follows the shared row actions: a trash on the row from `md` up, in the
  sheet's header on phones, where rows keep their width for the amount (decided
  2026-11-04, process.md).
- A transaction from an import shows "Importée le {date}" in the sheet's header; editing
  it is allowed.

### Saving

- Enregistrer validates (SET-07): an amount above zero, an account, a category or
  complete splits, a date. Errors show under each field; values are kept.
- Saved through one server function, `saveTransaction`, which calls the SQL function
  `save_transaction` so the transaction and its splits are written together (ADR-012).
- Saving closes the sheet with a toast, "Transaction ajoutée." or "Transaction
  enregistrée.", and the list shows the transaction's month, the row briefly highlighted
  (with spec 14).
- Validation messages: "Répartissez tout le montant." (Montant lines short of the total),
  "Les pourcentages doivent totaliser 100.", "Chaque catégorie une seule fois.".

## States

- **No account yet:** the sheet says "Aucun compte pour l'instant." with a link to Comptes.
- **Save fails:** values kept, the error above the sheet's buttons.
- **Leaving with changes:** "Abandonner les modifications?" before the sheet closes. This
  goes in `RouteSheet`, so every form gets it.

## Data

- Reads: open accounts, the user's currencies, the category and merchant pickers' data,
  the rate for (original currency, account currency, date) for the prefill and the fee.
  The merchants come with their use count (view `merchant_usage`), the picker's
  "Fréquentes" from the view `frequent_categories`, and the rate as exact text
  (`exchange_rate_text`, so the browser never reads it as a float; database.md).
- Writes: `saveTransaction`, `deleteTransaction`. The
  fee is never stored; it is computed from the rate (database.md, Foreign currency).

## Copy

| Key | Français |
|---|---|
| Titles | Nouvelle transaction, Modifier la transaction |
| Kinds | Dépense, Revenu, Transfert; until spec 16: Les transferts arrivent avec le prochain écran. |
| Fields | Compte, Date, Marchand, Catégorie, Note, En attente |
| Date shortcuts | Aujourd'hui, Hier |
| Foreign | Payé, Frais, 1 {from} = {rate} {to} au {date} |
| Picker | Fréquentes, Archivée, Retirer la catégorie, Créer « {text} » |
| Splits | Répartir, Répartir par, Montant, Parts, %, Ajouter une catégorie, Retirer la ligne, Reste à répartir |
| Split errors | Répartissez tout le montant., Les pourcentages doivent totaliser 100., Chaque catégorie une seule fois. |
| Imported | Importée le {date} |
| Delete | Supprimer la transaction, Cette action est irréversible. |
| No account | Aucun compte pour l'instant. |
| Discard | Abandonner les modifications?, Abandonner |
| Actions | Annuler, Enregistrer |
| Saved | Transaction ajoutée., Transaction enregistrée. |

## Open questions

- **Several receipts in a row.** "Enregistrer et ajouter" was dropped on accounts and
  categories. At the till, the round button reopens the form in one tap; if that is too
  slow in use, this is where it would come back.
