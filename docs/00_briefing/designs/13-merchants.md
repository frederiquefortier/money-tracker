# Merchants

**Status:** reviewed 2026-11-03.

## Purpose

A merchant is where the money went: the grocery store, the landlord, the airline. It
saves typing, because choosing one prefills the category, and it gives the dashboard a
second way to read spending (DSH-07, phase 2). Reached from Réglages; most merchants are
created inline from the transaction form.

## Requirements

MER-01, MER-05 (merge). TRX-05 (linking a transaction to a merchant) is the picker below. MER-03 (country)
is phase 5, MER-04 (price evolution) phase 2.

## Marchands

```
┌──────────────────────────────┐
│ ‹ Réglages                   │
│ MARCHANDS                    │
│ [Rechercher un marchand    ] │
│ ┌──────────────────────────┐ │
│ │ IGA                       │ │
│ │ (◉) Épicerie         84 › │ │
│ │ Hydro-Québec              │ │
│ │ (◉) Électricité      12 › │ │
│ │ Librairie Pantoute        │ │
│ │ Aucune catégorie      3 › │ │
│ └──────────────────────────┘ │
│ [ + Ajouter un marchand ]    │
└──────────────────────────────┘
```

- Alphabetical, with a search field at the top that filters as you type.
- Each row: the name, then on the second line its default category (icon and name) or
  "Aucune catégorie", and on the right the number of transactions.
- Tapping a row opens the form.

## Merchant form

- **Nom** required, unique per user, compared without case or accents ("Café Olimpico"
  and "cafe olimpico" are the same merchant).
- **Catégorie par défaut** (MER-01): the category picker (spec 12), optional, with
  "Aucune" first. Changing it affects new transactions only; past ones keep their
  category.
- **Fusionner avec…** (MER-05, edit only): picks another merchant in the merchant picker.
  The confirmation says "Les {count} transactions de {source} passeront à {cible}, puis
  {source} sera supprimé." The target keeps its own name and default category. Used to
  clean up duplicates after the import.
- **Supprimer le marchand**: for a merchant with no transactions, at once. For one with
  transactions, the confirmation says "Les {count} transactions gardent leur catégorie et
  perdent le marchand."

## Merchant picker (TRX-05)

Used by the transaction form (spec 15).

- A search field over the user's merchants, most used first while the field is empty,
  then alphabetical matches as you type.
- "Créer « {texte} »" as the last item when nothing matches exactly: creates the merchant
  with that name and no default category, and selects it.
- **Choosing a merchant with a default category** fills the category, unless one was
  already chosen by hand or the transaction has splits. A filled category stays editable.
- Clearing the merchant leaves the category as it is.

## States

- **No merchant yet:** "Aucun marchand pour l'instant. Ils se créent aussi depuis une
  transaction." and the add button.
- **Duplicate name:** inline error "Ce marchand existe déjà." with a link to it.
- **Save fails:** values kept, error at the top (SET-07).

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
| No category | Aucune catégorie |
| Empty | Aucun marchand pour l'instant. Ils se créent aussi depuis une transaction. |
| Add | Ajouter un marchand |
| Form titles | Nouveau marchand, Modifier le marchand |
| Fields | Nom, Catégorie par défaut |
| Duplicate | Ce marchand existe déjà. |
| Delete | Supprimer le marchand |
| Delete confirmation | Les {count} transactions gardent leur catégorie et perdent le marchand. |
| Inline create | Créer « {text} » |
| Merge | Fusionner avec…, Les {count} transactions de {source} passeront à {target}, puis {source} sera supprimé. |
