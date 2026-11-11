# Layout reference: TravelSpend (mobile)

The mobile layout follows patterns from TravelSpend, which the owner likes: our own palette, type, icons and copy, not a copy. Screenshots for local viewing are in `references/` (gitignored, third-party).

## Patterns adopted

- **Bottom tab bar** on mobile (icon over a short label, active tab in the primary plum); a side or top bar on wide screens.
- **Floating add button**, round, bottom right above the tab bar.
- **Top bar:** menu left, logo, FR/EN and display currency on the right. The app name hides before it wraps.
- **Transaction rows:** a coloured circle with the category icon, title over category, amount right, original amount muted below.
- **Day groups** with the day's total on the right.
- **Dashboard (phase 4):** summary tiles with a progress bar when a budget exists, a donut of category shares, a monthly trend card, ranked lists with bars.
- **Expense form:** big amount with a currency chip, then one labelled field per detail.
- **Group balance:** people with round initial avatars.
- Outline icon for a tab, the `-fill` variant when active. No max-width container: full width with side padding.

## Not adopted

- Cents set smaller than units.
- Spreading one expense across days (worth considering with budgets).
- Apple Pay import (native only).
- Trips as the top-level container: events cover it.
- Dark theme toggle (the palette has dark tokens, no toggle yet).
