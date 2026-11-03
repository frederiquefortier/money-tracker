# Transfer and adjustment

**Status:** reviewed 2026-11-03; aligned with the built screens 2026-11-03. Shared rules:
[02-screens.md](02-screens.md#shared-patterns).

## Purpose

Moving money between two of the owner's accounts is neither spending nor income, so it
gets its own form: it never touches the category totals, but its fee and its conversion
cost are visible. The balance adjustment sets an account to the balance the bank shows,
for the times the history does not add up.

## Requirements

TRX-03, 04, 11.

## Transfer

```
┌──────────────────────────────┐
│ NOUVEAU TRANSFERT          ✕ │
│ [Dépense][Revenu][Transfert] │
│                              │
│        500,00   CAD          │
│                              │
│ De *         [Chèque       ▾]│
│ Vers *       [Wise CHF     ▾]│
│ │ Reçu *     [ 287,10 CHF  ] │
│ │ Coût de conversion 3,97 $  │
│ │ 1 $ = 0,5788 CHF au 3 nov. │
│ Frais        [   0,00 $    ] │
│ Date *       [2026-11-03    ]│
│ Note         [              ]│
│ ☐ En attente au départ       │
│ ☐ En attente à l'arrivée     │
│          Annuler  Enregistrer│
└──────────────────────────────┘
```

Reached from the Transfert tab of the transaction form (spec 15), which keeps the amount,
account and date already typed. The same route sheet as spec 15.

### Accounts and amounts (TRX-04, 11)

- **De** and **Vers**: open accounts not hidden from new transactions. Vers cannot be
  the same as De. De is prefilled with the account last used.
- **The amount** is what left the De account, in its currency; the chip shows that
  currency and cannot be changed (it follows De).
- **Same currency:** nothing more; the amount arrives as is.
- **Different currencies** (TRX-11): a **Reçu** field appears, in the Vers account's
  currency, prefilled at that day's rate and editable: type what arrived. Under it,
  read-only, the **Coût de conversion**: the gap between what was sent and the market
  value of what arrived, in the De currency, with the rate used. A missing rate shows
  "Taux manquant" and no cost (ADR-004).

### Fee (TRX-04)

- **Frais**, optional, in the De currency. A fee above zero is recorded as an expense on
  the De account, in the transfer fee category.
- **Catégorie des frais**: the category picker (spec 15), shown once a fee is typed,
  prefilled with the category used last time (remembered on the profile).

### Details

- **Date**, **Heure**, **Note**: as in spec 15.
- **En attente**, one checkbox per side (TRX-09): "au départ" for the De account, "à
  l'arrivée" for the Vers account, since money can leave one bank days before it lands in the other.
  The fee follows the départ side.
- In the list (spec 14), a transfer shows "En attente" while either side is pending; in
  an account-filtered list, the label follows that account's side.

### Edit and delete

- Tapping a transfer in the list opens this form with every part loaded: both legs and
  the fee. Saving rewrites them together. The sheet only edits.
- **Deleting** a transfer deletes every part, wherever delete lives (spec 15, open
  question), after "Supprimer le transfert" / "Le transfert et ses frais seront
  supprimés." (TRX-04)

### Saving

- Validation (SET-07): an amount above zero, two different accounts, a received amount
  above zero when the currencies differ.
- One server function, `saveTransfer`, calling the SQL function `save_transfer`, which
  writes the two legs and the fee under one `transfer_id` (ADR-012, database.md).
  `deleteTransfer` calls `delete_transfer`.

## Balance adjustment (TRX-03)

```
┌──────────────────────────────┐
│ AJUSTER “CHÈQUE”           ✕ │
│ Date *         [2026-11-03  ]│
│ Solde dans l'app  1 204,10 $ │
│ │ Solde réel * [ 1 216,50 $ ]│
│ │ Écart         +12,40 $     │
│ Note           [            ]│
│          Annuler  Enregistrer│
└──────────────────────────────┘
```

- Opened from an account: "Ajuster le solde" in the header of the account-filtered list
  (spec 14). A route sheet, like every form.
- Shows the account's balance in the app as of the chosen date (pending included, like
  the accounts screen).
- **Solde réel**: the balance the bank shows. The **Écart**, read-only, is the
  difference; it updates as the date or the balance changes.
- Saving sends the real balance and the date; the server computes and stores the
  difference (database.md), so a transaction added meanwhile cannot make it wrong.
- An écart of zero is a validation error under Solde réel: "Le solde correspond déjà."
- **Editing** an adjustment from the list shows its stored écart, editable. Deleting it
  follows the transactions (spec 15, open question).
- Adjustments count neither as expenses nor as incomes and have no category.

## States

- **One account only:** the Transfert tab says "Il faut deux comptes pour un transfert."
  with a link to Comptes.
- **Save fails:** values kept, the error above the sheet's buttons.
- **Leaving with changes:** as in spec 15.

## Data

- Reads: open accounts, the rate for (De currency, Vers currency, date),
  `profiles.transfer_fee_category_id`, the account balance as of a date.
- Writes: `saveTransfer`, `deleteTransfer`, `setTransferFeeCategory`,
  `saveAdjustment({ accountId, realBalance, date, note })`, `deleteAdjustment`.

## Copy

| Key | Français |
|---|---|
| Transfer titles | Nouveau transfert, Modifier le transfert |
| Fields | De, Vers, Reçu, Frais, Catégorie des frais, Date, Note, En attente au départ, En attente à l'arrivée |
| Conversion | Coût de conversion, 1 {from} = {rate} {to} au {date} |
| Delete transfer | Supprimer le transfert, Le transfert et ses frais seront supprimés. |
| One account | Il faut deux comptes pour un transfert. |
| Adjustment | Ajuster le solde, Ajuster “{name}”, Solde dans l'app, Solde réel, Écart, Le solde correspond déjà., Supprimer l'ajustement |
