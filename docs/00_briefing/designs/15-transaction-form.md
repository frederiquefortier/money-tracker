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
- It is the same round + as on every other screen (shared patterns).
- It opens a new expense in a route sheet over the list (`/transactions/new`), so the back
  button and a reload work. The Transactions tab lives at `/transactions`; `/` leads
  there.

## Layout

One form: the receipt says what and how much, the fields under it say where, from which
account and when (decided 2026-11-04, after a step-by-step version was tried and dropped;
process.md).

```
┌──────────────────────────────┐
│ NOUVELLE TRANSACTION       ✕ │
│ [ Dépense ][ Revenu ][Transf.]│
│ ┌──────────────────────────┐ │
│ │ (◉)      15,00   (EUR ▾) │ │
│ │ RÉPARTIR                 │ │
│ │ - - - - - - - - - - - - -│ │
│ │ DÉBITÉ          22,54 CAD│ │
│ │ TAUX   1 EUR = 1,4952 CAD│ │
│ │ FRAIS      0,11 $ (0,5 %)│ │
│ │ - - - - - - - - - - - - -│ │
│ │ EN ATTENTE             ☐ │ │
│ └╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲┘ │
│ Magasin      [IGA          ✕]│
│ Compte *  [Chèque · Desjardins▾]│
│ Date *       [2026-11-03    ]│
│ Note         [              ]│
│              [              ]│
│          Annuler  Enregistrer│
└──────────────────────────────┘
```

The shared sheet: full screen on a phone, a panel from the right from `md` up.

## Content and behaviour

### Kind

- Three tabs first: Dépense (default), Revenu, Transfert, the shared `TabList`. The kind
  is the first decision: money out, money in, or moved.
- Transfert switches to the transfer form (spec 16), keeping the amount, account and
  date. Editing a saved expense or income shows only Dépense and Revenu: it cannot
  become a transfer.
- The amount is always typed positive; the kind gives the sign.

### The receipt (TRX-02, 06, 09, CUR-08)

A slip of paper: Inconsolata throughout, labels in capitals on the left and values on
the right, its sections spaced apart by dashed rules, and a torn bottom edge (the `receipt`
utility, a mask, so it works in both themes). Its small text (Taux, the computed shares,
Répartir, the remaining line) is 13px, one step under its 14px lines. Top to bottom:

- **The category's round icon**, then **the amount**, then **the currency chip**. The
  icon is the category's in its colour, or an empty dashed circle; tapping it opens the
  category list (below). Every round category control answers the same way: a small
  badge in its corner, a pencil on a category icon (shown on hover and focus, always on
  touch screens, as on the category form's icon), a plus on an empty circle (the same
  way, since 2026-11-05), whose dashed border also turns the full primary colour
  on hover and focus; the shared `EditHint`, scaled to the circle. Its name, and "Remboursement" for an income on an expense
  or placement category, is its tooltip and accessible name. The amount has no visible
  label; it is large, focused when a new transaction opens, with the decimal keypad, and
  accepts the locale's separator (`84,12`, `84.12`). The chip is prefilled with the
  account's currency and follows it when the account changes; its menu lists the user's
  currencies by code (CUR-03). Errors for the category or the amount show
  under this line.
- **Répartir**, once a category is chosen: it itemizes the slip (Splits, below). Split,
  the same place reads **Ne pas répartir** and goes back to one category, the first
  line's.
- **In another currency** than the account's, the amount is the original price and the
  slip goes on after a rule:
  - **Débité**, in the account's currency, prefilled at that day's rate and editable:
    type what the statement shows. **Taux** sits close under it, smaller and muted
    ("1 EUR = 1,4952 CAD"), so the two read as one.
  - **Frais de conversion**, read-only: what was debited minus the market value
    (CUR-08), with its percentage. Named like the transfer's line (spec 16), and counted
    as spending on the dashboard in the fee category marked in Catégories (database.md). Negative fees show as they are; a missing rate shows "Taux manquant" and
    no fee (ADR-004).
  - The transaction is booked in the account's currency (`amount`), the original kept
    beside it (`original_amount`, `original_currency`).
- **En attente** (TRX-09), always after a rule: the label on the left, a checkbox on the
  right, off by default (cleared).

### Splits (TRX-06)

"Répartir" itemizes the slip: the round icon beside the amount goes away and, after a
rule, the slip lists the categories, the first one starting with the category chosen.

```
│ (empty)        84,12  (CAD ▾) │
│ - - - - - - - - - - - - - - - │
│ PAR  [Montant][Parts][  %  ]  │
│ (◉) Épicerie          60,00 ✕ │
│ (◉) Maison            24,12 ✕ │
│ ( )+                          │
│           ✓ Tout est réparti │
```

- One mode for the whole transaction: Montant, Parts or %.
- Each line: the category's round icon and its full path, one button with the gap
  between them (both open the same category list), its value typed on the slip, and a ✕
  to remove it. A + icon button under the column of ✕ ("Ajouter une catégorie" as its
  tooltip and accessible name) adds a line and opens the category list for it, so an
  empty dashed circle only ever means a line waiting for its category.
- **The remaining line** closes the lines, small and right-aligned: "✓ Tout est
  réparti" once everything is shared; a warning icon and "Reste 12,00 $ à répartir"
  while something is left, or "Dépasse le montant de 3,00 $" when the lines go over. In
  % mode it counts in percent ("Reste 10 % à répartir") and is always there; in
  Montant once there is an amount; not in Parts, which always share everything.
