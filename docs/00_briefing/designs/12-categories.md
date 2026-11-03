# Categories

**Status:** reviewed 2026-11-03.

## Purpose

The category tree is how spending gets read: the dashboard, budgets and the yearly review
all group by it. This spec covers the Catégories screen (the tree and its archive), the
category form with its icon and colour, and the category picker every transaction form
uses. Reached from Réglages.

## Requirements

CAT-01, 02, 03, 04, 05, 06, 07. CAT-08 (emergency fund exclusion) is phase 2.

## Catégories

```
┌──────────────────────────────┐
│ ‹ Réglages                   │
│ CATÉGORIES                   │
│ [Dépenses][Revenus][Placements]│
│ ┌──────────────────────────┐ │
│ │ (◉) Alimentation       ▾ │ │
│ │    (◉) Épicerie          │ │
│ │    (◉) Restaurants     ★ │ │
│ │ (◉) Logement           ▸ │ │
│ │ (◉) Transport          ▸ │ │
│ └──────────────────────────┘ │
│ ▸ Archivées (3)              │
│ [ + Ajouter une catégorie ]  │
└──────────────────────────────┘
```

### The tree (CAT-01, 02)

- Three tabs, one per kind (CAT-02): Dépenses, Revenus, Placements. Dépenses is open by
  default. The tab is remembered per browser.
- One row per category: its icon in a filled circle of its colour, the name, a star when
  favourite, and a chevron when it has children. Children are indented one step per level,
  with no depth limit (CAT-01).
- Alphabetical at every level.
- Tapping a row opens its form; the chevron expands or collapses. Expanded parents are
  remembered per browser.

### Archived (CAT-05)

- Archived categories leave the tree and sit in a collapsed section under it,
  "Archivées (3)", one line each: icon, full path ("Transport > Taxi"), and "archivée
  depuis le 3 mars 2024".
- Tapping one opens its form, where it can be reactivated.

## Category form

```
┌──────────────────────────────┐
│ ‹ Annuler  NOUVELLE CATÉGORIE│
│                  Enregistrer │
│        ( ◉ )  Modifier       │
│ Nom          [Restaurants  ] │
│ Type         [Dépense     ▾] │
│ Parent       [Alimentation▾] │
│ Couleur  ● ● ● ● ● ● ● ● ● ● │
│ ☆ Favori                     │
│ ──────────────────────────── │
│ Archiver à partir du …       │
│ Historique                   │
│ Supprimer la catégorie       │
└──────────────────────────────┘
```

- **Icon** at the top, large, in its colour circle. Tap "Modifier" for the icon picker.
- **Nom** required, unique among siblings (two "Autres" under different parents is fine).
- **Type** (CAT-02): expense (default), income, investment. Only top-level categories
  choose; a sub-category takes its parent's type and the field is read-only.
- **Parent**: a picker of active categories of the same type, "Aucun (niveau principal)"
  first. A category cannot be moved under itself or its own children.
- **Couleur**: every category has its own, chosen freely (below). A new sub-category
  starts with a variation of its parent's colour; picking one by hand keeps it.
  "Réinitialiser" returns to the variation.
- **Favori** (CAT-06): a star toggle, the same flag as the star in the picker.
- **Archiver à partir du [date]** (CAT-03): asks for a date (default today). From that
  date the category disappears from pickers; transactions before it keep it. Archiving a
  parent archives its whole branch from the same date; the confirmation names how many
  sub-categories go with it.
  An archived category shows **Réactiver à partir du [date]** instead. A sub-category
  cannot be reactivated while its parent is archived ("Réactivez d'abord {parent}.").
- **Historique** (CAT-03): a timeline of the archive and reactivation events, newest
  first: "Archivée le 3 mars 2024", "Réactivée le 1 janvier 2025".
- **Supprimer la catégorie**: only for a category with no transactions and no children;
  otherwise hidden, and archiving is the way out.
- **Enregistrer et ajouter** (new categories only): saves, then opens a fresh form with
  the same type and parent, for entering a branch one child after another.

### Colours

- **Free choice:** the browser's colour picker (`<input type="color">`, no library), with
  the twenty swatches below as quick picks above it.
- **Sub-categories start from the parent.** A new sub-category gets a variation of its
  parent's colour: same hue, lightness stepped by its place among its siblings, so siblings
  differ. While it is automatic it follows the parent: change the parent's colour and the
  branch follows. A colour picked by hand stays.
- **The icon stays readable on any colour.** The app draws the icon white when white
  reaches 3:1 against the circle (WCAG non-text contrast), otherwise a dark shade of the
  same hue. Nobody has to check contrast by hand.

Quick picks, each tested with a white icon at 3.4:1 or more:

