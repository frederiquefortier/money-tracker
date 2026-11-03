# Accounts

**Status:** reviewed 2026-11-03.

## Purpose

Where the money sits. The Comptes screen lists every account grouped by institution, with
its balance, so the owner can check them against the bank. The forms create and edit
accounts and institutions. Reached from Réglages.

## Requirements

ACC-01, 02, 03, 04, 05, 06, 07. ACC-08 (last reconciled, last transaction) is phase 2.

## Comptes

```
┌──────────────────────────────┐
│ ‹ Réglages                   │
│ COMPTES        Trier : Nom ▾ │
│ ┌──────────────────────────┐ │
│ │ ▾ Desjardins ↗  4 000,00 $│ │
│ │ ──────────────────────── │ │
│ │ Chèque         CAD        │ │
│ │ Compte chèque  1 204,10 $ │ │
│ │ Épargne        CAD        │ │
│ │ Compte épargne 3 000,00 $ │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ ▸ Wise ↗       ≈ 900,00 $ │ │
│ └──────────────────────────┘ │
│ ▸ Comptes fermés (2)         │
│ [ + Ajouter un compte ]      │
└──────────────────────────────┘
```

### Groups (ACC-06)

- One card per institution, alphabetical, then a last card "Sans institution" for accounts
  without one (cash, an envelope). The header holds a chevron to collapse it, the
  name, an external-link icon when the institution has a website (opens in a new tab), and
  the total of its open accounts.
- **The total** is in the display currency (CUR-06). If any account in the group is in
  another currency, the total is converted and carries the converted marker (CUR-09:
  `≈` and the details on tap).
- Collapsed groups are remembered per browser.
- A "…" on the header: "Modifier l'institution", "Ajouter un compte ici".

### Rows

- First line: the account name, then the balance on the right, in the account's own
  currency, never converted. Cents set smaller (layout reference).
- Second line, muted: the type label (`label_fr` or `label_en`, SET-06) and the currency
  code in Inconsolata.
- **Hidden from new transactions** (ACC-04): an `eye-off` icon before the name, with the
  label "Masqué des nouvelles transactions" for screen readers and on hover.
- **Balance** = opening balance + every transaction on the account, pending included.
  Signed: a credit card owing 500 $ shows −500,00 $.
- **Pending:** when the account has pending transactions, a third line under the balance,
  muted, says "dont 45,00 $ en attente". The text carries the meaning; colour alone would
  not.
- Tapping a row opens the account form. Once the transactions list exists (spec 14), it
  opens that list filtered to the account, with "Modifier" in its header.

### Sort (ACC-07)

- "Trier :" menu at the top right: Nom, Type, Devise, Solde croissant, Solde décroissant.
  It sorts the rows inside each group; groups stay alphabetical.
- Balance sorts compare amounts converted to the display currency.
- The choice is kept per browser (local storage), as ACC-07 asks.

### Closed accounts (ACC-03)

- A collapsed line at the bottom, "Comptes fermés (2)". Open, it lists them flat, muted,
  with the closing date instead of a balance.
- They are excluded from the group totals and from every picker.

## Account form

```
┌──────────────────────────────┐
│ ‹ Annuler    NOUVEAU COMPTE  │
│                  Enregistrer │
│ Nom          [Chèque       ] │
│ Type         [Compte chèque▾]│
│ Institution  [Desjardins   ▾]│
│ Devise       [CAD          ▾]│
│ Solde d'ouverture [0,00 $  ] │
│ Date d'ouverture  [2026-11-03]│
│ ☐ Masquer des nouvelles      │
│   transactions               │
│ ──────────────────────────── │
│ Fermer le compte             │
│ Supprimer le compte          │
└──────────────────────────────┘
```

- **Nom** required, unique among the user's open accounts.
- **Type**: the `account_types` labels, in the interface language.
- **Institution** (optional): a searchable picker of the user's institutions, "Aucune" first, with "Créer
  « {texte} »" as the last item when nothing matches (ACC-05, inline create: name only,
  the website can be added later).
- **Devise**: the user's currencies, favourites first, prefilled with the default currency
  (CUR-05). Locked once the account has a transaction, with the hint "La devise ne peut plus
  changer : le compte a des transactions."
- **Solde d'ouverture** and **Date d'ouverture** (ACC-02): amount in the chosen currency,
  defaulting to 0 and today. Validation follows SET-07 (inline, on blur and on submit).
- **Masquer des nouvelles transactions** (ACC-04): a checkbox.
- **Fermer le compte** (edit only, ACC-03): asks for a closing date (default today), then
  moves the account to Comptes fermés. A closed account shows "Rouvrir le compte" instead.
- **Enregistrer et ajouter** (new accounts only): saves, then opens a fresh form with the
  same institution and currency.
- **Supprimer le compte** (edit only): only for an account with no transactions;
  otherwise it is not shown, and closing is the way out. Asks for confirmation.
- Phone: the form is a full screen with Annuler and Enregistrer in the top bar (layout
  reference, expense form). From `md` up: a centred card, at most 32rem.

## Institution form (ACC-05)

- **Nom** required, unique per user. **Site web** optional, must be an `https://` URL.
- Opened from a group's "…" menu. "Supprimer l'institution" only when no account uses it.

## States

- **No account yet:** "Aucun compte pour l'instant." and the add button.
- **Missing rate** for a converted group total: the total shows the missing-rate error
  (ADR-004), never a partial sum.
- **Save fails:** the form keeps the values and shows the error at the top (SET-07).

## Data

- Reads: `accounts` with `institutions`, balances from a view (opening balance plus the sum
  of transactions), `account_types` labels, `user_currencies`.
- Writes, each a server function with the user's session: `saveAccount`, `closeAccount`,
  `reopenAccount`, `deleteAccount`, `saveInstitution`, `deleteInstitution`.
- `accounts.institution_id` is nullable, and a composite foreign key with `user_id`
  (ADR-005).

## Multi-currency balances (Wise)

One account per currency, grouped under the same institution: "Wise CAD", "Wise EUR".
Each Wise balance has its own statement, and the app's rule that an account books in one
currency (TRX-02) keeps balances exact. The two Wise cases map onto existing features:

- **Moving money between balances** (CAD to EUR): a transfer between two currencies;
  the gap against the market rate shows as the conversion cost (TRX-11).
- **Paying in euros with only CAD** (Wise converts automatically): an expense on Wise CAD,
  paid in CAD, with the original price in EUR (CUR-08); the fee shows on its own.

The `multi_currency` account type is dropped.

## Copy

| Key | Français |
|---|---|
| Screen title | Comptes |
| Sort | Trier : Nom, Type, Devise, Solde croissant, Solde décroissant |
| Closed section | Comptes fermés ({count}) |
| Hidden label | Masqué des nouvelles transactions |
| No institution group | Sans institution |
| Pending line | dont {amount} en attente |
| No institution option | Aucune |
| Empty | Aucun compte pour l'instant. |
| Add | Ajouter un compte, Enregistrer et ajouter |
| Form titles | Nouveau compte, Modifier le compte |
| Fields | Nom, Type, Institution, Devise, Solde d'ouverture, Date d'ouverture |
| Currency locked | La devise ne peut plus changer : le compte a des transactions. |
| Inline create | Créer « {text} » |
| Close | Fermer le compte, Date de fermeture, Rouvrir le compte |
| Delete | Supprimer le compte |
| Institution form | Nouvelle institution, Modifier l'institution, Nom, Site web, Supprimer l'institution |
