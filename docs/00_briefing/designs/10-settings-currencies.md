# Settings and currencies

**Status:** reviewed 2026-11-03; built 2026-11-03, see Build notes.

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
│ │ ◫ Marchands            › │ │
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
│ DEVISES           [+ AJOUTER UNE DEVISE] │
│ ┌──────────────────────────────────────┐ │
│ │ CAD Dollar c… [Par défaut]   $ ★ ⌂ x │ │
│ │ CHF Franc suisse           CHF ☆ ⌂ x │ │
│ │ EUR Euro                     € ☆ ⌂ x │ │
│ │ GBP Livre sterling           £ ☆ ⌂ x │ │
│ │ USD Dollar américain         $ ★ ⌂ x │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
★ ☆ favourite   ⌂ use as default (muted on the default)   x remove (muted on the default)
```

### The list (CUR-01, 03, 05)

- One line per user currency, alphabetical by code: the code in Inconsolata, the name in
  the interface language (`name_fr` or `name_en`), then the symbol, styled like the code,
  next to the actions. A long name truncates.
- **Par défaut** is a small tag on the same line as the name of the default currency
  (CUR-05). Exactly one currency is the default.
- Every action is on the row, as icon buttons on the right, each with a label naming the
  currency: **star** toggles favourite (CUR-03; favourites are not reordered here, they come
  first in every picker), **house** makes it the default, **trash** removes it. On the
  default currency the house and the trash are shown muted, like disabled.
- The back link sits at the top left of the page; the title and "Ajouter une devise" share
  the line above the card. Buttons placed with a card share its radius; button text is set
  in Inconsolata, uppercase.

### Adding (CUR-02)

- "Ajouter une devise" opens a searchable picker of the ISO 4217 list (`currencies`),
  minus the ones already added. Search matches code and name in both languages. Each
  result shows "CODE - Nom" and the symbol.
- Choosing one calls the server, which checks it with HexaRate. The row shows a spinner
  until it answers; nothing else is blocked.
- **HexaRate down or slow:** the currency is not added. Message: "La validation des taux
  est indisponible. Réessayez dans un moment." with a "Réessayer" button. Existing
  currencies keep working.
- **A currency the ECB does not publish** (ADR-009): it is added, with a note under it:
  "Taux disponibles à partir du [date]". Older amounts in it show the missing-rate error
  (ADR-004), never zero.

### Removing (CUR-04)

- **Default currency:** the trash is shown muted; tapping it shows "Choisissez d'abord une
  autre devise par défaut." in a toast.
- **Used by an open account:** "Retirer" is disabled with the hint "Le compte {name} est en
  {code}." (the first one, "et 2 autres" if more). Every new transaction on that account is
  in its currency, so the currency must stay. Closed accounts do not block.
- **Not used anywhere:** removed at once, with an "Annuler" toast for a few seconds.
- **Used by transactions:** a confirmation names the count: "12 transactions sont en EUR.
  Elles gardent leur devise ; EUR disparaît seulement des listes de choix." Buttons
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
| Hub rows | Comptes, Catégories, Marchands, Devises, Importer et exporter, Se déconnecter |
| Screen title | Devises |
| Default badge | Par défaut |
| Add button | Ajouter une devise |
| Search placeholder | Rechercher un code ou un nom |
| Make default | Utiliser par défaut |
| Remove | Retirer |
| Default cannot be removed | Choisissez d'abord une autre devise par défaut. |
| Used by an open account | Le compte {name} est en {code}. / Le compte {name} et {n} autres sont en {code}. |
| Remove confirmation | {count} transactions sont en {code}. Elles gardent leur devise ; {code} disparaît seulement des listes de choix. |
| HexaRate down | La validation des taux est indisponible. Réessayez dans un moment. |
| Rates start later | Taux disponibles à partir du {date} |
| Save failed | La modification n'a pas été enregistrée. |

## Build notes

What the build does differently or adds, for review:

- **No display-currency cookie.** The signed-in layout reads the profile on every load
  (`getMyCurrencies`), so the server already renders the right currency first. The cookie
  would be a second copy to keep in step. Add it back if a screen ever needs the currency
  before the profile can be read.
- **Not yet:** the open-account block and the transaction-count confirmation on
  "Retirer". Both need tables that come with specs 11 and 14; removal is immediate with the
  "Annuler" toast until then.
- **Rows only appear as screens exist:** the hub shows Devises and Se déconnecter.
- **Extra copy:**

  | Key | Français |
  |---|---|
  | Unknown to HexaRate | Le service de taux ne connaît pas {code}. |
  | Rates not fetched yet | Taux disponibles après la prochaine mise à jour quotidienne. |
  | Removed toast | {code} retirée des listes de choix. |

