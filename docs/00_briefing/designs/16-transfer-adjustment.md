# Transfer and adjustment

**Status:** reviewed 2026-11-03; aligned with the built screens 2026-11-03. Transfer
built 2026-11-05 on the receipt slip of spec 15; the adjustment built 2026-11-05, opened
from the account's balance on Comptes. Shared rules:
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
│ ┌──────────────────────────┐ │
│ │ (⇄)    500,00       CAD  │ │
│ │ - - - - - - - - - - - - -│ │
│ │ REÇU  287,10 CHF ≈ 496,03│ │
│ │ Taux  1 CAD = 0,5788 CHF │ │
│ │ FRAIS DE CONVERSION 3,97$│ │
│ │ - - - - - - - - - - - - -│ │
│ │ FRAIS DE TRANSACTION 2,50│ │
│ │ - - - - - - - - - - - - -│ │
│ │ EN ATTENTE AU DÉPART   ☐ │ │
│ │ EN ATTENTE À L'ARRIVÉE ☐ │ │
│ └/\/\/\/\/\/\/\/\/\/\/\/\/\┘ │
│ De *         [Chèque       ▾]│
│ Vers *       [Wise CHF     ▾]│
│ Date *       [2026-11-03    ]│
│ Note         [              ]│
│          Annuler  Enregistrer│
└──────────────────────────────┘
```

The slip of spec 15 (mono type, dashed rules, torn edge), with the transfer icon where
an expense has its category. The accounts come under it, like an expense's account.

Reached from the Transfert tab of the transaction form (spec 15), which keeps the amount,
account and date already typed; Dépense or Revenu goes back with the same three. The
same route sheet as spec 15, its title following the tab. A saved transfer opens at
`/transactions/transfers/{transferId}`, without the tabs.

### Accounts and amounts (TRX-04, 11)

- **De** and **Vers**: open accounts not hidden from new transactions. Vers cannot be
  the same as De. De is prefilled with the account last used.
- **The amount** is what left the De account, in its currency; the chip shows that
  currency and cannot be changed (it follows De).
- **Same currency:** nothing more; the amount arrives as is.
- **Different currencies** (TRX-11): a **Reçu** field appears, in the Vers account's
  currency, prefilled at that day's rate and editable: type what arrived. After it, muted,
  its value back in the De currency ("≈ 496,03 $"), and under it the rate. Then,
  read-only, **Frais de conversion**: what was sent minus that value, in the De currency. A
  missing rate shows "Taux manquant" and no cost (ADR-004). That money is spent: the
  list shows it under the transfer's amount (spec 14) and the dashboard counts it in the
  transfer fee category (database.md).

### Fee (TRX-04)

- **Frais de transaction**, optional, in the De currency. A fee above zero is recorded as an expense on
  the De account, in the transfer fee category.
- The fee's category is not chosen here: every fee goes to the one marked in Catégories
  (spec 12, decided 2026-11-05). Without one, a typed fee shows "Choisissez d'abord la
  catégorie des frais dans Catégories.", the last word a link there.

### Details

- **Date** and **Note**: as in spec 15 (no time).
- **En attente**, one checkbox per side (TRX-09): "au départ" for the De account, "à
  l'arrivée" for the Vers account, since money can leave one bank days before it lands in the other.
  The fee follows the départ side.
- In the list (spec 14), a transfer shows "En attente" while either side is pending; in
  an account-filtered list, the label follows that account's side.

### Edit and delete

- Tapping a transfer, or its fee, in the list opens this form with every part loaded:
  both legs and the fee. Saving updates them together, in place. Its body only edits;
  on phones delete is in its header (spec 15).
- **Deleting** a transfer deletes every part, from its row or its sheet header (spec 15).
  The fee's row has no trash. The confirmation names it like a transaction's: "Supprimer
  le transfert de 500,00 $ du 3 novembre 2026", then "Le transfert de “Chèque
  (Desjardins)” vers “Wise” et ses frais seront supprimés." In the sheet the fee is
  known, so the text says "et ses frais" only when there is one; on a row, where a filter
  can hide the fee, it says "et ses frais, le cas échéant". (TRX-04)

### Saving

- Validation (SET-07): an amount above zero, two different accounts ("Choisissez un
  autre compte que celui de départ." under Vers), a received amount above zero when the
  currencies differ, a fee with the currency's decimals and, with a fee, its category.
  Changing either account clears a received amount typed by hand.
- One server function, `saveTransfer`, calling the SQL function `save_transfer`, which
  writes the two legs and the fee under one `transfer_id` (ADR-012, database.md).
  `deleteTransfer` calls `delete_transfer`.

## Balance adjustment (TRX-03)

```
┌──────────────────────────────┐
│ AJUSTER UN SOLDE           ✕ │
│ ┌──────────────────────────┐ │
│ │ SOLDE RÉEL               │ │
│ │ (⚖)  1 216,50_____  CAD  │ │
│ │ - - - - - - - - - - - -  │ │
│ │ DANS L'APP    1 204,10 $ │ │
│ │ ÉCART           +12,40 $ │ │
│ └/\/\/\/\/\/\/\/\/\/\/\/\/\┘ │
│ Compte *  [Chèque (Desjardins)]│
│ Date *         [2026-11-03  ]│
│ Note           [            ]│
│          Annuler  Enregistrer│
└──────────────────────────────┘
```

- On the receipt slip of spec 15 (`AmountInput`, `ReceiptLine`, the dashed rule): the
  real balance typed big beside a scale icon, under a "Solde réel" caption, with the
  account's currency fixed; then the app's balance and the écart, signed, both plain
  lines of the slip.
  Account (the transaction form's picker, preselected when there is only one), date and
  note follow the slip, as on the other forms. Until an account is chosen, the amounts
  show a dash.
- Opened from Comptes (spec 11): "Ajuster un solde", a third choice under the round +,
  opens `/accounts/adjust`. A route sheet, like every form; saving goes back to
  Comptes with the new balance. The + keeps its three tabs, and the transactions list
  carries no account actions (decided 2026-11-05). Adjustments are rare: a few cents the
  owner cannot trace.
- Shows the account's balance in the app as of the chosen date (pending included, like
  the accounts screen), reloaded when the date changes.
- **Solde réel**: the balance the bank shows. The **Écart**, read-only, is the
  difference; it updates as the date or the balance changes.
- Saving sends the real balance and the date; the server computes and stores the
  difference (database.md), so a transaction added meanwhile cannot make it wrong.
- An écart of zero is a validation error under Solde réel: "Le solde correspond déjà."
- **Editing** an adjustment from its row in the list (`/transactions/adjustments/{id}`):
  titled "Modifier l'ajustement de “{account}”" with its institution ("Chèque
  (Desjardins)"), without the account picker, the app's balance without it, and Solde
  réel filled with the balance it made, so the écart shows as stored. The account stays. Deleting it follows the transactions: on its
  row, or in its sheet header on phones (spec 15).
- **History:** the transactions list filtered to the account.
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
  `saveAdjustment({ id?, accountId, realBalance, occurredOn, note })`, `deleteAdjustment`.
  The balance on a date comes from `getAdjustmentBalance` (`adjustment_balance_text`).

## Copy

| Key | Français |
|---|---|
| Transfer titles | Nouveau transfert, Modifier le transfert |
| Saved | Transfert ajouté., Transfert enregistré. |
| Fields | De, Vers, Reçu, Frais de transaction, Date, Note, En attente au départ, En attente à l'arrivée |
| No fee category | Choisissez d'abord la catégorie des frais dans Catégories. |
| Conversion | Frais de conversion, ≈ {value}, 1 {from} = {rate} {to} |
| Delete transfer | Supprimer le transfert de {amount} du {date}; Le transfert de {from} vers {to} sera supprimé. / et ses frais seront supprimés. / et ses frais, le cas échéant, seront supprimés. |
| Same account | Choisissez un autre compte que celui de départ. |
| One account | Il faut deux comptes pour un transfert. |
| Adjustment | Ajuster un solde, Modifier l'ajustement de “{account}”, Solde dans l'app, Solde réel, Écart, Le solde correspond déjà., Solde ajusté., Ajustement enregistré., Supprimer l'ajustement, Supprimer l'ajustement de {amount} du {date}, Le solde de {account} reviendra à celui de ses transactions. |
