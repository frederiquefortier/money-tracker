# Institutions

**Status:** not built. Shared rules: [02-screens.md](02-screens.md). Decision: [ADR-047](../../01_building/decisions.md).

## Purpose

The banks and providers that hold the user's accounts and holdings. Set up once in Réglages, picked in the account and holding forms.

## Requirements

ACC-05.

## The page

- Route `/settings/institutions`, "Institutions" in the Réglages menu (bank icon). A list page like the other menu pages: no back link, the round + bottom right.
- One card of rows, A to Z. A row shows the name and a quiet line "n comptes, n placements" ("Aucun compte ni placement" when unused), then icons: the website (opens in a new tab; muted with a toast when there is none) and delete.
- Delete is muted while any account (open or closed) or holding (open or archived) uses the institution; a tap says "Des comptes ou des placements utilisent encore cette institution.".
- Tapping a row opens its sheet: name, website (https). Empty state: "Aucune institution pour l'instant.".

## Sheet

Route sheet `/settings/institutions/new` and `/settings/institutions/$institutionId`, the form as before. The delete icon sits in the header on phones.

## The pickers

Unchanged: the account and holding forms offer a combobox of institutions with "Créer « … »", so most institutions are created there.

## Accounts page

- Groups only the institutions that have an open account, then the accounts with none. An institution used only by holdings, or only by closed accounts, has no group.
- The group header shows the name, the total and, when the institution has a website, an icon opening it. It no longer opens the institution's form and has no delete.
- The "Ajouter une institution" option leaves the + menu.

## Open questions for the author

None.