| Key | Colour |
|---|---|
| red | `oklch(0.62 0.16 25)` |
| coral | `oklch(0.62 0.16 38)` |
| orange | `oklch(0.62 0.16 52)` |
| amber | `oklch(0.62 0.135 70)` |
| gold | `oklch(0.62 0.125 88)` |
| olive | `oklch(0.62 0.135 110)` |
| lime | `oklch(0.62 0.16 130)` |
| green | `oklch(0.62 0.16 148)` |
| emerald | `oklch(0.62 0.13 165)` |
| teal | `oklch(0.62 0.105 185)` |
| cyan | `oklch(0.62 0.105 208)` |
| sky | `oklch(0.62 0.12 230)` |
| blue | `oklch(0.62 0.16 255)` |
| indigo | `oklch(0.62 0.16 275)` |
| violet | `oklch(0.62 0.16 295)` |
| purple | `oklch(0.62 0.16 312)` |
| fuchsia | `oklch(0.62 0.16 330)` |
| pink | `oklch(0.62 0.16 350)` |
| rose | `oklch(0.62 0.16 8)` |
| slate | `oklch(0.62 0.03 250)` |

## Icon picker (CAT-07)

- A sheet with a search field and a grid of icons, each in the category's colour circle.
- The set is a curated subset of about 120 coolicons (ADR-020), vendored like the app's
  icons. Each icon carries search words in French and English ("panier, épicerie,
  groceries, cart"). The assistant drafts the list; the author reviews it before the build.
- **Suggested from the name:** while the name is typed, the first icon whose words match
  is used, marked "Suggérée" in the picker. Once the user picks an icon by hand, the name
  no longer changes it. "Réinitialiser" goes back to the suggestion.
- No match: a neutral default (`tag`).

## Category picker (CAT-04, 06)

Used by the transaction form (spec 15), the merchant form and the parent field above.

```
┌──────────────────────────────┐
│ [Rechercher une catégorie  ] │
│ FAVORIS                      │
│ (◉) Alimentation > Restaurants ★│
│ (◉) Transport > Essence      ★│
│ DÉPENSES                     │
│ (◉) Alimentation             │
│    (◉) Épicerie            ☆ │
│ (◉) Logement                 │
│ REVENUS                      │
│ (◉) Salaire                ☆ │
└──────────────────────────────┘
```

- **Favoris** first (CAT-06), each as "Parent > Enfant", with a filled star. They are not
  repeated in the tree below.
- Then the tree, grouped by type, the transaction's own type first.
- A star on every row toggles favourite in place (CAT-06); the row moves to or from
  Favoris after the picker closes, so it does not jump under the finger.
- **Search** matches any part of the path; results show the full path, flat.
- **Archived categories never appear** (CAT-04), as of the transaction's date: a category
  archived in March still appears for a February transaction.
- **Editing an old transaction** whose category is archived: the field shows it with an
  "Archivée" badge, and the picker opens without it, so it can be changed (CAT-04).
- Parents are selectable too: spending can sit on "Alimentation" itself.

## States

- **No category yet:** "Aucune catégorie pour l'instant." and the add button. First run
  (spec 17) is where the first ones are created.
- **Save fails:** values kept, error at the top (SET-07).

## Data

- Reads: `categories`, `category_active_periods` (the view pickers and charts share),
  `category_status_events` for the history.
- Writes, each a server function with the user's session: `saveCategory`,
  `archiveCategory(id, from)`, `reactivateCategory(id, from)`, `setCategoryFavourite`,
  `deleteCategory`.
- `categories.color` stores a hex colour (`#rrggbb`, checked by a constraint);
  `color_is_auto` tells whether it still follows the parent. `icon_is_auto` tells the form whether the name
  still drives the icon.
- The cycle and same-type rules are enforced by a trigger (database.md), not only by the
  form.

## Copy

| Key | Français |
|---|---|
| Screen title | Catégories |
| Tabs | Dépenses, Revenus, Placements |
| Archived section | Archivées ({count}) |
| Archived since | archivée depuis le {date} |
| Empty | Aucune catégorie pour l'instant. |
| Add | Ajouter une catégorie, Enregistrer et ajouter |
| Form titles | Nouvelle catégorie, Modifier la catégorie |
| Fields | Nom, Type, Parent, Couleur, Favori |
| Colour | Couleur personnalisée, Réinitialiser |
| Types | Dépense, Revenu, Placement |
| No parent | Aucun (niveau principal) |
| Archive | Archiver à partir du {date}, Réactiver à partir du {date} |
| Archive branch | {count} sous-catégories seront archivées aussi. |
| Parent archived | Réactivez d'abord {parent}. |
| History | Historique, Archivée le {date}, Réactivée le {date} |
| Delete | Supprimer la catégorie |
| Icon picker | Choisir une icône, Rechercher une icône, Suggérée, Réinitialiser |
| Picker | Rechercher une catégorie, Favoris, Archivée |
