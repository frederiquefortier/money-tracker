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
| 10 | [Settings and currencies](10-settings-currencies.md) | Réglages menu, Devises, display currency switcher in the header | CUR-01..07, SET-06 | Built |
| 11 | [Accounts](11-accounts.md) | Accounts by institution, account form, institution form | ACC-01..07 | Built |
| 12 | [Categories](12-categories.md) | Category tree, category form, icon picker | CAT-01..03, 05, 07 | Built |
| 13 | [Merchants](13-merchants.md) | Merchant list and form, merchant picker | MER-01, 05, TRX-05 | Built |
| 14 | [Transactions](14-transactions.md) | The list (home tab), day groups, converted-amount marker | TRX-04, 09, CUR-06, 07, 09 | Built |
| 15 | [Transaction form](15-transaction-form.md) | Expense and income, splits, foreign currency, the add button, the category picker (built with spec 13) | TRX-01, 02, 05, 06, 09, 10, CUR-08, CAT-04, 06, MER-01 | Built |
| 16 | [Transfer and adjustment](16-transfer-adjustment.md) | Transfer form (fee, two currencies), balance adjustment | TRX-03, 04, 11 | Built |
| 17 | [First run](17-first-run.md) | Language, currencies, first accounts and categories | SET-01 | Reviewed |
| 18 | [Import and export](18-import-export.md) | File check, summary, commit, undo, export | IMP-01, 04, 05, 06, SEC-04 | Reviewed |
| 19 | [People](19-people.md) | Proches and groups, their forms, aliases, in the Réglages menu | PPL-01, 02, 06 | Built |
| 20 | [People on a transaction](20-people-on-transactions.md) | The people list, the people's lines and round add on the receipt, an income's Proche field, avatars and a Proches filter on the list | PPL-03, 04 | Built |
| 21 | [Reimbursements](21-reimbursements.md) | Unknown owed amounts, linking an income to owed lines, what each proche owes | TRX-07, PPL-05 | Built |
| 22 | [Events](22-events.md) | Événements in the Réglages menu: events and types, the automatic link by dates and categories, the event on a transaction and in the filters | EVT-01..03, 07 | Built |

## Shared patterns

Decided on Devises and Comptes (process.md, "Who decided what"); every spec follows them,
and a spec that disagrees is wrong until the author says otherwise. Each names the shared
component to use, so a screen is assembled, not redrawn.

