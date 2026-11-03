# Transaction form

**Status:** reviewed 2026-11-03.

## Purpose

Adding an expense or an income has to be fast enough to do at the till: amount, then a
tap or two. The same form edits a transaction later, splits it across categories, and
records a foreign-currency payment with its real cost.

## Requirements

TRX-01, 02, 05, 06, 09, 10, CUR-08, CAT-04, 06 (through the category picker), MER-01
(through the merchant picker). Transfers and adjustments are spec 16.

## The add button

- A round button with a plus, bottom right, above the tab bar on phones, in the primary
  red with a white icon. On `md` and up it sits bottom right of the content.
- It shows on the Transactions tab only.
- It opens a new expense. The form is its own route (`/transactions/new`), so the back
  button and a reload work.

## Layout

```
┌──────────────────────────────┐
│ Annuler   NOUVELLE  Enregistrer│
│ [Dépense][Revenu][Transfert] │
│                              │
│        84,12   [CAD ▾]       │
│                              │
│ ◫ Compte      Chèque       › │
│ ◫ Date        Auj. 3 nov.  › │
│               + Heure        │
│ ◫ Marchand    IGA          › │
│ ◫ Catégorie   (◉) Épicerie › │
│               Répartir…      │
│ ◫ Note        [            ] │
│ ◫ En attente            [ ○] │
└──────────────────────────────┘
```

Phone: full screen, Annuler and Enregistrer in the top bar (layout reference). From `md`
up: a centred card, at most 32rem, same order.

## Content and behaviour

### Kind

- Three tabs: Dépense (default), Revenu, Transfert. Transfert switches to the transfer
  form (spec 16), keeping the amount, account and date.
- The amount is always typed positive; the kind gives the sign.

### Amount and currency (TRX-02, CUR-08)

- The amount is large, in Inconsolata, focused on open with the decimal keypad
  (`inputmode="decimal"`). It accepts the locale's separator: `84,12` in French, `84.12`
  in English.
- The currency chip is prefilled with the account's currency and follows it when the
  account changes. Its picker lists the user's currencies, favourites first (CUR-03).
- **Foreign currency:** choosing a currency other than the account's turns the amount
  into the original price, and two lines appear under it:

  ```
          15,00 € [EUR ▾]
    Payé      [ 22,54 $ ]
    Frais     0,11 $ (0,5 %)
    1 € = 1,4952 $ au 3 nov. 2026
  ```

  - **Payé** is in the account's currency, prefilled with the original price at that
    day's rate, and editable: type what the statement shows.
  - **Frais** is read-only: what was paid minus the market value (CUR-08). Negative fees
    show as they are; a missing rate shows "Taux manquant" and no fee (ADR-004).
  - The transaction is booked in the account's currency (`amount`), the original kept
    beside it (`original_amount`, `original_currency`).

### Details

- **Compte**: open accounts not hidden from new transactions (ACC-03, 04). Prefilled with
  the account last used (remembered per browser). A list filtered to one account
  prefills that account.
- **Date** (TRX-01): today by default, "Aujourd'hui" and "Hier" as shortcuts, then a date
  picker. "+ Heure" adds an optional time.
- **Marchand** (TRX-05): the merchant picker (spec 13). Choosing one fills the category
  from its default (MER-01) unless a category was already chosen by hand.
- **Catégorie**: the category picker (spec 12), filtered as of the transaction's date
  (CAT-04). An archived category on an old transaction shows with its "Archivée" badge.
- **Note** (TRX-10): free text, one line that grows.
- **En attente** (TRX-09): a switch, off by default (cleared).

### Splits (TRX-06)

"Répartir…" under the category replaces the single category with lines:

```
  Répartir par  [Montant][Parts][%]
  (◉) Épicerie        [ 60,00 ]
  (◉) Maison          [ 24,12 ]
  + Ajouter une catégorie
  Reste à répartir    0,00 $
```

- One mode for the whole transaction: Montant, Parts or Pourcentage.
- **Montant:** each line in the transaction's currency; "Reste à répartir" must reach
  zero to save.
- **Parts** (1, 2, 1) and **Pourcentage** (must total 100): the amounts are computed, and
  the last line takes the rounding cent, so the lines always sum exactly to the total.
- Each line's computed amount shows muted beside its input in Parts and % mode.
- Removing lines down to one returns to the single category field.
- Previews in the browser use integer minor units (ADR-004); the server recomputes and
  the database checks the sum (database.md, deferred constraint).

### Edit

- Tapping a row in the list opens the same form, titled "Modifier", with "Supprimer la
  transaction" at the bottom (asks for confirmation).
- A transaction from an import shows "Importée le {date}" under the title; editing it is
  allowed.

### Saving

- Enregistrer validates (SET-07): an amount above zero, an account, a category or
  complete splits, a date. Errors show inline; values are kept.
- Saved through one server function, `saveTransaction`, which calls the SQL function
  `save_transaction` so the transaction and its splits are written together (ADR-012).
- After saving, the list opens on the transaction's month, the new row briefly
  highlighted.
- **Enregistrer et ajouter** (new transactions only), at the bottom of the form: saves,
  then opens a fresh form with the same kind, account and date, for entering several
  receipts in a row. A short "Transaction ajoutée" confirms the save.

## States

- **No account yet:** the form says "Ajoutez d'abord un compte." with a link to Comptes.
- **No category yet:** the picker offers "Créer une catégorie" (opens spec 12's form).
- **Save fails:** values kept, error at the top.
- **Leaving with changes:** "Abandonner les modifications ?" before closing.

## Data

- Reads: open accounts, the user's currencies, the category and merchant pickers' data,
  the rate for (original currency, account currency, date) for the prefill and the fee.
- Writes: `saveTransaction`, `deleteTransaction`. The fee is never stored; it is computed
  from the rate (database.md, Foreign currency).

## Copy

| Key | Français |
|---|---|
| Titles | Nouvelle transaction, Modifier la transaction |
| Kinds | Dépense, Revenu, Transfert |
| Fields | Compte, Date, Heure, Marchand, Catégorie, Note, En attente |
| Date shortcuts | Aujourd'hui, Hier |
| Foreign | Payé, Frais, 1 {from} = {rate} {to} au {date} |
| Splits | Répartir…, Répartir par, Montant, Parts, %, Ajouter une catégorie, Reste à répartir |
| Archived badge | Archivée |
| Imported | Importée le {date} |
| Delete | Supprimer la transaction |
| No account | Ajoutez d'abord un compte. |
| Discard | Abandonner les modifications ? |
| Actions | Annuler, Enregistrer, Enregistrer et ajouter |
| Saved | Transaction ajoutée |
