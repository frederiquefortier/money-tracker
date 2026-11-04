# Merchants

**Status:** built 2026-11-04, before transactions: the count and the moving of transactions
come with the transactions migration. Shared rules:
[02-screens.md](02-screens.md#shared-patterns).

## Purpose

A merchant is where the money went: the grocery store, the landlord, the airline. It
saves typing, because choosing one prefills the category, and it gives the dashboard a
second way to read spending (DSH-07, phase 2). Reached from Réglages; most merchants are
created inline from the transaction form.

## Requirements

MER-01, MER-05 (merge), MER-06 (sort and filter). TRX-05 (linking a transaction to a merchant) is the picker below,
built with the transaction form (spec 15). MER-03 (country) is phase 5, MER-04 (price
evolution) phase 2.

## Marchands

```
┌──────────────────────────────────┐
│ ← Réglages                       │
│ MARCHANDS [Filtre▾][Tri▾][+ MARCHAND]│
│ [Rechercher                    ] │
│ ┌──────────────────────────────┐ │
│ │ IGA                      ⇉ 🗑 │ │
│ │ (◉) Épicerie                  │ │
│ │ Hydro-Québec             ⇉ 🗑 │ │
│ │ (◉) Logement > Électricité    │ │
│ │ Librairie Pantoute       ⇉ 🗑 │ │
│ └──────────────────────────────┘ │
└──────────────────────────────────┘
⇉ merge into another   🗑 delete
```

- **Trier** (MER-06, `SortMenu`): Nom A–Z (the default), Nom Z–A, Catégorie (by the
  default category's path, merchants without one last, then by name). Kept per browser.
  "Plus utilisés" joins it with the transaction count.
- **Filtrer** (MER-06, `ChoiceMenu` with the `tags` icon of Catégories, before the sort):
  "Toutes les catégories", then each default category in use and its parents as the
  category tree (connectors, icon, name; a parent keeps its branch), then "Sans
  catégorie". Shown once there is something to filter; not remembered.
- A search field above the card that filters as you type, ignoring
  case and accents (`SearchField`). Nothing found: "Aucun résultat.".
- Each row: the name, then on the second line its default category (icon and full path),
  left out when there is none; on the right the actions. The number of transactions
  joins them, before the actions, with the transactions migration.
- Tapping a row opens the form.

### Row actions

- **Fusionner** (MER-05, the `merge` icon): `ConfirmDialog` in red with one field,
  "Fusionner avec" (the shared `Combobox` over the other merchants, without "Créer"), then
  once a merchant is chosen "Les transactions de “{source}” passeront à “{target}”, puis
  “{source}” sera supprimé." The target keeps its own name and default category. Used to
  clean up duplicates after the import. A duplicate is an alias: once aliases exist
  (MER-02, with the import wizard), the merge also keeps the source's name as an alias of
  the target and moves the source's aliases to it, so a later import that would have
  matched the source finds the target. Muted when there is no other merchant; a tap says
  "Il faut au moins un autre marchand.".
- **Trash:** "Supprimer “{name}”" and "Cette action est irréversible.". With the
  transactions migration, a merchant with transactions says "Les {count} transactions
  gardent leur catégorie et perdent le marchand." instead.

## Merchant form

A route sheet over Marchands (`/settings/merchants/new`, `/settings/merchants/{id}`). It
only edits.

- **Nom** required, unique per user, compared without case or accents ("Café Olimpico"
  and "cafe olimpico" are the same merchant). A duplicate shows the shared "Ce nom est
  déjà utilisé." under the field.
- **Catégorie par défaut** (MER-01): `CategoryPicker` (spec 15, built with this screen),
  optional, empty with a × to clear. Its "Créer « … »" makes a top-level expense
  category. Changing it affects new transactions only; past ones keep their category.
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

- Reads: `merchants` and the categories (for the rows and the picker). The transaction
  count per merchant is counted from `transactions` (the table exists; the count on the
  screen comes with the transactions screens).
- Writes, each a server function with the user's session: `saveMerchant`,
  `deleteMerchant`, `mergeMerchants(source, target)`. The merge is one SQL function,
  `merge_merchants`, with a pgTAP test (ADR-012): it moves the source's transactions to
  the target, then deletes the source. The inline create in the picker calls `saveMerchant`.
- `merchants.default_category_id` is a composite foreign key with `user_id` (ADR-005);
  deleting the category clears it. Deleting a merchant sets
  `transactions.merchant_id` to null.
- Uniqueness ignoring case and accents: a unique index on `fold_name(name)`.

## Copy

| Key | Français |
|---|---|
| Screen title | Marchands |
| Search | Rechercher, Aucun résultat. (shared) |
| Sort | Nom A–Z, Nom Z–A, Catégorie; Trier: … (accessible name) |
| Filter | Toutes les catégories, Sans catégorie; Filtrer: … (accessible name) |
| Empty | Aucun marchand pour l'instant. |
| Add | Marchand (named Ajouter un marchand) |
| Form titles | Nouveau marchand, Modifier le marchand |
| Fields | Nom, Catégorie par défaut |
| Clear category | Retirer la catégorie |
| Settings row | Marchands (the `store` icon) |
| Saved | Marchand créé., Marchand enregistré. |
| Duplicate | Ce nom est déjà utilisé. (shared) |
| Delete | Supprimer “{name}”, Cette action est irréversible.; with transactions: Les {count} transactions gardent leur catégorie et perdent le marchand. |
| Inline create | Créer « {text} » |
| Merge | Fusionner, Fusionner “{name}”, Fusionner avec, Les transactions de “{source}” passeront à “{target}”, puis “{source}” sera supprimé., Il faut au moins un autre marchand. |
