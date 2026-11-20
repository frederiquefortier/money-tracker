# Dashboard

**Status:** built (Argent and Événements); the Social tab is next. Shared rules: [02-screens.md](02-screens.md). Decision: [ADR-063](../../01_building/decisions.md).

## Purpose

The spreadsheet's dashboard, the events calendar and the yearly review on one page (author, 2026-11-18). It answers what the Aspire sheet answered: what came in, what went out, what was invested and what remains.

## Requirements

DSH-01..10, EVT-04, EVT-05, YR-01. Next: YR-03, YR-04, YR-05 in the Social tab.

## The page

Route `/dashboard`, the Dashboard tab, full width (author, 2026-11-19: a main page). The period beside the title: Année (a year menu from the first transaction's year) or Tout. A year counts by month, Tout by year. The period is in the address; the tab is remembered per browser. The whole history loads once, so switching the period loads nothing.

Every figure is my share, net of repayments, in the display currency (ADR-063). A missing rate shows the missing-rate mark, never a partial sum.

### Argent

From the answer to the detail (author, 2026-11-19, after a design review), two cards side by side from `xl` (author, 2026-11-20): on Année the summary beside the cumulative chart, the monthly chart beside the days (on Tout the summary beside the yearly chart), Dépenses beside Revenus, then Par catégorie across the page; one column below, in that order. Earned is green, spent red, invested yellow, what remains pale lavender, in every card. A month of the period without any transaction (between the first month on record and the last one over) is named in a warning tag beside the page title, as on the net worth page, and shaded grey on the monthly chart. Amounts show no cents. The month (or year) not over yet is drawn lighter and named "en cours" in tooltips; a month still to come keeps its slot without a label.

- **Period:** Année or Tout as a toggle; on Année, ‹ year › steps by one and its menu jumps further.
- **Summary:** Gagné as the headline with its change against the same stretch a year earlier (the months so far on the current year, the whole year before on a past one), and income as one bar cut into Dépensé, Investi and Reste (author, 2026-11-19: the full bar reads as income). Under it, Dépensé, Investi and Reste, each with its share of income and its change ("▲ 4 % vs 2025", spending up in red), the changes on one line. On Tout, no comparison. The net worth is not on the dashboard (author, 2026-11-19); its ×N moved to the net worth page.
- **Gagné et dépensé par mois** (par année on Tout, full width): paired bars, a month where spending passed income shaded red.
- **Revenus et dépenses cumulés** (Année): "Revenus + reste 2025" (income on top of what earlier years left) against Dépenses, two plain lines that stop at this month (no filled area), and last year's two lines dashed over the whole year ("Revenus 2025 + reste 2024", "Dépenses 2025").
- **Dépenses par jour** (Année): the year as a heat map of twelve small month calendars, six across (three on a phone) so it is no taller than the monthly chart beside it, weeks from the locale's first day. A day with spending in one of four steps of the spending red, cut at the quartiles of the year's spending days; a day without spending in the same light grey as days to come (author, 2026-11-19); a day with a missing rate a darker grey. Hovering a day names it and its amount; the card's corner reads the days with spending over the year's days, "290/365" (366 in a leap year). Loaded when the year is shown, from `my_lines` for that year (a past year once per visit).
- **Dépenses:** the period's spending split three ways (Besoins et envies, Groupes, Catégories) and drawn two ways (Par mois: each bucket stacked; Répartition: a donut beside its list with each part's share and amount), the choices kept per browser. Needs and wants are two shades of the spending red, groups and categories their own colour, every one shown (author, 2026-11-20: no Autres). A category filter and the period's total.
- **Revenus:** beside Dépenses, by group, with the same Par mois or Répartition switch, filter and total.
- **Par catégorie:** the sheet's table, figures only, the category column fixed while the rest scrolls. A type menu (Dépenses, Revenus, Placements); each group folds its categories (kept per browser), each row's trend opens its chart under the row, as an item's line on the net worth page. On Année: Ce mois-ci, Cette année and Moyenne par mois over the same months ("sur 11 mois" in November), all from the year shown: to today on the current year and to December on a past one (the month and the year then named), from the first month on record when the history starts within the year; each trend covers the same months; on Dépenses, a month already more than 10 % over its average is marked ▲ in red. On Tout: a total per year and Moyenne par année, over every year shown, this one included. Archived categories show only with figures. The sheet's Target and Goal columns wait for the budgets (BUD-01).

### Événements

The period as month grids, each event's days tinted with its type's colour; the period's events with their dates, days, people, cost and cost per day, a row opening its transactions; Comparer, a type menu and a bar per event of that type over every year.

## Open questions

- Social tab: is the YR-02 sticky-month timeline still wanted now that Événements has a calendar?
