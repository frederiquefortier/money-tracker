# Import and export

**Status:** reviewed 2026-11-03; aligned with the built screens 2026-11-03. Shared rules:
[02-screens.md](02-screens.md#shared-patterns).

## Purpose

The milestone of phase 3: eight years of cleaned history brought in, in one go, onto the
accounts and categories set up in the first run. The import checks everything before
writing anything, says exactly what it will create, and can be undone as a whole. Export
gives all the data back in the same format.

## Requirements

IMP-01, 04, 05, 06, SEC-04 (the export half). The format itself is
[import.md](../../01_building/import.md); this spec is only the screens.

## Importer et exporter

Reached from Réglages, and from the empty transactions list (spec 14).

```
┌──────────────────────────────┐
│ ← Réglages                   │
│ IMPORTER ET EXPORTER         │
│ ┌──────────────────────────┐ │
│ │ IMPORTER                 │ │
│ │ [ Choisir les fichiers ] │ │
│ │ Modèles: accounts.csv ·  │ │
│ │ transactions.csv ·       │ │
│ │ splits.csv               │ │
│ │ ▸ Règles du format       │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ EXPORTER                 │ │
│ │ [ Exporter mes données ] │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ IMPORTS                  │ │
│ │ 3 nov. 2026            ↶ │ │
│ │ 9 812 transactions       │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

## Import flow (IMP-01)

### 1. Files

- "Choisir les fichiers" opens the file chooser (several files at once); dropping files
  on the card works too on desktop.
- Files are recognised by name: `accounts.csv`, `transactions.csv`, `splits.csv`. Each
  shows as a chip with its row count; an unknown name is refused with "Fichier non
  reconnu: {name}". `transactions.csv` is required, the other two optional.
- Files are read in the browser and never uploaded or stored (import.md).
- Template links download the example files. "Règles du format" opens a short summary of
  import.md's rules (dates, decimals, signs, category paths) in place.
- "Vérifier" starts step 2.

### 2. Check

- Every row is validated in the browser first, then again on the server. Nothing is
  written.
- **Errors:** grouped by file, one line each: line number, column, the problem, in plain
  words ("ligne 214, amount: « 12,50 » utilise une virgule; le format attend un
  point"). The first 100 show, with the total count; "Copier les erreurs" copies them
  all as text for fixing the file.
- Any error blocks the import (import.md: all or nothing). "Choisir d'autres fichiers"
  goes back to step 1.

### 3. Summary

```
│ 9 812 transactions                 │
│ du 2 janv. 2018 au 31 oct. 2026    │
│ 7 104 dépenses · 1 290 revenus     │
│ 1 401 transferts · 17 ajustements  │
│ 212 déjà importées, ignorées       │
│ Comptes: 6 existants, 1 nouveau ▸  │
│ Catégories: 3 nouvelles ▸          │
│ Magasins: 418 nouveaux ▸          │
│ [ Importer 9 600 transactions ]    │
```

- Counts by kind, the date range, rows skipped because their `ref` was already imported
  (IMP-05).
- **New accounts, categories and merchants** are listed, each section expandable.
  Categories show as a tree with their full paths.
- **New categories need a decision** (IMP-06), since the tree was set up fresh. The
  section opens by default, and the import button stays disabled until every new
  category is decided. See the module below.
- **Currencies not in the user's list** are an error at step 2, not a creation.
- **Missing rates** (a currency without history on those dates): a warning, not an
  error; those amounts will show "Taux manquant" until a rate exists (ADR-004).

### New categories (IMP-06)

```
│ CATÉGORIES À DÉCIDER (3)                │
│ Alimantation > Épicerie      214 tr.    │
│   ( ) Créer                             │
│   (•) Fusionner avec [Alimentation >    │
│                       Épicerie      ▾]  │
│ Sorties > Bars                38 tr.    │
│   (•) Créer                             │
│   ( ) Fusionner avec…                   │
│ Taxi                          12 tr.    │
│   ( ) Créer                             │
│   (•) Fusionner avec [Transport (nouv.)▾]│
│ [ Tout créer ]                          │
```

- One block per category path the file uses that does not exist yet, with the number of
  transactions and splits using it. Parents that would be created only as part of a path
  are not listed on their own.
- **Créer**: created as written, with a suggested icon and colour (spec 12).
- **Fusionner avec…**: the category picker (spec 15), showing existing categories, the
  ones this import will create, and "Créer « {texte} »" for a new category under another
  name. Its rows are booked to the chosen category instead. This catches a typo
  ("Alimantation"), regroups old names ("Taxi" into "Transport"), and folds several
  unknown names into one new category.
- Nothing is chosen at first. "Tout créer" picks Créer for every block not yet decided.
- The choices apply to this import only: the file is not changed, and the merges are not
  remembered as rules (that is the import wizard, IMP-03, later). They are kept while the
  page is open, so going back to fix a file does not lose them.
- The summary's category count follows the choices.

### 4. Commit

- "Importer {n} transactions" sends everything in one request; one SQL call commits or
  rolls back as a whole (import.md, ADR-012).
- While it runs: a progress line, and leaving the page is guarded.
- Done: "Import terminé: {n} transactions." with "Voir les transactions" (opens the
  month of the newest row). The batch appears under Imports.
- Failed: "L'import n'a rien écrit." and the reason; the files are still loaded, so it
  can be retried.

## Imports and undo (IMP-05)

- One row per batch, newest first: the date, then the transaction count and what it
  created ("1 compte, 3 catégories, 418 magasins") on the second line.
- **Annuler l'import** is the undo icon in the row's action slot. The confirmation says
  what goes: "9 600 transactions seront
  supprimées, ainsi que les comptes, catégories et magasins créés par cet import qui ne
  servent plus ailleurs." If some of its transactions were edited since, it adds "dont
  {n} modifiées depuis".
- An undone batch stays in the list, muted, with "Annulé le {date}" on the first line and
  no action. Its `ref`s are free
  again, so the same file can be imported again after fixing.

## Export (IMP-04, SEC-04)

- "Exporter mes données" downloads three files, `accounts.csv`, `transactions.csv` and
  `splits.csv`, in the import format, built on the server with the user's session. No
  archive: three plain downloads, no dependency.
- Responses are `no-store` and never cached (security.md).
- Export then import into an empty account reproduces the data (import.md); that round
  trip is the format's test.

## States

- **Nothing imported yet:** the Imports card says "Aucun import pour l'instant."
- **Very large files:** the check runs in steps so the page stays responsive; a counter
  shows the rows read.

## Data

- Reads: `import_batches`, the existing accounts, categories, merchants and `ref`s (to
  match and skip).
- Writes: `checkImport(rows)` (validation and summary, writes nothing),
  `commitImport(rows)` (calls `import_batch`), `undoImport(batchId)`,
  `exportData()`.

## Copy

| Key | Français |
|---|---|
| Screen title | Importer et exporter |
| Cards | Importer, Exporter, Imports |
| Files | Choisir les fichiers, Fichier non reconnu: {name}, Vérifier |
| Templates | Modèles, Règles du format |
| Errors | {count} erreurs, Copier les erreurs, Choisir d'autres fichiers |
| Summary | déjà importées, ignorées; existants; nouveaux |
| New categories | Catégories à décider ({count}), Créer, Fusionner avec…, Tout créer, {count} tr., nouv. |
| Commit | Importer {count} transactions, Import terminé: {count} transactions., Voir les transactions, L'import n'a rien écrit. |
| Undo | Annuler l'import du {date}, Annulé le {date}, dont {count} modifiées depuis |
| Export | Exporter mes données |
| Empty | Aucun import pour l'instant. |