- **Page:** `ListPage` (or the tab's own page), with no back link: the title with
  its buttons beside it, never a button under the list: expand all, the sort
  (`SortMenu`, an outline button with a chevron, like a select, showing the sort icon and
  the current order, "Trier: …" as its accessible name; kept per browser). Adding is
  never beside the title: every screen, at every width, has one round + button bottom
  right, above the tab bar on phones, with "Ajouter un compte" as its accessible name,
  and the first stop when tabbing into a page's content, after the header and menu
  (`AddButtonTarget` at the start of `main`). Every focusable element shows the shared
  outline (`focusRing`), after keyboard navigation only (`useKeyboardFocus`: from a Tab
  until the next pointer press, since text fields match `:focus-visible` on a click); inside a container that clips (a card, a row scrolling
  sideways) it is drawn within the element (`insetFocus`), so it is never cut. Stacked
  icons (a split's categories, a group's members) are separated by a ring of the row's
  own colour, white, purple on hover, blue when pending (`stackRing`). A
  screen that adds one thing goes straight to its form (`FloatingAddLink`); one that
  adds several (`FloatingAddButton`) (Comptes: Compte, Institution) turns the + into a ✕ and fans the choices
  out one after another on a quarter circle, from its left upwards, as round icons only, the noun as tooltip and accessible name. Escape, a tap
  outside or a choice closes it. A
  menu opens at least as wide as its button, aligned to it, and grows to fit its labels
  rather than cutting them. A list that filters has the filter before the sort, the
  same kind of button (`ChoiceMenu`): an icon for what it filters and the current choice,
  "Filtrer: …" as its accessible name. `SortMenu` is built on it. A list filtered on
  several things at once (Transactions) has a row of bubbles instead (`chip`, one height
  for all): the period, then a button per filter, filled and naming the one ticked or
  how many while in use; on phones a single Filtres button opening on the first filter.
  Each opens one sheet on its tab (`FilterSheet`): tabs with
  counts, a search for the open tab, lists of checkboxes (`CheckList`), several ticked
  at once, each applying as it is ticked, their cards with a form field's 4px corners and input border (`fieldCard`), and a footer with Effacer and "Voir 128
  résultats". A whole row is the tap target, the box at its end. Only groups fold, each
  a card like an institution's on Comptes, its name folding it and "Tout" ticking all of
  it. Order, left to right:
  expand all, filter, sort. Sort and expand all are on pages only, never in a sheet or a
  list over a form (decided 2026-11-05).
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
- **Errors and missing pages:** a page that cannot load, or an address that leads
  nowhere, shows a centred card (`MessageCard`, as for the screens still to come) in the
  user's language, with Réessayer or Retour à l’accueil. The router uses them for every
  route (`RouteError`, `RouteNotFound`).
- **Confirmations:** `ConfirmDialog`, red title and button: "Supprimer “{name}”" and
  "Cette action est irréversible.", or a sentence naming what else is affected.
- **Forms:** a route sheet over the list (`RouteSheet`, `SheetForm`) with its own URL:
  full screen on a phone, a panel from the right from `md` up. Its body only edits: no
  archive or delete buttons among the fields (on phones they are in the header, above).
  Closing with something typed or chosen asks "Abandonner les modifications?" first. Annuler and one "Enregistrer" in the footer; saving closes it
  with a toast. Errors from the server, a lost connection included, show in the sheet
  above the buttons; validation stays under each field, and focus moves to the first one
  (SET-07). Every such form runs on `useSheetForm`, which owns all of this. Opening, closing or
  switching sheets keeps the list's scroll: sheet routes carry `staticData.sheet`, and
  the router skips scroll restoration for them.
- **Fields:** the shared ones (`FormField`, `SelectField`, `CheckboxField`,
  `LinkedFields`). Every date is `DatePickerField`, and a range `DateRangeField` (ADR-028): typed segments (jj/mm/aaaa), and a calendar up from the bottom of the sheet or dialog, half its height in a sheet, over a dim backdrop; a range is one band with no gap. `LinkedFields` wraps only the sub-field, never the field it belongs to. Required fields carry an asterisk, no legend, no "(facultatif)".
- **Choosing from the user's own items:** `Combobox`, typed into the field: it filters,
  offers "Créer « … »" when that makes sense (`useInlineCreate`: a failure is a toast,
  the new item is chosen), and a × clears it. Several choices in a form (a person's groups, spec 19)
  are the filters' `CheckList` under a field label, as in a filter sheet; creating one
  there is the card's last row, a "+ Nouveau …" button that becomes a name field
  (`CreateRow`). Escape leaves the field only: `useSheetEscape` keeps a stack, the
  innermost layer first. A check row can carry a muted second line and something on
  its right (`detail`, `aside`), as a transaction row does. People are grouped the same
  way everywhere they are ticked (the filter, a transaction's people list): `usePeopleTree`. A list over the
  form (the categories, the people) takes the field's radius and border too.
  When creating needs a whole form (a category from the
  transaction form), the same "+ …" row (`CreateButton`) opens it in a `FormSheet` over
  the sheet: a `RouteSheet` without a URL, saving and asking before discarding the same
  way. Nothing chosen is an
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
- **Search:** only on lists that grow long (Magasins, Catégories, the icon picker,
  Transactions), a `SearchField` with a magnifier inside it above the list (and above the tabs, when a list has them; in a sheet, under its tabs and staying put above the scrolling list, `SheetHead`, in every sheet that searches), filtering as you type, ignoring case and accents. The
  words are the same everywhere: "Rechercher" and "Aucun résultat.", never naming the
  thing searched.
- **Round pickers:** a round button that opens a picker (a category's icon) shows a
  small badge in its corner, `EditHint`: a pencil when it holds a choice, on hover and
  focus and always on touch screens; a plus on an empty dashed circle, the same way (hover,
  focus, touch), its border darkening to the primary colour on hover and focus.
- **Accounts** are always named with their institution, "Chèque (Desjardins)"
  (`accountLabel`): in lists, fields, pickers and chips. Comptes, which groups them under
  their institution, is the one place they stand alone.
- **Amounts** are Inconsolata at one size (`Money`), the cents not shrunk.
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
