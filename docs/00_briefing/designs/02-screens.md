# UI conventions

Rules every screen follows. A screen that disagrees with them is wrong until the author says otherwise. The shared components that implement them are in `src/app/src/components/`; reasons and rejected options are in [design-decisions.md](design-decisions.md). Layout follows [00-layout-reference.md](00-layout-reference.md), the look [01-visual-direction.md](01-visual-direction.md).

## Screens still to build

| Spec | Requirements |
|---|---|
| [First run](17-first-run.md) | SET-01 |
| [Export](18-export.md) | IMP-04, SEC-04 |
| [Holdings](19-holdings.md) | NW-01, 02, 03 |
| [Net worth](20-net-worth.md) | NW-10, ACC-06 |
| [Institutions](21-institutions.md) | ACC-05 |

Everything else in phases 1 to 3 is built; read the code.

## Rules

- **Page:** the title with its buttons beside it. A page opened from a hub card has "‹ {hub}" above the title, back to the hub; a tab or menu page has no back link, and a sheet closes instead. Order of controls: expand all, filter, sort. Adding is one round + bottom right, never beside the title.
- **Lists:** cards, one line per item. Tapping an item opens its form. A chevron alone toggles a card or a tree branch. Collapsed state is remembered per browser.
- **Row actions:** icons at the end of the row from `md` up; on phones they move to the item's sheet header, so the row keeps its width. Delete is always `trash-full`. An action that cannot apply is muted, and a tap says why in a toast. Any failure is a toast.
- **Archive:** the word is "Archiver", a dialog asks the date (default today). Archived items sit in a collapsed "… archivé(e)s (n)" section, flat and muted.
- **Confirmations:** red title and button, "Supprimer “{name}”" then "Cette action est irréversible.", or a sentence naming what else is affected.
- **Forms:** a route sheet over the list with its own URL, sliding in from the right (full screen on a phone). The body only edits: no archive or delete among the fields. Closing with unsaved changes asks "Abandonner les modifications?". Annuler and one Enregistrer in the footer; saving closes with a toast. Server errors show above the buttons, validation under each field, and focus moves to the first error.
- **Choosing from the user's own items:** a combobox that filters, offers "Créer « … »" when it makes sense, and clears with ×. Nothing chosen is an empty field, never "Aucun(e)". Required fields carry an asterisk.
- **Categories** are always shown as the Catégories page draws them: a tree with elbow connectors, icon and name; the field shows the full path once chosen.
- **Accounts** are always named with their institution, "Chèque (Desjardins)", except on Comptes.
- **Search** only on lists that grow long, "Rechercher" and "Aucun résultat.", ignoring case and accents.
- **Amounts** are Inconsolata at one size.
- **Focus** shows after keyboard use only, drawn inside elements that clip.
- **Errors and missing pages** show a centred card with Réessayer or Retour à l'accueil.
- **No helper text.** No hints under fields, legends or explanatory sentences.

## Copy

- Action words come from the shared `common` keys: Ajouter, Modifier, Retirer, Archiver, Réactiver, Supprimer. A button says "Supprimer", never "Supprimer la catégorie".
- Names quoted as “{name}”; "Créer « {text} »"; no space before `: ; ? !` in French; empty states read "Aucun … pour l'instant.".

## Format of a spec (for screens not yet built)

Purpose, requirement IDs, a phone-width sketch only if the layout is not obvious, behaviour and edge cases, open questions for the author. No data section, no copy tables: the code and the i18n files hold those.
