# Holdings

**Status:** built. Shared rules: [02-screens.md](02-screens.md). Decisions: [ADR-045](../../01_building/decisions.md), [ADR-048](../../01_building/decisions.md), [ADR-061](../../01_building/decisions.md).

## Purpose

The things that make up net worth besides bank accounts: investment accounts, other assets and debts. Each holding has dated values, and the money the user put into it comes from the transactions already in the app, so nothing is entered twice.

## Requirements

NW-01, NW-02, NW-03. The net worth chart and what it leaves out (NW-04, NW-05) are phase 5.

## The list

Holdings are listed on the [net worth page](20-net-worth.md) with the accounts, since 2026-11-17 (ADR-061; this was the `/net-worth/holdings` subpage, which now redirects there). Their row there shows the type and currency, what was withdrawn (not on an investment), and the latest value over an investment's return over the range; an investment's placed, withdrawn and profit show over its opened chart (2026-11-18, ADR-062); a debt as the amount owed, positive and in red (2026-11-17, was negative). Row actions sit behind a ⋮ at every width: Valeurs, Contributions externes, Transferts, Archiver, Supprimer (2026-11-18); in the sheet they stay icons in its header. The "n transactions sans avoir" tag sits beside that page's title.

## The label

A holding is named by what the user typed. With no name, it reads "type en CURRENCY (institution)", as accounts read "Chèque (Desjardins)", leaving out the institution when there is none ("REER en CAD (Desjardins)", "Hypothèque en CHF"; in English "RRSP in CAD (Desjardins)"). A typed type stands in for the predefined one. The same label is used in the transaction form, the transaction list tag and the archived list. A row in an institution's group leaves the institution out, since the group says it.

## The sheet

A route sheet, `/net-worth/holdings/new` and `/net-worth/holdings/$holdingId`.

Fields, in this order:
1. **Nom**: its placeholder shows the label it would get. No "(facultatif)" on any field.
2. **Pays** (required): a combobox of countries, a fixed list of ISO codes named by the user's language. Under it, as its sub-field, **Type**: the types of that country, then the generic ones (brokerage, life insurance, property, loan, mortgage...), then "Autre". A country with no types of its own offers the generic ones and "Autre". "Autre" adds two more sub-fields: **Nature**, a choice field (see [design-decisions.md](design-decisions.md)) of Placement, Actif or Dette (a typed type has no kind of its own), and the text box for the type. The kind of a predefined type is its own and is not asked.
3. **Institution** (optional), **Devise**, **Date d'ouverture**.

The form has no lists. Values, external contributions and transfers have their own icons beside archive and delete, each opening a sheet over the net worth page (`/net-worth/holdings/$holdingId/values`, `/contributions`, `/transfer`). On phones the icons move to the form's sheet header with the others.

- **Valeurs** (icon: line chart): date and amount, newest first. One value per date; a second for the same date is a validation error under the date. Shown for every kind. A debt's value is entered as a positive amount. A row opens in a sheet over this one.
- **Contributions externes** (icon: coins): the employer or government money. Date, amount, optional description. Investments only. The new one reads "Nouvelle contribution externe".
- **Transferts** (icon: arrows, investments only): a sheet of the holding's transfers like the values and contributions, out (→) and in (←), each with a trash and no edit, and a row "Ajouter un transfert". That opens a sheet over it for money moved on a date to another holding, as when an account closes at one institution and its money goes to another. Fields: date, amount, **Vers l'avoir**. The combobox lists the other open investments in the same currency (an amount is in the holding's currency), and "Créer « … »" opens the holding form in a sheet over this one, with the source's country, type and currency, and the typed name. History stays where it is.

## Figures

- **Placed** is the money that went in: the expenses linked to the holding, each converted to the holding's currency at its own date, plus the external contributions and the transfers into it. It never goes down.
- **Withdrawn** is the money that came out: the incomes linked to the holding and the transfers out of it. "Retiré" shows only when it is above zero.
- **Profit** is the latest value plus withdrawn minus placed. **Percent** is profit over placed (ADR-049). Both show over an investment's opened chart (ADR-062).
- Profit and percent are empty, never zero, when there is no value yet, when placed is zero, or when a rate is missing.
- Nothing is left out of the hub totals: every open holding counts. What the chart leaves out is a view, in phase 5.

## In the transaction form

- When every chosen category is an investment, an "Avoir" combobox appears under it (shared Combobox, clears with ×, no "Créer"). It lists holdings open on the transaction's date, by label.
- Only an expense or an income can carry it. Changing the category to a non-investment one clears the field.
- In the transactions list the holding's label shows as a tag beside the merchant. There is no holdings filter: the category filter does that job, and the link on the holdings page opens it.

## Edge cases

- Archiving asks the date (default today) and sets `closed_on`; it cannot be before the last linked transaction or value. Reactivating clears it.
- A holding with a history (a linked transaction, a value, an external contribution or a transfer) can only be archived: the trash is muted and a toast says "Il a un historique. Archivez-le plutôt.".
- Changing a holding's currency is refused once it has any of them.
- Two open holdings cannot share a name, ignoring case and accents. Unnamed ones are never in conflict.
- A failed save keeps its values and shows the error above the buttons.

## Not in this screen

Debt payments do not link to a debt holding; a debt has values only. The import carries holdings, values, external contributions and transfers (ADR-050); import and export do not carry the transaction link (ADR-045).

## Open questions for the author

None.
