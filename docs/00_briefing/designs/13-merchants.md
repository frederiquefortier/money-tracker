# Merchants

**Status:** reviewed 2026-11-03; aligned with the built screens 2026-11-03. Shared rules:
[02-screens.md](02-screens.md#shared-patterns).

## Purpose

A merchant is where the money went: the grocery store, the landlord, the airline. It
saves typing, because choosing one prefills the category, and it gives the dashboard a
second way to read spending (DSH-07, phase 2). Reached from Réglages; most merchants are
created inline from the transaction form.

## Requirements

MER-01, MER-05 (merge). TRX-05 (linking a transaction to a merchant) is the picker below.
MER-03 (country) is phase 5, MER-04 (price evolution) phase 2.

## Marchands

```
┌──────────────────────────────────┐
│ ← Réglages                       │
│ MARCHANDS              [+ MARCHAND]│
│ [Rechercher un marchand        ] │
│ ┌──────────────────────────────┐ │
│ │ IGA                  84  ⇉ 🗑 │ │
│ │ (◉) Épicerie                  │ │
│ │ Hydro-Québec         12  ⇉ 🗑 │ │
│ │ (◉) Électricité               │ │
│ │ Librairie Pantoute    3  ⇉ 🗑 │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
⇉ merge into another   🗑 delete
```

- Alphabetical, with a search field above the card that filters as you type.
- Each row: the name, then on the second line its default category (icon and name), left
  empty when there is none; on the right the number of transactions, then the actions.
- Tapping a row opens the form.

### Row actions

- **Fusionner** (MER-05): a dialog with one field, the merchant combobox (below, without
  "Créer"), then "Les {count} transactions de “{source}” passeront à “{target}”, puis
  “{source}” sera supprimé." The target keeps its own name and default category. Used to
  clean up duplicates after the import.
- **Trash:** "Supprimer “{name}”". With no transactions: "Cette action est
  irréversible.". With transactions: "Les {count} transactions gardent leur catégorie et
  perdent le marchand."

## Merchant form

A route sheet over Marchands (`/settings/merchants/new`, `/settings/merchants/{id}`). It
only edits.

- **Nom** required, unique per user, compared without case or accents ("Café Olimpico"
  and "cafe olimpico" are the same merchant). A duplicate shows "Ce marchand existe
  déjà." under the field.
- **Catégorie par défaut** (MER-01): the category picker (spec 15), optional, empty with a
  × to clear. Changing it affects new transactions only; past ones keep their category.
- Saving closes the sheet with a toast, "Marchand créé." or "Marchand enregistré.".

## Merchant picker (TRX-05)

Used by the transaction form (spec 15): the shared combobox.

- While the field is empty, the most used merchants first; as you type, alphabetical
  matches.
- "Créer « {texte} »" when nothing matches exactly: creates the merchant with that name
  and no default category, and selects it.
- **Choosing a merchant with a default category** fills the category, unless one was
  already chosen by hand or the transaction has splits. A filled category stays editable.
- The × clears the merchant and leaves the category as it is.

## States

- **No merchant yet:** "Aucun marchand pour l'instant." under the title.
- **Save fails:** values kept, the error above the sheet's buttons (SET-07).

## Data

- Reads: `merchants` with the default category and a transaction count per merchant.
- Writes, each a server function with the user's session: `saveMerchant`,
  `deleteMerchant`, `mergeMerchants(source, target)`. The merge is one SQL function (moves
  the transactions, deletes the source) with a pgTAP test, like other multi-row writes
  (ADR-012). The inline create in the picker calls `saveMerchant`.
- `merchants.default_category_id` is a composite foreign key with `user_id` (ADR-005).
  Deleting a merchant sets `transactions.merchant_id` to null.
- Uniqueness ignoring case and accents: a unique index on a normalised name.

## Copy

| Key | Français |
|---|---|
| Screen title | Marchands |
| Search | Rechercher un marchand |
| Empty | Aucun marchand pour l'instant. |
| Add | Marchand (named Ajouter un marchand) |
| Form titles | Nouveau marchand, Modifier le marchand |
| Fields | Nom, Catégorie par défaut |
| Clear category | Retirer la catégorie |
| Saved | Marchand créé., Marchand enregistré. |
| Duplicate | Ce marchand existe déjà. |
| Delete | Supprimer “{name}”, Cette action est irréversible., Les {count} transactions gardent leur catégorie et perdent le marchand. |
| Inline create | Créer « {text} » |
| Merge | Fusionner “{name}”, Fusionner avec, Les {count} transactions de “{source}” passeront à “{target}”, puis “{source}” sera supprimé. |
