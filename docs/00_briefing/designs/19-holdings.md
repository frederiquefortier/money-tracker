# Holdings

**Status:** not built. Shared rules: [02-screens.md](02-screens.md). Decision: [ADR-045](../../01_building/decisions.md).

## Purpose

The things that make up net worth besides bank accounts: investment accounts, other assets and debts. Each holding has dated values, and the money the user put into it comes from the transactions already in the app, so nothing is entered twice.

## Requirements

NW-01, NW-02, NW-03, NW-05. The net worth chart (NW-04) and the income by job (NW-09) stay in phase 5.

## The page

- Route `/net-worth/holdings`, a subpage of the [net worth hub](20-net-worth.md) with "‹ Net worth" above the title. Title with the expand-all button beside it, the round + bottom right. No total of its own.
- Cards, one line each, grouped under three headings: investments, assets, debts. A group with no holding is not drawn.
- A card shows the type's icon bubble, the name, the institution if any, the type as a tag, and the latest value. An investment also shows the profit in amount and percent, coloured by sign.
- A holding left out of net worth is muted with a tag. Closed holdings sit in the collapsed "Placements archivés (n)" section.
- Row actions from `md` up: Modifier, Archiver, Supprimer. On phones they move to the sheet header.
- When investment transactions have no holding, one quiet line under the title says "n transactions sans placement" and opens the transactions list filtered on them.

## The sheet

A route sheet, `/net-worth/holdings/new` and `/net-worth/holdings/$holdingId`.

Fields: type (combobox over the reference types, shown in the user's language, grouped by kind), name, institution (the shared picker, optional), country (defaults from the type, editable), currency, opened on, and "Exclure de la valeur nette".

Below the fields, two short lists edited in place with the shared row pattern:
- **Valeurs:** date and amount, newest first. One value per date; adding a second for the same date is a validation error under the date. Shown for every kind. A debt's value is entered as a positive amount.
- **Contributions de l'employeur ou de l'État:** date, amount, optional label. Shown for investments only.

## Figures

- **Placed** is the sum of the expenses linked to the holding minus the incomes linked to it (withdrawals), each converted to the holding's currency at its own date, plus the employer and other contributions.
- **Profit** is the latest value minus placed. **Percent** is profit over placed.
- Profit and percent are empty, never zero, when there is no value yet, when placed is not above zero, or when a rate is missing.
- Net worth counts the latest value of each open holding that is not excluded, debts negative, converted to the display currency. The chart is phase 5; this screen shows no total.

## In the transaction form

- When the chosen category is investment-kind, a "Placement" combobox appears under it (shared Combobox, clears with ×, no "Créer"). It lists holdings that are open on the transaction's date.
- Only an expense or an income can carry it. Changing the category to a non-investment one clears the field.
- In the transactions list the holding shows next to the category, and the filters gain "Placement" with a "Sans placement" choice.

## Edge cases

- Archiving asks the date (default today) and sets `closed_on`; it cannot be before the last linked transaction or value. Reactivating clears it.
- A holding with linked transactions cannot be deleted: the trash is muted and a toast says "Des transactions y sont liées.". Its values and employer contributions go with it otherwise.
- Changing a holding's currency is refused once it has values, contributions or linked transactions.
- Unarchived holdings are unique by name per user, ignoring case and accents.
- A failed save keeps its values and shows the error above the buttons.

## Not in this screen

Debt payments do not link to a debt holding; a debt has values only. Import and export do not carry the link (ADR-045).

## Open questions for the author

None. The three choices (the link, snapshots now, no import column) and the three follow-ups (employer money in, debts values only, an unlinked count) are settled and logged in sessions.md.
