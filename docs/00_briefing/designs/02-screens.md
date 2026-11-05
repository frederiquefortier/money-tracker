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
| 13 | [Merchants](13-merchants.md) | Merchant list and form, merchant picker | MER-01, 05, TRX-05 | Built |
| 14 | [Transactions](14-transactions.md) | The list (home tab), day groups, converted-amount marker | TRX-04, 09, CUR-06, 07, 09 | Reviewed |
| 15 | [Transaction form](15-transaction-form.md) | Expense and income, splits, foreign currency, the add button, the category picker (built with spec 13) | TRX-01, 02, 05, 06, 09, 10, CUR-08, CAT-04, 06, MER-01 | Built |
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
  the current order, "Trier: …" as its accessible name; kept per browser). Adding is
  never beside the title: every screen, at every width, has one round + button bottom
  right (`FloatingAddButton`), above the tab bar on phones, with "Ajouter un compte" as
  its accessible name. A screen that adds one thing goes straight to its form; one that
  adds several (Comptes: Compte, Institution) turns the + into a ✕ and fans the choices
  out on a quarter circle as round icons only, the noun as tooltip and accessible name. Escape, a tap
  outside or a choice closes it. A
  menu opens at least as wide as its button, aligned to it, and grows to fit its labels
  rather than cutting them. A list that filters has the filter before the sort, the
  same kind of button (`ChoiceMenu`): an icon for what it filters and the current choice,
  "Filtrer: …" as its accessible name. `SortMenu` is built on it. Order, left to right:
  expand all, filter, sort.
- **Lists:** cards (`ListCard`), one line per item where it fits. Tapping an item opens
  its form. A card header (an institution) is a row too: tapping the line opens its form,
  its chevron alone toggles the card, as for a tree's parent; a header with no form ("Sans
  institution") toggles from its name (`CollapseToggle`). Every chevron and icon action
  has the same hover, a rounded square behind the icon (`iconAction`, `iconHover`), the
  sheet's and dialogs' ✕ included. In a tree, every row opens its form; a parent's chevron alone toggles its
  branch, and children are joined to it by elbow connectors, as in a tree diagram. A list
  that collapses has an icon button beside the title to open or close everything, in
  every tab (`ExpandAllButton`, "Tout déplier", "Tout replier"). Collapsed state is remembered per
  browser (`useStoredState`).
- **Row actions:** icons in a fixed slot at the end of the row (`IconActions`,
  `IconButton`): add (a child, in a tree), default (currencies), archive or reactivate, trash, in that
  order. On phones the rows carry none: the same icons sit in the item's sheet header,
  beside the ✕ (`RouteSheet` `actions`, `placement="sheet"`), so a row keeps its width for
  the name and the amount. A row whose item has no sheet (currencies) keeps them at every
  width. Delete is always the `trash-full` icon. A change shows at once and
  stays until the saved data comes back. An action that cannot apply is muted, and a tap
  says why in a toast. Any failure is a toast.
- **Archive:** the interface word is "Archiver"; a dialog asks the date (default today).
  Archived items sit in a collapsed "… archivé(e)s ({count})" section under the list, flat
  and muted, with "Archivé(e) le …" and the actions on the first line.
- **Confirmations:** `ConfirmDialog`, red title and button: "Supprimer “{name}”" and
  "Cette action est irréversible.", or a sentence naming what else is affected.
- **Forms:** a route sheet over the list (`RouteSheet`, `SheetForm`) with its own URL:
  full screen on a phone, a panel from the right from `md` up. Its body only edits: no
  archive or delete buttons among the fields (on phones they are in the header, above).
  Closing with something typed or chosen asks "Abandonner les modifications?" first. Annuler and one "Enregistrer" in the footer; saving closes it
  with a toast. Errors from the server show in the sheet above the buttons; validation
  stays under each field, and focus moves to the first one (SET-07).
- **Fields:** the shared ones (`FormField`, `SelectField`, `CheckboxField`,
  `LinkedFields`). Dates are native (`FormField` with `type="date"`, ADR-024). `LinkedFields` wraps only the sub-field, never the field it belongs to. Required fields carry an asterisk, no legend, no "(facultatif)".
- **Choosing from the user's own items:** `Combobox`, typed into the field: it filters,
  offers "Créer « … »" when that makes sense, and a × clears it. Nothing chosen is an
  empty field, never "Aucun(e)". The chosen option is tinted (the accent background,
  semibold), as in a native select, with no check and no slot for one; options under a
  group heading (an institution, a category type) sit one step in; hover and the
  keyboard's position are grey. A popup takes its trigger's radius and border: a field's
  list (`Combobox`) the field's 4px corners and input border; the menus of round buttons
  and chips (sort, filter, currency chips) stay round. (`cn` knows `rounded-field`, so it
  replaces the popover's default radius.) Options can sit in labelled groups and
  show a `Tag` in the field while chosen ("Archivée"). A category is always chosen with
  `CategoryPicker`, except the transaction form, whose category row opens a full-screen list (spec 15). Categories are listed as the Catégories page
  draws them, everywhere (the picker, Parent, the Magasins filter): a tree with elbow
  connectors (`TreeGuides`), each with its icon and its name; the field shows the full
  path once chosen. A search keeps each match's parents.
- **Search:** only on lists that grow long (Magasins, Catégories, the icon picker), a
  `SearchField` above the list (and above the tabs, when a list has them), filtering as you type, ignoring case and accents. The
  words are the same everywhere: "Rechercher" and "Aucun résultat.", never naming the
  thing searched.
- **Round pickers:** a round button that opens a picker (a category's icon) shows a
  small badge in its corner, `EditHint`: a pencil when it holds a choice, on hover and
  focus and always on touch screens; a plus on an empty dashed circle, the same way (hover,
  focus, touch), its border darkening to the primary colour on hover and focus.
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