- **Montant:** each line in the account's currency; everything must be shared to save.
- **Parts** (1, 2, 1) and **%** (must total 100, and never more: a value above what the
  other lines leave is cut to it as it is typed): the amounts are computed, and the last
  line takes the rounding cent, so the lines always sum exactly to the total. Each
  line's computed amount shows small under its value.
- Removing lines down to one, or "Ne pas répartir", returns to the single category
  beside the amount.
- Previews in the browser use integer minor units (ADR-004); the server recomputes and
  the database checks the sum (database.md, deferred constraint).

### Under the receipt

- **Magasin** (TRX-05; "Merchant" in English; the screen is Magasins, spec 13), full
  width like every field: the merchant picker. Choosing one fills its default category
  (MER-01) unless a category was chosen by hand or there are splits.
- **Compte**: open accounts not hidden from new transactions (ACC-03, 04), grouped by
  institution. Names can repeat across institutions, so the field shows "Chèque ·
  Desjardins" once chosen. Prefilled with the account last used (remembered per
  browser). A list filtered to one account prefills that account.
- **Date** (TRX-01): today by default; no shortcuts (removed 2026-11-04). No time: a
  transaction has a calendar date only, stored as a `date`, read and shown without a
  time zone, so 17.08.2026 is 17.08.2026 on every screen (decided 2026-11-04).
- **Note** (TRX-10): free text, three lines high, growing as it is typed.

### Category list (CAT-04, 06)

A category's round icon, on the receipt or on a split line, opens the list over the
whole sheet, its header included: a back arrow and "CATÉGORIE", no ✕. The form stays as
it was underneath; "←" or Escape goes back without choosing.

```
┌──────────────────────────────┐
│ ← CATÉGORIE                  │
│                  [⇕] [⇅ Nom▾]│
│ [Rechercher                 ]│
│ [Dépenses][Revenus][Placem.] │
│ Fréquemment utilisées        │
│  (◉)    (◉)    (◉)    (◉)    │
│ Épicer. Café  Essence Resto  │
│ ┌──────────────────────────┐ │
│ │▾ (◉) Alimentation        │ │
│ │  └─ (◉) Épicerie         │ │
│ │▸ (◉) Transport           │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

- What applies to every type comes first: "Tout déplier" and the sort on the right, as
  on the list pages; then **Rechercher**, full width, which takes focus. Then the type
  tabs (`KindTabs`, as on Catégories), the transaction's type selected.
- **Fréquemment utilisées** (CAT-06): the five categories of the selected type used most over the
  last 90 days, by count, under "Fréquemment utilisées", as a row of round icons with
  their names under them. Hidden while searching and until there are transactions.
- Then the type's tree, the shared `CategoryTree` as on Catégories: elbow connectors,
  parents opened and closed by their chevron, open branches remembered per browser and
  shared with that page, the same sort. A search shows every match with its parents.
- A category of another type is allowed: an expense category chosen for a revenue is a
  refund, which lowers that category's spending (database.md).
- Parents are choosable too. **Archived categories never appear** (CAT-04), as of the
  transaction's date; an archived one already chosen stays on its icon.

### Edit

- Tapping a row in the list opens the same sheet, titled "Modifier la transaction"
  (`/transactions/{id}`). Its body only edits.
- **Delete** follows the shared row actions: a trash on the row from `md` up, in the
  sheet's header on phones, where rows keep their width for the amount (decided
  2026-11-04, process.md). The confirmation names the transaction in its title,
  "Supprimer la transaction de 45,00 $ du 3 novembre 2026 chez “Épicerie du coin”"
  (without "chez …" when there is no merchant; the amount as booked, in the account's
  currency), then says where it went: "Elle a été notée dans le compte “Chèques”
  (Desjardins) et assignée à la catégorie “Épicerie”. Cette action est irréversible."
  With several categories: "répartie entre les catégories “Épicerie” et “Maison”".
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
| Kinds | Dépense, Revenu, Transfert |
| Receipt | Montant (accessible name), Répartir, Ne pas répartir, Débité, Taux, Frais de conversion, 1 {from} = {rate} {to}, Taux manquant, En attente |
| Category | Catégorie, Choisir une catégorie, Remboursement, Retour au formulaire, Fréquemment utilisées, Dépenses, Revenus, Placements, Rechercher, Aucun résultat. |
| Fields | Magasin, Compte, Date, Note |
| Picker | Fréquemment utilisées, Archivée, Retirer la catégorie, Créer « {text} » |
| Splits | Répartir, Ne pas répartir, Par, Montant, Parts, %, Ajouter une catégorie, Retirer la ligne, Tout est réparti, Reste {amount} à répartir, Dépasse le montant de {amount} |
| Split errors | Répartissez tout le montant., Les pourcentages doivent totaliser 100., Chaque catégorie une seule fois. |
| Imported | Importée le {date} |
| Delete | Supprimer la transaction (the trash), Supprimer la transaction de {amount} du {date} chez “{merchant}”, Elle a été notée dans le compte “{account}” ({institution}) et assignée à la catégorie {categories}. / répartie entre les catégories {categories}., Cette action est irréversible. |
| No account | Aucun compte pour l'instant. |
| Discard | Abandonner les modifications?, Abandonner |
| Actions | Annuler, Enregistrer |
| Saved | Transaction ajoutée., Transaction enregistrée. |

## Open questions

- **Several receipts in a row.** "Enregistrer et ajouter" was dropped on accounts and
  categories. At the till, the round button reopens the form in one tap; if that is too
  slow in use, this is where it would come back.
