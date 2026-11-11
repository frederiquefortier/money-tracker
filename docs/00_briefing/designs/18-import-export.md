# Import and export

**Status:** reviewed 2026-11-03; the import half built 2026-11-10 (the export half, IMP-04, is not yet), after the format changed (ADR-033 to ADR-036). Shared rules:
[02-screens.md](02-screens.md#shared-patterns).

## Purpose

The milestone of phase 3: eight years of cleaned history brought in, in one go, onto the
accounts and categories set up in the first run. The import checks everything before
writing anything, says exactly what it will create, and can be undone as a whole. Export
gives all the data back in the same format.

## Requirements

IMP-01, 04, 05, 06, SEC-04 (the export half). The format itself is
[import.md](../../01_building/import.md); this spec is only the screens.

## Importer

Two steps, shown in a centred stepper with no card (Fichiers, Importer): each a circle joined by a line,
a small "Étape n" and its name, no status tags. A finished
step is a solid circle with a check, the current one a ringed circle with its icon, the next
a pale outlined circle. The active step has its title on the page, above its content
("Extraire les fichiers", "Résumé de l'import"). The check is not a step: it is what
Extraire does at the end of the first.

```
 ◉────────────────────○
 ÉTAPE 1             ÉTAPE 2
 Fichiers            Importer
 [En cours]          [À venir]

 TÉLÉVERSER LES FICHIERS
 ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
 │      [+]                   │
 │ Déposez les fichiers ici ou│
 │ cliquez pour les choisir   │
 └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
 (◉) transactions.csv   4 800 lignes   ✕
 ──────────────────────────────────────
 [Modèles ▾]                [Extraire]
```

## Import flow (IMP-01)

### 1. Files

- "Choisir les fichiers" opens the file chooser (several at once); dropping files on the
  card works too. Files are recognised by name: `accounts.csv`, `transactions.csv`,
  `splits.csv`, `people.csv`, `aliases.csv`. An unknown name is refused with a toast, "Fichier non
  reconnu: {name}". `transactions.csv` is required; without it, "Vérifier" says so in a
  toast. A file chosen again replaces the one of the same name.
- Each file shows with its row count and, when its format is wrong, its error count, and
  a ✕ to remove it. Files are read in the browser and never uploaded or stored.
- A dashed area (a soft rounded-square icon, "Déposez les fichiers ici ou cliquez pour les
  choisir") chooses or takes dropped files. Each loaded file is a row with its kind's icon in
  a round tinted badge (`IconBubble`, the one a transfer has in the list), its name, its row
  count and, when its format is wrong, an error tag and a ✕. There is no check mark: nothing
  there is an action. The card's footer has `Modèles`, a menu that downloads the example
  files, and **Extraire**, always shown and off until there are files and no error. There is no
  "Règles du format" summary: it was explanatory text, and the shared patterns have none.
- The browser checks each file before the server does: the columns (unknown or missing),
  required values, dates as `AAAA-MM-JJ`, decimals with a point. Those errors show at
  once and Extraire stays off until they are fixed.

### 2. Check

- Extraire sends the rows to `checkImport`, which calls `import_batch` with `dry_run`.
  Nothing is written, and the files are never stored. A good check opens step 2.
- **Errors**: one card, under the files (step 1), grouped by file, one line each: "Ligne 214" and the problem in
  plain words, from a code (`import.errors.*`). The first 100 show, with the total;
  "Copier les erreurs" copies them all. Any error blocks the import.

### 3. Summary (step 2)

- It opens with the file's figures as large tiles (transactions, expenses, incomes,
  transfers; a transfer counts once), then centred lines for the dates, the adjustments, the
  rows already imported and skipped (IMP-05), and the aliases that will be kept. A file
  that is all in already says so and has no import button.
- **What would be created**, one card with a row per kind, its count and a chevron that
  opens the items in place: currencies added to
  the user's list, institutions, accounts, accounts that take the file's opening balance
  and date (ADR-034, shown with the balance), categories (paths, parents included),
  merchants, people, events. Currencies are created, not refused (ADR-033).
- **Deciding (IMP-06)**: nothing has to be decided; an item is created as written. Each row
  of categories, merchants, people and events has a merge icon opening a `FormSheet` with a
  `Combobox` of the names that exist and the other new ones. Merchants, people and events
  also have a pencil (a `FormSheet` with the name, which can be changed or emptied, and
  "Dans la note" for the part of its text sent to the note, plus "Tout mettre dans la
  note") and a trash icon (not created, text dropped). A decided row is struck through
  with a tag ("Fusionné avec “…”", "Dans la note", "Retiré", "→ “…”") and an undo icon,
  and the section's count follows. Decisions only change this import's rows (a merged
  category carries what is under it). A merge of a merchant or a person is kept as an alias
  (ADR-037), and the summary says how many aliases will be kept. The choices stay while
  the page is open, so changing a file does not lose them.
- Missing exchange rates are not checked here.

### 4. Commit

- Under the sections, the centred button "Importer {n} transactions" calls `commitImport` with the merges applied: one request,
  one `import_batch` call, one transaction. While it runs the button reads "Import en
  cours…" and leaving the page is guarded.
- Done: "Import terminé: {n} transactions." with "Voir les transactions" and "Importer
  d'autres fichiers". The batch appears under Imports.
- Refused by the check after the merges: the errors card, nothing written. A call that
  runs out of the API's 8 seconds: "Le fichier est trop long pour un seul import.
  Importez-le par année." (a `ref` already imported is skipped, so the parts are safe).
  Any other failure: "L'import n'a rien écrit." The files stay loaded.

## Historique and undo (IMP-05)

The card is titled "Historique" (the imports made).

- One row per batch, newest first: the date, then the transaction count and what it
  created ("1 compte, 1 catégorie, 613 magasins") on the second line.
- **Annuler l'import** is the undo icon in the row's action slot, with a `ConfirmDialog`:
  "{n} transactions seront supprimées, ainsi que ce que cet import a créé et qui ne sert
  plus ailleurs." If some were edited since, it adds "dont {n} modifiées depuis".
- An undone batch stays in the list, muted, "Annulé le {date}", no action. Its `ref`s are
  free again, so the file can be imported again.

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

- Reads: `getImports` (the batches with how many of their transactions were edited
  since), `getImportTargets` (the names to merge into).
- Writes: `checkImport(rows)` (the dry run), `commitImport(rows)`, `undoImport(batchId)`;
  `exportData()` is still to build.

## Copy

All under `import.*` in the French and English files, typed against each other; one
message per error code.

## Round 3 notes (import screen)

- No title above either step's content.
- Each group's count is in the accent colour; its header and rows have a minimum height of
  4rem, like an institution on Comptes.
- A new category shows the badge it will get (icon suggested from its name, the grey the
  import writes).
- A new merchant, person, event or category whose name is one typo from an existing or
  another new name (two for a long name) has a "Fusionner avec X ?" link that merges in one
  tap (`similarName`).
- The last line is one link, "Modifier les {n} fichiers", back to step 1.

## Round 4 notes (import screen)

- Error card: red border, a light red background, extra padding at the bottom, the copy icon
  by the title. When merges or edits are saved it ends with "Effacer mes N fusions et
  modifications" at the right, which asks before clearing.
- Done: a centred card with a green check, "Import terminé", the transactions imported, one
  row per kind created (label left, count right), then "Importer d'autres fichiers" and
  "Voir les transactions" at the right.
- Historique: not a card; a collapsed section "Historique (n)", one line per import (date,
  number of transactions) and the undo icon.

## Round 5 notes (import screen)

- The error card pairs with the done card: a centred card, a red-tinted circle with a warning
  icon, "L'import ne peut pas continuer" and the number of faults, each fault as a row (file
  and line on the left, the message at the right, thin lines between), then at the right the
  copy icon and, when merges or edits are applied, "Effacer mes N fusions et modifications".
- Where it shows: a fault found when the files are extracted (the format of a file, or what
  the check refuses) stays on step 1, under the files. A fault found when importing, which can
  come from the merges and edits chosen on step 2, shows on step 2 above the summary, so the
  choices stay in reach and can be changed or cleared; the page scrolls up to it.
- On step 1 the error card is also above the upload area, as on step 2, so it is the first thing seen; the page scrolls up to it when it appears.
