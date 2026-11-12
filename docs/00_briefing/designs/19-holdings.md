# Holdings

**Status:** built, being reworked (ADR-048). Shared rules: [02-screens.md](02-screens.md). Decisions: [ADR-045](../../01_building/decisions.md), [ADR-048](../../01_building/decisions.md).

## Purpose

The things that make up net worth besides bank accounts: investment accounts, other assets and debts. Each holding has dated values, and the money the user put into it comes from the transactions already in the app, so nothing is entered twice.

## Requirements

NW-01, NW-02, NW-03. The net worth chart and what it leaves out (NW-04, NW-05) are phase 5.

## The page

- Route `/net-worth/holdings`, a subpage of the [net worth hub](20-net-worth.md) with "‹ Net worth" above the title. Title with the expand-all button beside it, the round + bottom right. No total of its own on the page title.
- Drawers by institution, like Comptes: collapsible, A to Z, then "Sans institution". The drawer's header shows the institution's name and its total in the display currency, at the size of a transaction's amount (`text-lg`, semibold). The total adds investments and assets and subtracts debts, and is "—" when a rate is missing (ADR-004). A drawer with only archived holdings is not drawn.
- A row shows the kind as a tag, the holding's label (below), the type and currency as a quiet line, and the latest value on the right at the same larger size. A debt's value is shown negative. An investment also shows the profit in amount and percent, coloured by sign.
- When investment transactions name no holding, a warning (orange, the shape of a form's error message, with a chevron as it is a button) reads "n transactions sans placement" and opens the transactions list on the investment categories (the category filter); the rows without a holding tag are the ones to link.
- Archived holdings sit in the collapsed "Placements archivés (n)" section.
- Row actions from `md` up: Modifier, Archiver, Supprimer. On phones they move to the sheet header.

## The label

A holding is named by what the user typed. With no name, it reads "type en CURRENCY (institution)", as accounts read "Chèque (Desjardins)", leaving out the institution when there is none ("REER en CAD (Desjardins)", "Hypothèque en CHF"; in English "RRSP in CAD (Desjardins)"). A typed type stands in for the predefined one. The same label is used in the list, the transaction form and the transaction list tag.

## The sheet

A route sheet, `/net-worth/holdings/new` and `/net-worth/holdings/$holdingId`.

Fields, in this order:
1. **Nom**: its placeholder shows the label it would get. No "(facultatif)" on any field.
2. **Pays** (required): a combobox of countries, a fixed list of ISO codes named by the user's language. Under it, as its sub-field, **Type**: the types of that country, then the generic ones (brokerage, life insurance, property, loan, mortgage...), then "Autre". A country with no types of its own offers the generic ones and "Autre". "Autre" adds two more sub-fields: **Nature**, a choice field (see [design-decisions.md](design-decisions.md)) of Placement, Actif or Dette (a typed type has no kind of its own), and the text box for the type. The kind of a predefined type is its own and is not asked.
3. **Institution** (optional), **Devise**, **Date d'ouverture**.

Below the fields, two short lists edited in a sheet over this one:
- **Valeurs:** date and amount, newest first. One value per date; a second for the same date is a validation error under the date. Shown for every kind. A debt's value is entered as a positive amount.
- **Contributions de l'employeur ou de l'État:** date, amount, optional label. Shown for investments only.

## Figures

- **Placed** is the sum of the expenses linked to the holding minus the incomes linked to it (withdrawals), each converted to the holding's currency at its own date, plus the employer and government contributions.
- **Profit** is the latest value minus placed. **Percent** is profit over placed.
- Profit and percent are empty, never zero, when there is no value yet, when placed is not above zero, or when a rate is missing.
- Nothing is left out of the hub totals: every open holding counts. What the chart leaves out is a view, in phase 5.

## In the transaction form

- When every chosen category is an investment, a "Placement" combobox appears under it (shared Combobox, clears with ×, no "Créer"). It lists holdings open on the transaction's date, by label.
- Only an expense or an income can carry it. Changing the category to a non-investment one clears the field.
- In the transactions list the holding's label shows as a tag beside the merchant. There is no holdings filter: the category filter does that job, and the link on the holdings page opens it.

## Edge cases

- Archiving asks the date (default today) and sets `closed_on`; it cannot be before the last linked transaction or value. Reactivating clears it.
- A holding with linked transactions cannot be deleted: the trash is muted and a toast says "Des transactions y sont liées.". Its values and employer contributions go with it otherwise.
- Changing a holding's currency is refused once it has values, contributions or linked transactions.
- Two open holdings cannot share a name, ignoring case and accents. Unnamed ones are never in conflict.
- A failed save keeps its values and shows the error above the buttons.

## Not in this screen

Debt payments do not link to a debt holding; a debt has values only. Import and export do not carry the link (ADR-045).

## Open questions for the author

None.
