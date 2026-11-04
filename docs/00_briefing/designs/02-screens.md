# Screens, phase 1

One spec per screen, written and reviewed before the screen is built (roadmap, phase 1).
The layout follows [00-layout-reference.md](00-layout-reference.md), the look
[01-visual-direction.md](01-visual-direction.md).

## Map

In build order. Each screen depends only on the ones above it. First run comes before
import: the owner sets up accounts and categories fresh, then imports the cleaned history
onto them.

| # | Spec | Screens | Requirements | Status |
|---|---|---|---|---|
| 10 | [Settings and currencies](10-settings-currencies.md) | Réglages hub, Devises, display currency switcher in the header | CUR-01..07, SET-06 | Built |
| 11 | [Accounts](11-accounts.md) | Accounts by institution, account form, institution form | ACC-01..07 | Built |
| 12 | [Categories](12-categories.md) | Category tree, category form, icon picker | CAT-01..03, 05, 07 | Built |
| 13 | [Merchants](13-merchants.md) | Merchant list and form, merchant picker | MER-01, 05, TRX-05 | Built (the picker with spec 15) |
| 14 | [Transactions](14-transactions.md) | The list (home tab), day groups, converted-amount marker | TRX-04, 09, CUR-06, 07, 09 | Reviewed |
| 15 | [Transaction form](15-transaction-form.md) | Expense and income, splits, foreign currency, the add button, the category picker (built with spec 13) | TRX-01, 02, 05, 06, 09, 10, CUR-08, CAT-04, 06, MER-01 | Reviewed |
| 16 | [Transfer and adjustment](16-transfer-adjustment.md) | Transfer form (fee, two currencies), balance adjustment | TRX-03, 04, 11 | Reviewed |
| 17 | [First run](17-first-run.md) | Language, currencies, first accounts and categories | SET-01 | Reviewed |
| 18 | [Import and export](18-import-export.md) | File check, summary, commit, undo, export | IMP-01, 04, 05, 06, SEC-04 | Reviewed |

## Shared patterns

Decided on Devises and Comptes (process.md, "Who decided what"); every spec follows them,
and a spec that disagrees is wrong until the author says otherwise. Each names the shared
component to use, so a screen is assembled, not redrawn.

- **Page:** `SettingsPage` (or the tab's own page): "← Réglages" top left, the title with
  its buttons beside it, never a button under the list: expand all, the sort
  (`SortMenu`, an outline button with a chevron, like a select, showing the sort icon and
  the current order, "Trier: …" as its accessible name; kept per browser), then
  one `AddButton` per thing the screen adds: a plus and the noun, "+ Compte",
  "+ Catégorie", with "Ajouter un compte" as its accessible name, never an add menu. A
  menu opens at least as wide as its button, aligned to it, and grows to fit its labels
  rather than cutting them. A list that filters has the filter before the sort, the
  same kind of button (`ChoiceMenu`): an icon for what it filters and the current choice,
  "Filtrer: …" as its accessible name. `SortMenu` is built on it. Order, left to right:
  expand all, filter, sort, then the add buttons, so the sort always sits next to them.
- **Lists:** cards (`ListCard`), one line per item where it fits. Tapping an item opens
  its form. A card header (an institution) toggles with `CollapseToggle` and edits with a
  pencil. In a tree, every row opens its form; a parent's chevron alone toggles its
  branch, and children are joined to it by elbow connectors, as in a tree diagram. A list
  that collapses has an icon button beside the title to open or close everything, in
  every tab (`ExpandAllButton`, "Tout déplier", "Tout replier"). Collapsed state is remembered per
  browser (`useStoredState`).
- **Row actions:** icons in a fixed slot at the end of the row (`IconActions`,
  `IconButton`): add (a child, in a tree), star, archive or reactivate, trash, in that
  order. Delete is always the `trash-full` icon. A change shows at once and
  stays until the saved data comes back. An action that cannot apply is muted, and a tap
  says why in a toast. Any failure is a toast.
- **Archive:** the interface word is "Archiver"; a dialog asks the date (default today).
  Archived items sit in a collapsed "… archivé(e)s ({count})" section under the list, flat
  and muted, with "Archivé(e) le …" and the actions on the first line.
- **Confirmations:** `ConfirmDialog`, red title and button: "Supprimer “{name}”" and
  "Cette action est irréversible.", or a sentence naming what else is affected.
- **Forms:** a route sheet over the list (`RouteSheet`, `SheetForm`) with its own URL:
  full screen on a phone, a panel from the right from `md` up. It only edits: no archive
  or delete buttons inside. Annuler and one "Enregistrer" in the footer; saving closes it
  with a toast. Errors from the server show in the sheet above the buttons; validation
  stays under each field, and focus moves to the first one (SET-07).
- **Fields:** the shared ones (`FormField`, `SelectField`, `CheckboxField`,
  `LinkedFields`). `LinkedFields` wraps only the sub-field, never the field it belongs to. Required fields carry an asterisk, no legend, no "(facultatif)".
- **Choosing from the user's own items:** `Combobox`, typed into the field: it filters,
  offers "Créer « … »" when that makes sense, and a × clears it. Nothing chosen is an
  empty field, never "Aucun(e)". Options can sit in labelled groups, end with one icon
  action (the star), and show a `Tag` in the field while chosen ("Archivée"). A category
  is always chosen with `CategoryPicker`. Categories are listed as the Catégories page
  draws them, everywhere (the picker, Parent, the Marchands filter): a tree with elbow
  connectors (`TreeGuides`), each with its icon and its name; the field shows the full
  path once chosen. A search keeps each match's parents.
- **Search:** only on lists that grow long (Marchands, Catégories, the icon picker), a
  `SearchField` above the list, filtering as you type, ignoring case and accents. The
  words are the same everywhere: "Rechercher" and "Aucun résultat.", never naming the
  thing searched.
- **Tags:** a short status beside a name ("Par défaut", "Archivée") is a `Tag`.
- **No helper text:** no hints under fields, legends or explanatory sentences. If a field
  needs explaining, fix its label or the layout. A reason for something unavailable goes
  in the toast on tap.
- **Action words** come from the shared `common` keys, the same everywhere: Ajouter,
  Modifier, Réinitialiser, Retirer, Archiver, Réactiver, Supprimer, and "{verb} “{name}”"
  for icon labels and dialog titles. A button reads "Supprimer", never "Supprimer la
  catégorie".
- **Copy:** names quoted as “{name}” in titles and labels; "Créer « {text} »"; no space
  before `: ; ? !` in French; empty states read "Aucun … pour l'instant.".

## Format of a spec

1. **Purpose**: what the screen is for, in two or three sentences.
2. **Requirements**: the IDs it covers.
3. **Layout**: a phone-width sketch, then what changes from `md` up.
4. **Content and behaviour**: each element, what it shows, what a tap does.
5. **States**: empty, loading, error, and any edge case.
6. **Data**: tables read and written, server functions.
7. **Copy**: the French strings (the source language); English is written at build time.
8. **Open questions**: for the author, removed once answered.
