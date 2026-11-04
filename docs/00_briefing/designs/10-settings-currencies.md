# Settings and currencies

**Status:** reviewed 2026-11-03; built 2026-11-03, see Build notes. Shared rules:
[02-screens.md](02-screens.md#shared-patterns).

## Purpose

Réglages is the home of everything set up once and rarely touched: accounts, categories,
merchants, currencies, import. Devises manages the currencies the user works with and the
default used to prefill forms. The display currency switcher, in the header, picks the
currency every amount is shown in.

## Requirements

CUR-01, 02, 03, 04, 05, 06, 07 (conversion rule, shown here as the switcher's effect),
SET-06 (currency names in both languages). CUR-09, the converted-amount marker, belongs to
the transactions list (spec 14).

## Réglages hub

```
┌──────────────────────────────┐
│ [logo] MONEY TRACKER CAD▾ FR EN│
├──────────────────────────────┤
│ RÉGLAGES                     │
│ ┌──────────────────────────┐ │
│ │ ◫ Comptes              › │ │
│ │ ◫ Catégories           › │ │
│ │ ◫ Magasins            › │ │
│ │ ◫ Devises              › │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ ◫ Importer et exporter › │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ ◫ Se déconnecter         │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│  Transactions Dashboard ...  │
└──────────────────────────────┘
```

- One card per group, rows separated by a thin border, a coolicons icon on the left and an
  arrow on the right. A row is a link to its screen.
- **Se déconnecter** is in red (the destructive colour), icon included, with no arrow.
- Rows appear as their screens are built; a row never leads to a placeholder.
- From `md` up: the same cards, centred, at most 40rem wide. The sub-screens open in the
  same place (no two-pane layout in v1).

## Devises

```
┌──────────────────────────────────────────┐
│← Réglages                                │
│ DEVISES                       [+ DEVISE] │
│ ┌──────────────────────────────────────┐ │
│ │ CAD Dollar c… ($) [Par défaut] ★ ⌂ x │ │
│ │ CHF Franc suisse (CHF)         ☆ ⌂ x │ │
│ │ EUR Euro (€)                   ☆ ⌂ x │ │
│ │ GBP Livre sterling (£)         ☆ ⌂ x │ │
│ │ USD Dollar américain ($)       ★ ⌂ x │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
★ ☆ favourite   ⌂ use as default (muted on the default)   x remove (muted on the default)
```

### The list (CUR-01, 03, 05)

- One line per user currency, alphabetical by code: the code in Inconsolata, the name in
  the interface language (`name_fr` or `name_en`) followed by the symbol in parentheses,
  as in "Dollar canadien ($)". A long name truncates; the symbol stays.
- **Par défaut** is a small tag after the name and symbol of the default currency
  (CUR-05). Exactly one currency is the default.
- Every action is on the row, as icon buttons on the right, each with a label naming the
  currency: **star** toggles favourite (CUR-03; favourites are not reordered here, they come
  first in every picker), **house** makes it the default, **trash** removes it. On the
  default currency the house and the trash are shown muted, like disabled.
- The back link sits at the top left of the page; the title and "+ Devise" share
  the line above the card. Buttons placed with a card share its radius; button text is set
  in Inconsolata, uppercase.

### Adding (CUR-02)

- "+ Devise" opens the same sheet as the account form
  (`/settings/currencies/add`), with one field: a `Combobox` over the ISO 4217 list
  (`currencies`), minus the ones already added. Typing matches the code and the name in
  both languages; each option reads "CODE - Nom (symbole)".
- "Ajouter" checks the currency with HexaRate ("Validation…" while it waits), then closes
  the sheet with a toast, "{code} ajoutée.".
- **HexaRate down or slow:** the currency is not added; the sheet stays open with "La
  validation des taux est indisponible. Réessayez dans un moment." Pressing "Ajouter"
  again retries. Existing currencies keep working.
- **A currency the ECB does not publish** (ADR-009): it is added, with a note under it:
  "Taux disponibles à partir du [date]". Older amounts in it show the missing-rate error
  (ADR-004), never zero.

### Removing (CUR-04)

- **Default currency:** the trash is shown muted; tapping it shows "Choisissez d'abord une
  autre devise par défaut." in a toast.
- **Used by an open account:** the trash is muted; a tap says "Le compte {name} est en
  {code}." in a toast (the first one, "et 2 autres" if more). Every new transaction on
  that account is in its currency, so the currency must stay. Archived accounts do not
  block.
- **Not used anywhere:** "Retirer {code}" in the shared confirmation (`ConfirmDialog`),
  without "Cette action est irréversible." since a removed currency can come back.
- **Used by transactions:** a confirmation names the count: "12 transactions sont en EUR.
  Elles gardent leur devise; EUR disparaît seulement des listes de choix." Buttons
  "Retirer" and "Annuler".
- Removing never changes a transaction or an account. It only takes the currency out of
  pickers and out of the display currency switcher.
- **Adding it back** skips the HexaRate check: it passed when the currency was first added.
  Removing marks the row (`removed_at`) instead of deleting it, so the app remembers.
- If the display currency is removed, the display switches to the default currency.

## Display currency switcher (CUR-06, 07)

- A chip in the header, left of FR / EN, showing the code (`CAD ▾`) in Inconsolata. On
  every signed-in screen, phone and desktop.
- Tap: a small menu of the user's currencies, favourites first, then alphabetical, the
  current one checked.
- Choosing one saves it on the profile and re-renders every amount on the page in it.
  Conversion uses the rate on each transaction's date (CUR-07); an amount already in the
  display currency is never converted.
- The choice is kept across sessions (profile, mirrored in a cookie like the language, so
  the server renders the right currency first).

## States

- **Loading:** the list renders on the server; no spinner on first load.
- **Error saving** (star, default, display currency): the change is rolled back and a
  toast says "La modification n'a pas été enregistrée."
- **Only one currency left:** it is the default, so it cannot be removed. The list can
  never be empty.

## Data

- Reads: `user_currencies` (rows without `removed_at`) joined to `currencies`;
  `profiles.default_currency`, `profiles.display_currency`; a count of transactions per
  currency for the confirmation; open accounts per currency for the block.
- Writes, each a server function with the user's session (ADR-006):
  `addCurrency(code)` (HexaRate check, then insert), `setFavourite(code, on)`,
  `setDefaultCurrency(code)`, `removeCurrency(code)`, `setDisplayCurrency(code)`.
- The default lives on `profiles.default_currency` only. The list is alphabetical, so
  there is no stored order.

## Copy

| Key | Français |
|---|---|
| Hub title | Réglages |
| Hub rows | Comptes, Catégories, Magasins, Devises, Importer et exporter, Se déconnecter |
| Screen title | Devises |
| Default badge | Par défaut |
| Add button | Devise (named Ajouter une devise, also the sheet title) |
| Search placeholder | Rechercher un code ou un nom |
| Make default | Utiliser par défaut |
| Remove | Retirer |
| Default cannot be removed | Choisissez d'abord une autre devise par défaut. |
| Used by an open account | Le compte {name} est en {code}. / Le compte {name} et {n} autres sont en {code}. |
| Remove confirmation | {count} transactions sont en {code}. Elles gardent leur devise; {code} disparaît seulement des listes de choix. |
| HexaRate down | La validation des taux est indisponible. Réessayez dans un moment. |
| Rates start later | Taux disponibles à partir du {date} |
| Save failed | La modification n'a pas été enregistrée. |

## Build notes

What the build does differently or adds, for review:

- **No display-currency cookie.** The signed-in layout reads the profile on every load
  (`getMyCurrencies`), so the server already renders the right currency first. The cookie
  would be a second copy to keep in step. Add it back if a screen ever needs the currency
  before the profile can be read.
- **Not yet:** the transaction count in the confirmation, which needs the transactions
  table (spec 14).
- **Favourite, default and remove** show at once and stay shown until the saved data comes
  back, so a change never flashes back to the old state.
- **Rows only appear as screens exist:** the hub shows Devises and Se déconnecter.
- **Extra copy:**

  | Key | Français |
  |---|---|
  | Unknown to HexaRate | Le service de taux ne connaît pas {code}. |
  | Rates not fetched yet | Taux disponibles après la prochaine mise à jour quotidienne. |
  | Removed toast | {code} retirée des listes de choix. |

