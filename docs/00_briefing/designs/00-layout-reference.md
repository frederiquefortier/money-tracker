# Layout reference: TravelSpend (mobile)

The mobile layout follows the patterns of **TravelSpend** (Ori App Studio), which the
owner likes. This file records what is taken from it and how it maps onto this app. It is
a reference for patterns, not a copy: our own palette, type, icons and copy.

**Sources.** The six App Store screenshots (`https://itunes.apple.com/lookup?id=1434284824`,
field `screenshotUrls`) and the review at https://runawaytraveller.com/travelspend-app/.
Copies for local viewing are in `references/travelspend/` (gitignored: third-party,
copyrighted images, never committed).

## Patterns adopted

| Pattern | In TravelSpend | Here |
|---|---|---|
| **Bottom tab bar** (mobile) | Entries, Stats, Search, Map, Settings; icon over a short label; active tab in the accent colour | The main sections of v1, coolicons icons, rose for the active tab. On wide screens the same items become a side or top bar. |
| **Floating add button** | Round accent "+" bottom right, above the tab bar | Same, on the Transactions tab only |
| **Top bar** | Menu left, context name centred (the trip), people icon right | Period or account in the centre (the "trip" equivalent is a date range), FR/EN and profile on the right |
| **Summary tiles** | Two cards side by side: Total and Daily average, each with a thin progress bar against the budget (`$3,748/30,000`) | Spent this period and a second figure (daily average, or remaining budget), with a progress bar when a budget exists (BUD-01) |
| **Transaction rows** | Coloured circle with a white category glyph; title over category; amount right; original-currency amount muted below it (`₫55,000`) | Same anatomy. The circle uses the category's coolicons icon and colour; the second line on the right is the original amount (CUR-08). |
| **Small decimals** | Cents set smaller than the units (`1,286`<sub>`.84`</sub>) | Same, it makes columns of amounts easy to scan |
| **Day groups** | Date header with the day's total on the right | Same |
| **Donut chart** | Category shares with icon badges and percentages around the ring, a list of categories with totals below | Dashboard (DSH-04), coolicons badges |
| **Trend card** | Bar chart by month in a card, a dropdown filter, the selected month's total below, "Show more" | Dashboard trend (DSH-01, DSH-04) |
| **Ranked list with bars** | Countries, each with a thin bar proportional to its share | Merchants or categories ranked by spend (DSH-07) |
| **Expense form** | Back and Save in the header; big amount with a currency chip showing the rate (`VND $1 = ₫23,449`); then one row per detail, each with an icon: description, date, payment method, country, paid by and for, location, photo | Same structure: amount and currency chip first (CUR-08), then rows for note, date and time, account, merchant, category (splits), people (PPL-03), event, tags |
| **Group balance** | People with round initial avatars, who owes whom | People and balances (PPL, YR-05) |
| **Cards** | White, generous radius, soft shadow, on a warm off-white ground | Already our style: white cards, 1 rem radius, cream ground |

## Decisions on top of the reference

- **Four tabs for v1:** Transactions, Dashboard, Budget, Réglages (accounts, categories and
  currencies live under Réglages). Patrimoine and Proches get tabs in v2.
- **Tab labels are one short word**, on one line at phone width. The French interface keeps
  "Dashboard": "Tableau de bord" wraps.
- **Icon pairs:** outline icon for a tab, the `-fill` variant when it is active.
- **No max-width container:** the header and the content span the full width, with side
  padding only.
- **The language toggle lives in the header** (and top right on the signed-out screens),
  nowhere else.
- **The app name never wraps in the header.** When it no longer fits on one line beside
  the logo, it is hidden and the logo stays alone (the name remains for screen readers).
- **The floating add button** arrives with the add-transaction screen (phase 1), on the
  Transactions tab only.

## Seen, not adopted (yet)

- **Spread across days**: one expense (a hostel stay) spread over several days for daily
  averages. Worth considering with budgets; not in the requirements yet.
- **Apple Pay import**: needs a native app. Out of scope (web only, no bank connections).
- **Trips** as the top-level container: we organise by period and account instead; events
  (EVT) cover the trip idea.
- **Dark theme**: TravelSpend has one. Our palette has dark tokens; no toggle yet.

## Data the layout needs

- A **colour per category**, for the icon circles and the chart. Add `color` to
  `categories` in phase 1 (database.md), chosen freely; the icon colour adapts for
  contrast ([12-categories.md](12-categories.md#colours)).
