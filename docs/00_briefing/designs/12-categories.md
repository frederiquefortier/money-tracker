# Categories

**Status:** reviewed 2026-11-03; built 2026-11-03. Shared rules:
[02-screens.md](02-screens.md#shared-patterns).

## Purpose

The category tree is how spending gets read: the dashboard, budgets and the yearly review
all group by it. This spec covers the Catégories screen (the tree and its archive), the
category form with its icon and colour. The category picker the transaction form uses is
spec 15. Reached from Réglages.

## Requirements

CAT-01, 02, 03, 05, 07, 09, 10. CAT-04 and CAT-06 (Fréquentes, in the picker) are spec 15.
CAT-08 (emergency fund exclusion) is phase 4.

## Catégories

```
┌──────────────────────────────────┐
│ ← Réglages                       │
│ CATÉGORIES            [⇕][Tri▾]  │
│ [Rechercher                    ] │
│ [Dépenses][Revenus][Placements]  │
│ ┌──────────────────────────────┐ │
│ │ ▾ (◉) Alimentation    + ▣ 🗑 │ │
│ │ ├──── (◉) Épicerie    + ▣ 🗑 │ │
│ │ └──── (◉) Restaurants + ▣ 🗑 │ │
│ │ ▸ (◉) Logement        + ▣ 🗑 │ │
│ │   (◉) Loisirs         + ▣ 🗑 │ │
│ └──────────────────────────────┘ │
│ ▸ Catégories archivées (3)       │
│                              (+) │
└──────────────────────────────────┘
```

### The tree (CAT-01, 02)

- Three tabs, one per kind (CAT-02): Dépenses, Revenus, Placements. Dépenses is open by
  default. The tab is remembered per browser.
- The round + bottom right (shared patterns) opens the form with the open tab's type.
- **Tout déplier / Tout replier** (CAT-09, `ExpandAllButton`), an icon button beside the
  title, opens every branch in every tab, or closes them all once all are open.
- One row per category: its icon in a filled circle of its colour, then the name.
  Children are indented one step per level, with no depth limit (CAT-01).
- **Trier** (CAT-09), the shared `SortMenu` beside the title (an outline button with a
  chevron, like a select): Nom (alphabetical at every
  level, the default) or Couleur (rainbow order from red at every level, greys last).
  Kept per browser. Sibling colours are always worked out in alphabetical order, so
  sorting never recolours a branch.
- **Search** (`SearchField`) above the tabs (moved there 2026-11-05), searching the open
  tab, ignoring case and accents.
  The tree keeps each matching category with its parents, opened so the match shows;
  the archived section keeps the matches by name and opens. "Tout déplier" hides while
  searching. Nothing found: "Aucun résultat.".
- **Every row opens its form on tap**, with or without children, like an account row.
- **A category with children** has a chevron before its icon (a leaf has the same space
  empty, so names line up). The chevron alone opens or closes the branch; expanded
  parents are remembered per browser.
- **Connectors**, as in a tree diagram: each child is joined to its parent by an elbow, a
  line down from the parent's chevron, then across to the child's chevron (or its icon
  when it has no children). The line continues to the next sibling and stops at the last
  one. Drawn in the plum of the linked-field line.
- **Row actions** (in the sheet header on phones, shared patterns), as icons in the fixed
  slot at the end of every row: add a sub-category, archive, and trash. (A favourite star was here until
  2026-11-04; the picker's "Fréquentes" replaced it, spec 15.)
  - **Add** (the +) opens the form with this category as the parent, so a child is added
    where it goes without scrolling back to the top. The branch opens, so the new child
    shows once saved. Archived rows have no +.
  - **Archive** (CAT-03) asks for a date (default today) in the shared confirmation. From
    that date the category disappears from pickers; transactions before it keep it.
    Archiving a parent archives its whole branch from the same date; the confirmation
    names how many sub-categories go with it. An optional second date, "Réactivée le"
    (today at most), makes it a past period instead: archived between the two dates and
    active again after, for the years a category paused in the spreadsheet. The branch
    gets the same period, each sub-category that was active throughout it. A period that
    overlaps another archived one is refused ("Cette période chevauche une autre période
    archivée.").
  - **Trash** deletes a category with no transactions and no children, confirmed in red.
    While it has children it is muted, and a tap says why in a toast.
  - A failed action says so in a toast.

### Archived (CAT-05)

- Archived categories leave the tree and sit in a collapsed section under it,
  "Catégories archivées (3)", like "Comptes archivés": muted, drawn as the same tree
  (chevrons and connectors). An archived branch keeps its shape under its archived
  parent. A category whose parent is still active starts a branch at the top, with its
  full path ("Transport > Taxi"). "Archivée le 3 mars 2024" sits on the right, before the
  actions, on the top rows and on any row archived on another date than its parent.
- Actions: reactivate (the undo icon, with a date) and trash. Reactivating a
  sub-category under an archived parent brings that parent back too, from the same date,
  up to the first active one; the confirmation names them ("“Maison” sera aussi
  réactivée."). Their other sub-categories stay archived.
- Tapping the row opens its form.

## Category form

```
┌──────────────────────────────┐
│ NOUVELLE CATÉGORIE         ✕ │
│ [Dépense][Revenu][Placement] │
│                              │
│ ╭─────╮ ●●●●●●●●●●●          │
│ │ ⌂ ✎ │ ●●●●●●●●◎↺           │
│ ╰─────╯                      │
│ Nom *    [Restaurants      ] │
│ Parent   [Alimentation    ✕] │
│ Priorité                     │
│ (•) Comme Alimentation       │
│     (Besoin)                 │
│ ( ) Besoin                   │
│ ( ) Envie                    │
│ ──────────────────────────── │
│ Historique (read-only)       │
│        Annuler  Enregistrer  │
└──────────────────────────────┘
```

The form is a route sheet over the tree, like the account form: its body only edits, with
one "Enregistrer" at the bottom. Reordered on 2026-11-05: the type as tabs, the
appearance first, need or want as radios.

- **Type** (CAT-02) as the shared tabs at the top (`KindTabs` with singular labels:
  Dépense, Revenu, Placement), as on the transaction form. It decides the parents and
  whether need or want shows. A sub-category takes its parent's type: the whole bar is
  disabled (`TabList` `disabled`), the current tab still shown.
- **Appearance**, with no visible labels: the icon in its 64px colour circle on the
  left, the colours filling the space beside it.
  - Tapping the circle opens the icon picker; a pencil appears on it on hover and focus,
    and always on touch screens.
  - The colours in eleven columns, two rows, centred on the circle: nineteen quick picks
    and the custom circle (below). About 19px each on a phone, 6px apart, so each still
    has a 24px target area without overlap (WCAG 2.5.8). A new sub-category starts with a variation of its
    parent's colour; picking one by hand keeps it, and a 21st circle, an undo icon
    ("Réinitialiser"), the last spot of the second row, returns to the variation.
- **Nom** required, unique among siblings (two "Autres" under different parents is fine).
  The suggested icon above follows it as it is typed.
- **Parent**: the shared combobox, typed and filtered, listing active categories of the
  type as the tree above (connectors, icon, name), the full path in the field once
  chosen. Empty means top level; a × empties it, as for the account's institution. A
  category cannot be moved under itself or its own children.
- **Priorité** (CAT-10, built 2026-11-05), on the Dépense tab only: three radios under
  the label, one per line (`RadioGroupField`, native radios drawn like the checkbox; the
  chosen one a plum dot inside a white ring, the card's colour in dark mode).
  - The first stores nothing and is chosen by default. On a top-level category it reads
    "Non classée". On a sub-category it reads "Comme {parent} ({value})": the direct
    parent's name and the value it follows from the nearest marked parent, or "non
    classée" under an unmarked branch. Following keeps up with later changes to the
    parent.
  - Then Besoin and Envie, the category's own mark.
- **Assignée aux frais** (TRX-04, CUR-08, decided 2026-11-05), on the Dépense tab only:
  a checkbox, then a round info button opening a popover (tap or click): "Les frais de
  conversion, payés quand une transaction ou un transfert change de devise, et les frais
  de transaction d'un transfert vont tous dans cette catégorie." One category holds the
  role: ticking it on another takes it over on save and moves the transfer fees already
  saved; the one holding it shows it ticked and disabled. In the tree, that row has a
  "Frais" tag after its name, like Devises' "Par défaut".
  - Tried first the same day: a select, a pill with house and heart icons, unlabelled
    chips, then two field-styled buttons (with the inherited one dashed, then with the
    parent's icon, then with "Comme {parent}" under the word). Two buttons cannot show
    three states, so following the parent became a choice of its own.
  - Absent on income and investment categories: income has no mark, investments count as
    savings. Switching a top-level category to another type clears the marks of its
    branch.
  - The tree shows nothing for it; the dashboard reads it (DSH-09).
- **Historique** (CAT-03), when the category has one: the archive and reactivation
  events, newest first, as a two-column table: the short date on the left, the action on
  the right ("27/05/2027 | Archivée"). An event that came through another category
  names it: "Archivée avec “Animaux”" on a sub-category archived with its parent,
  "Réactivée avec “Chat”" on a parent brought back by its sub-category. Lines between the
  rows and between the columns, none around the table. Archive, reactivate and delete are row actions, never among the sheet's fields.

### Colours

- **Free choice:** nineteen quick picks (below), and a twentieth circle for any colour:
  the browser's colour picker (`<input type="color">`, no library). It shows a rainbow
  until a custom colour is picked, then that colour inside a rainbow ring, selected like
  the swatches. Its name, "Couleur personnalisée", is for screen readers and the tooltip.
- **Each top-level category stands apart.** A new one gets the first quick pick no other
  top-level category of its type uses. In the form, a quick pick already used by another
  top-level category of the type carries a small dot (and "déjà utilisée" for screen
  readers); it can still be picked.
- **Sub-categories start from the parent.** A new sub-category gets a variation of its
  parent's colour, by its place among its siblings: candidates one hue step (12°) either
  way and up to three lightness steps (0.06) around the parent, never the parent itself,
  and each next sibling as far as possible from the ones before it, so siblings differ.
  Yellows and oranges are never darkened below 0.75 lightness, where they turn brown, and
  yellow-greens stay above 0.86, where they would turn olive. Every quick pick gives at
  least three distinct sibling colours (yellow), most give seven or more, before they
  repeat. While it is automatic it follows the parent:
  change the parent's colour and the branch follows. A colour picked by hand stays.
- **The icon stays readable on any colour.** The app draws the icon white when white
  reaches 3:1 against the circle (WCAG non-text contrast), otherwise a dark shade of the
  same hue. Nobody has to check contrast by hand.

Quick picks: clean, saturated colours built around the five the author chose (ruby,
yellow, green, royal, purple), with a true pink, deep ones with a white icon and bright
ones with a dark icon, every pair far enough apart to tell (a test checks it). The grid
runs in rainbow order. No browns; slate is the one quiet colour, for catch-alls.

| Key | Colour |
|---|---|
| ruby | `#c30839` |
| burgundy | `#850e2c` |
| coral | `#f45340` |
| tangerine | `#fe7802` |
| amber | `#fea91e` |
| yellow | `#ffcc00` |
| lime | `#8bd737` |
| green | `#218b30` |
| forest | `#095c34` |
| aqua | `#1ed1cd` |
| cyan | `#11a7d7` |
| royal | `#0754c6` |
| navy | `#132e7f` |
| indigo | `#5828c4` |
| purple | `#8d35c0` |
| lavender | `#bf89ec` |
| plum | `#6b2470` |
| pink | `#f83599` |
| slate | `#5a6a80` |

**Colour by theme.** Top-level colours follow meaning around the wheel, so related
categories sit next to each other and a colour sort reads as a rainbow: the body (health
red, sport coral), food tangerine, family and community (Communauté yellow, holding
gifts and donations, then pets lime), the home (housing green, education forest),
getting around (transport cyan, travel royal), admin and tech (bank fees navy,
electronics indigo), then free time and appearance (hobbies lavender, outings purple,
clothes plum, beauty pink), and slate for everything else. Income and investments reuse the same meanings where they apply (government navy).

## Icon picker (CAT-07)

- A sheet with a search field and a grid of icons, each in the category's colour circle.
- The set is a curated subset of about 150 coolicons (ADR-020), vendored like the app's
  icons. Each icon carries search words in French and English ("panier, épicerie,
  groceries, cart"), always including the icon's own name. The assistant drafts the list;
  the author reviews it before the build.
- **Suggested from the name:** while the name is typed, the first icon whose words match
  is used, marked "Suggérée" in the picker. A whole word of the name (or its plural) wins
  over a word the name only begins, so "Transport" finds the car before "transport en
  commun" finds the bus. Once the user picks an icon by hand, the name
  no longer changes it. Picking the "Suggérée" icon hands the icon back to the name.
- No match: a neutral default (`tag`).

## States

- **No category yet:** "Aucune catégorie pour l'instant." and the add button. First run
  (spec 17) is where the first ones are created.
- **Save fails:** values kept, the error above the sheet's buttons (SET-07).

## Data

- Reads: `categories`, `category_active_periods` (the view pickers and charts share),
  `category_status_events` for the history.
- Writes, each a server function with the user's session: `saveCategory`,
  `archiveCategory(id, from)`, `reactivateCategory(id, from)`,
  `addCategoryPause(id, from, until)`, `deleteCategory`.
- `categories.color` stores a hex colour (`#rrggbb`, checked by a constraint);
  `color_is_auto` tells whether it still follows the parent. `icon_is_auto` tells the form whether the name
  still drives the icon.
- `categories.necessity` is `need`, `want` or null. The form works out what a null
  follows from the loaded tree (`inheritedNecessity`); the dashboard will read the
  `category_necessity` view (DSH-09).
- The cycle and same-type rules are enforced by a trigger (database.md), not only by the
  form.

## Copy

| Key | Français |
|---|---|
| Screen title | Catégories |
| Tabs | Dépenses, Revenus, Placements |
| Archived section | Catégories archivées ({count}) |
| Archived on | Archivée le {date} |
| Empty | Aucune catégorie pour l'instant. |
| Add | Catégorie (named Ajouter une catégorie, also the sheet title) |
| Form titles | Nouvelle catégorie, Modifier la catégorie |
| Fee category | Assignée aux frais, À propos de la catégorie des frais, the popover's text above, tag Frais |
| Fields | Nom, Parent, Priorité; Couleur as the colour group's name for screen readers |
| Need or want | Non classée, Comme {parent} ({value}), non classée, Besoin, Envie |
| Colour | Couleur personnalisée (the custom circle's accessible name), Couleur {n}, déjà utilisée |
| Expand | Tout déplier, Tout replier |
| Sort | Nom, Couleur; Trier: {sort} (accessible name) |
| Types | Dépense, Revenu, Placement |
| Clear parent | Retirer le parent |
| Archive | À partir du, Réactivée le (the verbs are the shared ones) |
| Past period | Cette période chevauche une autre période archivée. |
| Archive branch | {count} sous-catégories seront aussi archivées. |
| Parent archived | Réactivez d'abord “{parent}”. (a past period only) |
| Reactivate parents | {names} sera aussi réactivée. / {names} seront aussi réactivées. |
| Has children | Cette catégorie a des sous-catégories. |
| History | Historique, Archivée, Réactivée, Archivée avec “{name}”, Réactivée avec “{name}” |
| Search | Rechercher, Aucun résultat. (shared, also in the icon picker) |
| Icon picker | Choisir une icône, Suggérée |
