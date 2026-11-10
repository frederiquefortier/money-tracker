# Accounts

**Status:** reviewed 2026-11-03; built 2026-11-03. This spec describes the built screens,
after the author's corrections; the shared rules are in
[02-screens.md](02-screens.md#shared-patterns).

## Purpose

Where the money sits. The Comptes screen lists every account grouped by institution, with
its balance, so the owner can check them against the bank. The forms create and edit
accounts and institutions. A tab of its own (Comptes), since it shows the balances
(decided 2026-11-05).

## Requirements

ACC-01, 02, 03, 04, 05, 06, 07. ACC-08 (last reconciled, last transaction) is phase 4.

## Comptes

```
┌──────────────────────────────────┐
│ COMPTES                [⇕][Trier▾]│
│ ┌──────────────────────────────┐ │
│ │ ▾ Desjardins    4 000,00 $ ↗ 🗑│ │
│ │ ──────────────────────────── │ │
│ │ Chèque          1 204,10 $ ▣ 🗑│ │
│ │ Compte chèque CAD             │ │
│ │ Épargne         3 000,00 $ ▣ 🗑│ │
│ │ Compte épargne CAD            │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ ▸ Wise         ≈ 900,00 $ ↗ 🗑│ │
│ └──────────────────────────────┘ │
│ ▸ Comptes archivés (2)           │
│                              (+) │
└──────────────────────────────────┘
▣ archive   ↗ website (muted without one)   🗑 delete   (+) add
```

### Groups (ACC-06)

- One card per institution, alphabetical, then a last card "Sans institution" for accounts
  without one (cash, an envelope). The header holds a chevron to collapse it, the name, the
  total of its open accounts, then its actions: the external-link icon (opens the website
  in a new tab; muted when there is none, a tap says "Aucun site web pour {name}.") and a
  trash. Tapping the header opens the institution sheet, as a
  row opens its form; the chevron alone collapses it (a pencil did this until 2026-11-05).
- **The total** is in the display currency (CUR-06). If any account in the group is in
  another currency, the total is converted and carries the converted marker (CUR-09).
- Collapsed groups are remembered per browser. "Tout déplier" / "Tout replier"
  (`ExpandAllButton`), beside the title, opens or closes every group at once.
- An institution with no open account keeps its card, saying "Aucun compte ouvert.", so it
  can always be found.

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
- **Actions** in the row's action slot from `md` up, in the account sheet's header on
  phones: archive (asks the date, default today) and trash. The institution's website
  and trash move the same way.
- Tapping a row opens the account form. Its transactions are found through the list's
  filters (spec 14); the list carries no account actions (decided 2026-11-05).

### Sort (ACC-07)

- "Trier:" menu beside the title (the shared `SortMenu`): Nom, Type, Devise, Solde croissant, Solde décroissant.
  It sorts the rows inside each group; groups stay alphabetical.
- Balance sorts compare amounts converted to the display currency.
- The choice is kept per browser.

### Archived accounts (ACC-03)

- A collapsed section under the groups, "Comptes archivés (2)". Open, it lists them flat,
  muted, each with its institution, type and currency. "Archivé le …" and the actions sit
  on the first line, level with the name.
- Actions: reactivate (the undo icon) and trash.
- They are excluded from the group totals and from every picker.

### Adding

The round + bottom right (`FloatingAddButton`) fans out three choices, Compte,
Institution and Ajuster un solde (spec 16), each opening its sheet. From `md` up the amounts keep 16px more room before
the row actions, so they never read as part of the icons.

## Account form

```
┌──────────────────────────────┐
│ NOUVEAU COMPTE             ✕ │
│ Nom *         [Chèque       ]│
│ Type          [Compte chèque▾]│
│ Institution   [Desjardins  ✕▾]│
│ Devise        [CAD          ▾]│
│ │ Date d'ouverture [2026-11-03]│
│ │ Solde à l'ouverture [0,00  ]│
│ ☐ Masquer des nouvelles      │
│   transactions               │
│          Annuler  Enregistrer│
└──────────────────────────────┘
```

A route sheet over Comptes (`/accounts/new`, `/accounts/{id}`). It only
edits.

- **Nom** required, unique among the user's open accounts at the same institution (or among
  those with no institution), so two banks can each have a "Chèque".
- **Type**: the `account_types` labels, in the interface language.
- **Institution** (ACC-05): the shared combobox over the user's institutions. Typing
  filters; "Créer « {texte} »" adds a new one (name only, the website can come later); a ×
  clears it. No institution is an empty field.
- **Devise**: the user's currencies by code, prefilled with the default currency
  (CUR-05). Locked once the account has a transaction: the field is disabled.
- **Date d'ouverture**, its own field, then **Solde à l'ouverture** (ACC-02) as its
  sub-field, indented under it with a line down its left side (`LinkedFields`). The
  amount is in the chosen currency; they default to today and 0.
- **Masquer des nouvelles transactions** (ACC-04): a checkbox.
- Saving closes the sheet with a toast, "Compte créé." or "Compte enregistré.".

## Institution form (ACC-05)

- **Nom** required, unique per user ignoring case. **Site web** optional, an `https://`
  URL.
- The same sheet, with its own URL (`/accounts/institutions/new`,
  `/accounts/institutions/{id}`). Opened from Institution under the round +, from
  its card header, or created inline from the account form.
- **Delete** is the trash on its card header, muted while any account (open or archived)
  uses it; a tap says "Des comptes utilisent encore cette institution." in a toast.

## States

- **No account yet:** "Aucun compte pour l'instant." under the title.
- **Missing rate** for a converted group total: "Taux manquant" in the error colour
  (ADR-004), never a partial sum.
- **Reactivating an account** whose currency was removed: a toast, "Ajoutez d'abord {code}
  à vos devises pour réactiver ce compte."

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
| Sort | Nom, Type, Devise, Solde croissant, Solde décroissant; Trier: {sort} (accessible name) |
| Add buttons | Institution, Compte, Ajuster un solde (named Ajouter une institution, Ajouter un compte, Ajuster un solde) |
| Archived section | Comptes archivés ({count}), Archivé le {date} |
| Hidden label | Masqué des nouvelles transactions |
| No institution group | Sans institution |
| Institution without accounts | Aucun compte ouvert. |
| Pending line | dont {amount} en attente |
| Empty | Aucun compte pour l'instant. |
| Save | Enregistrer, Compte créé., Compte enregistré. |
| Form titles | Nouveau compte, Modifier le compte |
| Fields | Nom, Type, Institution, Devise, Date d'ouverture, Solde à l'ouverture, Masquer des nouvelles transactions |
| Clear institution | Retirer l'institution |
| Inline create | Créer « {text} » |
| Archive | Date d'archivage (the verbs are the shared ones) |
| Institution form | Nouvelle institution, Modifier l'institution, Nom, Site web, Institution enregistrée. |
| Institution in use | Des comptes utilisent encore cette institution. |

## Still to build

- **Until transactions exist** (specs 14 and 15): a balance is the opening balance, no
  pending line shows, the currency is never locked, and every account can be deleted. Once
  they exist, the trash is muted on an account with transactions, and a tap says
  "Ce compte a des transactions. Archivez-le plutôt." in a toast.
- **Converted totals** show `≈` and say "converted to {code}" to screen readers; the rate
  details on tap come with the converted-amount marker of spec 14.
