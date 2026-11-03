# Settings and currencies

**Status:** reviewed 2026-11-03.

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

- One card per group, rows separated by a thin border, a coolicons icon on the left and a
  chevron on the right. A row is a link to its screen.
- Rows appear as their screens are built; a row never leads to a placeholder.
- From `md` up: the same cards, centred, at most 40rem wide. The sub-screens open in the
  same place (no two-pane layout in v1).

## Devises

```
┌──────────────────────────────┐
│ ‹ Réglages                   │
│ DEVISES                      │
│ ┌──────────────────────────┐ │
│ │ CAD  Dollar canadien  $ ★ │ │
│ │      Par défaut           │ │
│ │ CHF  Franc suisse    CHF ☆│ │
│ │ EUR  Euro             € ☆ │ │
│ │ GBP  Livre sterling   £ ☆ │ │
│ │ USD  Dollar américain $ ★ │ │
│ └──────────────────────────┘ │
│ [ + Ajouter une devise ]     │
└──────────────────────────────┘
```

### The list (CUR-01, 03, 05)

- One row per user currency, alphabetical by code. The code is set in Inconsolata, the
  name follows the interface language (`name_fr` or `name_en`), then the symbol.
- **Star** on the right toggles favourite (CUR-03). Favourites are not reordered here; they
  come first in every picker.
- **Par défaut** under the default currency (CUR-05). Exactly one currency is the default.
- Tapping a row opens a small sheet with: "Utiliser par défaut" (hidden on the default),
  "Retirer" (destructive).

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

- **Default currency:** "Retirer" is disabled with the hint "Choisissez d'abord une autre
  devise par défaut."
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
