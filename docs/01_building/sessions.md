# AI Session Records

Short record of each working session: what the author asked, what was decided and why, what went wrong. Detail lives in the ADRs, design-decisions.md and git history.

<!-- Newest first: a new session goes directly below this line. Template at the bottom. -->

### 2026-11-25 - Skeletons for pages, charts and transactions

**What We Worked On:**
- The author asked for skeleton loading almost everywhere, charts and transactions first. This reverses ADR-068's spinners for charts and pages (ADR-072). Pages with a loader show their title over a skeleton of their body: the dashboard's cards, the net worth chart beside its list, days of transaction rows, rows for the settings pages. `ChartContainer` waits as a block, the heat map's grid pulses, and the transactions list shows its skeleton while a filter reloads and at its end. New pieces are in the gallery.
- The author asked why the charts were kept and not the heat map. The charts come from the dashboard's loader; the heat map fetched its year from the component and dropped the current year after each answer. The author suggested React Query with a key like `heatmap-{year}-{count}`; the app did not use it (ADR-011), and the assistant proposed a key on the year cleared by each save, with a hand-made cache. The author asked whether other places would benefit: eight other reads had the same hand-written fetch. The author chose TanStack Query for all nine (ADR-073): a client per router, invalidated by `useRefresh`, emptied on sign-in and sign-out.

**What Could We Do Better:**
- Not seen in the browser: the Playwright browser was not signed in.

### 2026-11-25 - Privacy mode

**What We Worked On:**
- The author asked to "add the privacy log"; nothing by that name existed, and the author chose the privacy mode idea (improvements.md, 2026-11-12). The author chose figures and percents (not memos or names), a mask keeping the currency, and a cookie so nothing flashes on load. Built (SET-08, ADR-071): a button in the top bar, `PrivacyProvider`, masks in `Money`, `Percent`, the text amounts of dialogs and tags, and blank chart axes.
- The assistant first masked the digits with bullets; the author asked for `#` and a fixed shape, "##.##" for any amount and "##" for any percent, so neither size nor sign shows.
- The author asked whether the eye was right, since it already hides items from the net worth chart. The assistant suggested moving the net worth items to the filter icon and keeping the eye for privacy; the author chose a shield for privacy mode instead (`shield` and `shield-off` added to the icons).

**What Could We Do Better:**
- Not seen in the browser: the Playwright browser was not signed in.

### 2026-11-25 - The excluded categories leave the tab row

**What We Worked On:**
- The author asked to redesign the Réglages tab of Événements (improvements.md, 2026-11-16): a setting does not fit a row of list tabs, where the search, the sort and the + belong. The assistant proposed a settings icon beside the sort opening the category picker directly, with the tooltip text in the sheet; the author asked for that text as a notice with a ? icon. Built (ADR-070): the round icon on both tabs, `FormAlert` with a `help` tone, in the gallery, and the `settings` and `circle-help` icons.

**What Could We Do Better:**
- Not seen in the browser: the Playwright browser was not signed in.

### 2026-11-25 - Loaders, skeletons, the adjustment sheet and Safari

**What We Worked On:**
- The author asked for a loader on every chart, and on the export's line counts, which squeezed the rows while they loaded. `ChartContainer` shows a spinner in the chart's own space until the page has hydrated (`useHydrated`), since Recharts draws at a guessed size before that; the heat map has the same spinner while its year loads; each export row shows a spinner in place of its count.
- The author then asked for text to load as a skeleton and for every loader to be checked. `Skeleton` and `SkeletonRows` came in (ADR-068), in the gallery. Text now waits as a skeleton: the export counts, the heat map's days count, the filter sheet's options, the rate and fee on a foreign receipt or transfer, the adjustment's balance and gap (which also stops showing a dash while it loads, and shows one on an error instead of nothing). The spinners left are buttons, charts, the list end, the transactions list refreshing, and pending pages and sheets.
- The author asked to fix the adjustment sheet, too long on a phone. The sheet is full screen there, so the length was its title, "Modifier l’ajustement de “compte (institution)”" in capitals beside two buttons. It is now "Modifier l’ajustement", like the other edit sheets, and the account is named on the slip, above the balances.
- The author asked to fix Safari moving the page when a field takes focus. The assistant first fixed a zoom: the slip's typed fields were 14px, which Safari zooms into, and are 16px on a phone now. The author said the problem was the sheet moving up and getting shorter, and that the keyboard should cover it. `useVisualViewport` did that and was removed. The author asked why it had been added: the 2026-11-12 iPhone pass, for a first letter lost in pickers and taps landing below fields, both never confirmed on a device. Not tried on an iPhone.
- The author asked about the missing CLP and GTQ rates and when rates update. Found on the dev database: no rate of any kind after 2026-11-02, and no HexaRate row ever, so the daily Netlify job (17:00 UTC) has not run or fails at start; Frankfurter and HexaRate both answer. CLP and GTQ are not ECB currencies, so ADR-009 gives them HexaRate from the day they are added, with no history. Frankfurter's v2 API has both from 1999 (central banks beyond the ECB). The author chose Frankfurter v2 (ADR-069): the job asks it for the currencies in use and those kept, each from its own last day, a year per call, HexaRate only for what it lacks. A laptop run filled CLP and GTQ from 2018. The author found the Netlify function ran with no secret key; it reads `SUPABASE_SECRET_KEY`, never the publishable key.

**What Could We Do Better:**
- Not seen in the browser: the Playwright browser was held by another session.

### 2026-11-25 - Budget tab removed

**What We Worked On:**
- The author asked to remove the budget page for now. It was a coming-soon card: the route, its nav tab (the phone's bar now has three columns) and its strings are gone. Budgets stay in phase 4 and the tab comes back with them.

**What Could We Do Better:**
- The nav was not looked at in the browser.

### 2026-11-24 - The export

**What We Worked On:**
- The author asked for the export (IMP-04). The spec named three files; the assistant wrote all nine of the format, since ADR-050 asks for the holdings files too, and left the `holding` column on transactions.csv (ADR-045) out, as it changes the import.
- Built: `export_data()` (migration, pgTAP 38 with another user seeing nothing and a full round trip into an empty account, pushed to the dev database, types regenerated), `toCsv` beside `parseCsv`, `exportFiles`, the `exportData` server function, and "Exporter mes données" on the data page (ADR-067). What the format loses on a round trip is listed in import.md.
- The author asked for the export as a tab. The assistant first used the dashboard's icon toggle; the author pointed out the other settings pages use `TabList`, so the data page now has that tab row, remembered per browser. The author then asked to choose the files: the Exporter tab lists the nine files as a `CheckList`, all ticked, and the server builds only the ticked ones. The rows were cramped: `CheckList` rows are 48px with no padding of their own, too tight for the import's 44px bubble; the small bubble went in, then the large one came back with a line count under each name (`export_counts()`, migration, pgTAP 38, fetched when the tab opens).
- The author asked for one zip instead of separate files, reversing the spec's "no archive". The assistant wrote it with Node's zlib and a small zip writer tested with `unzip`, with no dependency, and corrected ADR-067, which was not committed yet.

**What Could We Do Better:**
- The button was not tried in the browser: it would download the owner's real data into the session. It needs one click from the author, and the files a dry-run import.

### 2026-11-23 - Comparer rebuilt

**What We Worked On:**
- The author found the dashboard's event comparator poor and asked the assistant, as a senior designer, for a proposal. The assistant proposed comparing each event's cost per day with its type's usual one, as a bar from a centre line with a percent, types as tabs, newest first, the year shown highlighted, eight rows then all, and later a split by category. The author asked for it built on the page itself.
- Built: `typeComparison` returning the median and each event's gap, `comparableTypes`, tests; `eventSearch` in `drill-down.ts` so a row opens the event's transactions; the card rewritten without the measure menu; more invented trips in the gallery's demo.
- The author then asked for the card beside Événements par jour (the slips moved under both, four in a row), only the year's events on Année instead of the other years paled, the type tabs as colour dots, and no cap on the rows. The type's name moved beside the title, since a dot alone does not name it.
- Then the header's figures were replaced by the type's tag, the year dropped from each row on Année, and a label added above the bars naming the centre line as the mean; the median became a mean to match. The author also asked why not a chart; the assistant kept the rows (they are a bar chart on its side) and offered a dot chart over time on Tout.
- A sort, as elsewhere: the events list's date and name orders plus the cost per day (`sortCompared`, with a test). The rows moved to `compared-list.tsx` to keep the card's file under the line limit.
- The author rejected the bars in the rows twice (the diverging one, then a plain one from zero): a bar per row means nothing. Asked with three sketches, the author picked columns over time: `compared-chart.tsx` on Recharts as Argent's monthly chart, the mean a named dashed `ReferenceLine`, the rows below without a bar.
- The author dropped the percent from the rows and asked to compare categories inside a trip. The server only had a total per event, so: `event_category_totals()` (migration, pgTAP 35 with another user seeing nothing, pushed to the dev database, types regenerated), `eventParts` folding leaf totals into top-level groups per day (`lib/events/event-parts.ts`, with a test), stacked columns with the category names under them, a part opening the event's transactions in its category. The unused gap to the mean was removed.
- The author then removed the whole Événements tab and moved it to improvements: the basic use case is complete without it. The assistant asked to commit first, since most of the tab was untracked (commit 45a8260), then removed the toggle, the overview components, the gallery demo, `getEventsOverview`, `event-calendar.ts`, `event-parts.ts`, the tab's hooks and strings, and helpers only it used (`dayRangeOf`, `ShareBar`, the day grid's month jump and live future days, `year-activity`'s rankings). `monthsOf` and `monthWeeks` moved to `lib/shared/months.ts` for Dépenses par jour. The database functions stay.

**What Could We Do Better:**
- The gallery could not be checked: the Playwright browser was held by another session and `/design` needs a signed-in session. The card needs a look at desktop and phone width.
- The assistant defended its diverging bar for two rounds after the author questioned it; showing sketches of real charts at the first doubt would have saved them.


### 2026-11-23 - Événements as the year in review

**What We Worked On:**
- The author asked the assistant, as a senior UX and UI designer, to fix the dashboard's Événements tab from a brief: a calendar of events with their cost, the comparison by type, a sticky-month timeline, the top three days, who I spent the most and least with, who shared the most events, who owes whom, an export, a heat map of the events and every transaction, and a full-screen month per screen on desktop whose days hold the transactions, events and people.
- The assistant reviewed the tab (no money on the calendar, 96 grids on Tout, spending and events apart, a list repeating the calendar, no social figures) and proposed Aperçu, highlights, Comparer, then the timeline calendar. The author chose the social figures in Événements (no Social tab), who owes me only (PPL-05 keeps "I owe" out), every month on Tout, and the export in phase 6.
- Built: `getYearActivity` replacing `getDailySpending` (ADR-066), `lib/dashboard/year-activity.ts` with tests, the overview, the highlight cards, the month rail and chips, the month grid and the phone's agenda, a measure switch and the average on Comparer, and a gallery specimen with invented events. `heatFills` and the event tag's tint moved to `styles.ts`.
- The author then asked for everyone on a transaction to count in "Avec qui j'ai dépensé" whatever their role (the assistant had left out the seller and an income's payer), the highlight cards as receipt slips (`slipLine` and `slipLabel` moved to `styles.ts`), a way to hide an event so a year-long one does not overwhelm the calendar (the assistant first hid whole types; the author asked for every event listed, grouped by type, as "Masquer des éléments" on the net worth page, since a type alone was not useful), and no empty months before the data starts in August 2018 (`dayRangeOf`). The calendar helpers moved to `lib/dashboard/calendar-days.ts`. The author also had the event tags under each month's title removed, and Aperçu renamed Événements par jour, as Argent's Dépenses par jour. The assistant first changed only the title; the author pointed out the card should be built like Dépenses par jour, its day counter included. Built: `DayGrid` and `DaysCount` (`components/dashboard/day-grid.tsx`), shared by both cards, days in their event's colour, the card half width beside the slips, `daysGoneBy` in `lib/shared/months.ts`.

**What Could We Do Better:**
- "Like the expenses one" meant the same card, not the same name; asking or comparing the two cards would have saved a round.
- The gallery could not be checked: the Playwright browser was held by another session. The layout still needs a look at desktop and phone width, the chips' sticky offset under the header in particular.

### 2026-11-23 - Showing a move between countries on the dashboard

**What We Worked On:**
- The author asked how the dashboard could show an expatriation, 2026 spending looking far higher with nothing invested. The assistant first proposed an "exceptional" event for one-off moving costs; the author explained it is a cost of living gap in the new currency, with income in that currency too.
- The assistant then proposed comparing shares of income across the move, a dated place of residence marked on the charts, and a purchasing-power view as an alternative. The author asked for it in improvements.md.

**What Could We Do Better:**
- The first proposal assumed one-off costs; asking what drove the jump would have saved a round.

### 2026-11-23 - Currency switch loader, table row hover

**What We Worked On:**
- The author asked for a loader while the display currency changes. The assistant first put a spinner in the currency chip; the author found it went away before the amounts changed, added a new kind of loader, and asked whether all loaders should be the same. The assistant proposed one loader per situation, a write's refresh showing the page bar as a page change does (ADR-065). Built: `useRefresh`, used by every write.
- The author reported the dashboard tables' names changing colour before the rest of the row on hover (bugs.md).
- The author asked for a gradient where a table's columns continue past its edge: `TableScroll` (`components/lists/table-scroll.tsx`) fades each edge while more columns sit past it, the left one after the sticky name column; `useScrollMore` takes the axis. Then a border on the sticky name column's right edge, drawn as a shadow so it moves with the cell.
- The author asked for the dashboard's category filter to match the transactions page's, the source of truth: the chip reads "Filtres" (`FilterButton`, shared), the sheet is titled Filtres, has the categories' search, and Effacer and Voir les résultats in its footer (`FilterFooter`, moved to `components/sheet/`), where it had "Tout effacer" at the top.
- The author asked for the dashboard to keep its year when left and opened again. The other choices were already kept per browser; the year, in the URL, was lost from the nav. The page now stores the period picked and opens on it when the URL has no year (DSH-01).
- The author asked for the chart's missing months in the warning's colour (`--warning` at 15%, as the notice) and the expense red as #c30839 in light mode. The new red sits closer to the green in lightness (0.52 against 0.42, from 0.63).
- The author renamed "aucune transaction" to "transactions manquantes" for a missing month, in the chart and in the notice.
- The author set the invested colour to rgb(255, 204, 0) and the earned green to rgb(33, 139, 48) in light mode. The green and the red are now close in lightness (0.56 and 0.52); the assistant pointed it out for colour-blind readers.
- The author asked for every percent rounded to a whole number, except below 1. `Percent` does it for every figure; the conversion fee's rate and the percent left to split keep their decimals, being typed or matched exactly.

### 2026-11-20 - Par marchand card review

**What We Worked On:**
- The author asked the assistant, as a senior UI and UX designer, to review the Par marchand card. The review, on the design gallery at desktop and phone width, found the open panel running off a phone's screen, a chart that looked like the categories' but drew the average bill, a receipt repeating the row, the change cut off from its line, the figures far from the names, red bars on every merchant, and no way to find one merchant (bugs.md).
- The author asked for every change: the total per month in the chart, the receipt starting from the average, the change on the Moyenne 2025 line, the two tables' columns lined up with a row hover, the primary purple, muted zeros, `aria-controls` on the chevron, and a search on the name. Mid-way the author reported "taux manquant" in the chart, which the total per month fixes.
- The author then brought back the trend column, a month without a visit continuing the line at zero, and had the sort arrow the assistant added in the column heads removed.
- Built: `TablePanel` and the `table*` class strings in `styles.ts`, shared by both tables; `FoldButton` takes the panel it opens.

**What Could We Do Better:**
- A width on a cell is ignored beside a full-width column; the first try measured off by 20px on the gallery. The widths now sit inside the head cells.
- The running dev server keeps its translations for its whole life, so new keys showed as raw keys until a full page reload.

### 2026-11-20 - Change in percent per category and per merchant

**What We Worked On:**
- The author pointed out two v1 notes missing from the dashboard: a merchant's bill changing in percent (MER-04) and each category's change in percent (DSH-04 had only the trend).
- The assistant proposed an Évolution column against the same stretch a year earlier, and a Marchands card with each merchant's average bill. The author chose the average bill per visit, the full bill rather than my share (ADR-064), and the column; and asked for last year as a dashed line in each opened chart.
- The author asked whether the transaction form's receipt slip could show a merchant's bill. The assistant suggested it only in the opened panel, beside the chart; the author agreed. `receiptSlip` and `slipRuleLine` moved to `styles.ts`, `changeBetween` to `lib/shared/change.ts`.
- Then: last year's line paler, and the donut list's top edge fading once scrolled, as its bottom does.
- After the push, the author asked for merchants at my share after all (migration 20261120110000 replaces the function; ADR-064 rewritten before any commit), a sort as the categories' plus the number of transactions, no change column and no trend line, "Transactions" for "Visites", and rows built on scroll instead of a show-all button. The receipt and chart now open from a chevron. Then the category table's columns as totals, a Tout column on Tout, no average column; the slip's count beside the name as ×N, its total as the main figure, Moyenne under it, then Moyenne 2025. No comparison on Tout, as the summary. Migration 20261120110000 pushed with the author's approval.
- Built: `merchant_monthly()` (migration 20261120100000, pgTAP 37; pushed with the author's approval), `lib/dashboard/category-change.ts`, `merchant-bills.ts`, the Marchands card. Checked on the design gallery.

**What Could We Do Better:**
- Moving `changeOf` out of the category table cut everything after it too; the type check caught it. Cut between two named markers, never to the end of a file.

### 2026-11-20 - Dashboard against transactions and net worth

**What We Worked On:**
- The author asked the assistant, as a senior dashboard designer, to compare /dashboard with /transactions and /net-worth. The review, on the design gallery with invented figures at desktop and phone width, found the dashboard coherent in look but cut off from the transactions, with a half-empty summary, a deficit shown on the month in progress, trends dropping over a month without data, a stretched table, wrapping controls on a phone, legends the net worth page had dropped and cents on the net worth totals only.
- The author asked for every change, then moved the period menu first, dropped its arrows, put Tout in it as the default and made Argent and Événements two icons (design-decisions.md).
- Built: links from a category, a month and a day to the transactions list (`lib/dashboard/drill-down.ts`), averages per month in the summary, a shared `IconToggle`, the `chart-bar-stacked` icon, net worth totals without cents.
- After trying it, the author asked for clicks on one part only, the heat map's count over the days gone by, a sortable table without its tint, the split as a menu and a scroll cue, and answered four questions: no legend on the stacked bars, empty categories hidden, the filter as the transactions chip, "Montant" for the amount sorts (design-decisions.md). `chipActive` moved to `styles.ts` for both pages.
- Then: the total beside the title without a label, the donut clockwise, "Filtrer" on the chip, the table's type as three colour dots, the dashboard first in the nav, and a shared `BackLink` on the transactions list when opened from the dashboard.

**What Could We Do Better:**
- Deleting `period-controls.tsx` left the running dev server's server render looking for it; the page fell back to client rendering until a restart.

### 2026-11-19 - Dashboard design review

**What We Worked On:**
- The author asked the assistant, as a senior dashboard designer, to review the Argent tab and suggest improvements. The review, done on the design gallery with invented figures, found figures with nothing to compare to, a card repeating the tiles, colours meaning different things side by side, cents everywhere, the month in progress drawn as finished, a donut past a few slices, and a table pairing this month with totals (design-decisions.md).
- The author asked for every change, with earned green, spent red, invested yellow and what remains pale; the pending and owed bubbles removed, as the transactions list has them; both the percent and the ×N kept on the net worth. The table counting back from today on a past year was a bug, not intended (bugs.md).
- Built: the summary (Reste as the headline, the income bar, changes against the same stretch a year earlier, the net worth line), flow colour tokens checked with the dataviz palette validator, whole amounts, round axis steps, the month in progress lighter, deficit months shaded, last year's spending pace, the net worth chart on Tout, ranked bars for the split, the table's trend, average beside this month, above-average mark and fixed first column, a year stepper. Checked in the gallery at desktop and phone width.

- After trying it, the author asked for a second pass: flag months without any transaction, a true red for spending, Gagné's change aligned with the others, last year's income dashed in the cumulative chart with "Revenus + reste 20xx" labels, the table's groups folding and its trend opening a chart, only this month, this year and the monthly average, a lone filter group open by default, and a donut back for needs and wants. Asked whether to remove the net worth tile as its figure differed from the net worth page, the assistant traced it to the series' last date against today's balances and kept the tile on the page's own figure (bugs.md).

- A third pass: a heat map of each day's spending (from `my_lines` for the year shown, loaded with the year, no schema change); income as the headline over the full bar; the net worth tile removed from the dashboard, its ×N moved to the net worth page, whose Tout headline the assistant rewrote as the change since the first figure, ×N and the average per year, dropping the compounded percent; the table's average over the year shown only, divided by the months counted.

- The author reported that ticking several expenses on a repayment kept only one. The cause was the part not known yet taking all the income (bugs.md). The author chose: known parts first, then the unknown ones share equally; and approved pushing the migration (20261119120000, pgTAP 36).

- On 2026-11-20 the author asked for every dashboard card at half width; the heat map moved to month calendars to fill its card, then six across to match the monthly chart's height, with the cumulative chart beside the summary and the count as "290/365". Then Dépenses and its split merged into one card beside Revenus, each switching between stacked months and a donut, and the table back across the page; every series shown without Autres, and the missing-months warning as a tag beside the title.

**What Could We Do Better:**
- Changing the heat map's count to "290/365" with a regex also rewrote the events tab's "{{count}} jours" strings; caught while removing Autres, before any commit. Scope a translation edit to its own block.
- A dry run of `npm run db:push` passed `--dry-run` to the shell wrapper instead of the CLI, so it pushed for real. The push had been approved, but a preview was meant.
- A new sparkline overwrote the existing `components/display/sparkline.tsx`; caught by the type check, restored from Git and extended instead. Search the layout's folders before writing a file.

### 2026-11-18 - Dashboard: the sheet's figures, and events

**What We Worked On:**
- The author asked for the dashboard page to mix three plans: the spreadsheet dashboard (DSH), the events calendar and comparison (EVT-04, 05) and the yearly review (YR). The author chose one page with a period and tabs (Argent, Événements, then Social), this build covering DSH and EVT with the Social tab next, and a year, a month, the last 6 or 12 months or custom days as the period.
- On events the author chose month grids tinted by type with each event's total, bars per type to compare, and totals at my share, net of repayments.
- Built: `my_lines()` and `event_totals()` (ADR-063, pgTAP 35), the period and figures models with tests, the server function and both tabs.
- After seeing it, the author found it missing most of the sheet and asked for a full-width page with its information: the tiles (spent, earned, invested, remaining, net worth with its change and multiple), the cumulative and monthly charts, where the money went, income and expense reports by category with a filter, the expense split three ways, and the category table (this month, 6 and 12 months, average). The author kept a year and everything as periods, accepted the assistant's chart forms without filled lines, and kept Événements as a tab.
- Rebuilt on `my_monthly()` (pgTAP 35 extended); the old per-category stats and the narrow layout were removed. Checked in the design gallery with invented figures, at desktop and phone width.
- On real data the author found every figure at 0: the API cut `my_monthly` at 1000 of its 1751 rows (bugs.md); the long series are now fetched a page at a time. At the author's request the category table draws the tree's lines, and on Tout shows a total per year and the yearly average.

**What Could We Do Better:**
- The first version followed the requirement rows instead of the sheet the author works from; reading the sheet's layout first would have saved a rebuild.
- The usage limit cut the first build short, leaving lint errors and the docs for the next turn.

### 2026-11-18 - Security check, event skips test

**What We Worked On:**
- The author asked how to check that the database is encrypted. The assistant explained that encryption at rest is at the disk level and invisible through SQL, and listed what can be checked: TLS, the encrypted dump, RLS.
- The author asked whether security is solid, then to run the tests and the advisor. All 32 tables have RLS; the advisor found no errors, only warnings (GraphQL exposure, leaked password protection on a paid plan, `auth.uid()` per row in policies). pgTAP 32 failed.
- The author asked to fix it: the test's helper was wrong, the linking right (see bugs.md). All 35 files pass.

**What Went Well:**
- Tracing the setup step by step in a rolled-back transaction showed the database was right before any migration was touched.

**What Could We Do Better:**
- pgTAP 27 failed for a while because its migrations were being edited elsewhere at the same time.

### 2026-11-18 - List counts, list loaders, docs anonymized

**What We Worked On:**
- The author asked for the number of items on every list: a shared `ListCount` beside the page title (the transactions' filtered total). After trying it the author asked for smaller figures, and for Patrimoine's count beside its title like the other pages instead of on the list's controls.
- The author asked for a sort by number of transactions on Magasins, with the count where a transaction shows its amount, and whether the category filter was needed. The assistant said no, since the category sort does its job; the filter was removed (MER-06). After trying it the author asked to remove the count and the new sort too.
- The author found no loader at the end of a list still loading: a shared `ListEnd` spins in every list that grows on scroll.
- The author found that searching a parent category hid its sub-categories: a match now keeps its branch, in the picker and on Catégories (CAT-09).
- On /transactions, at the author's request: a spinner over the list while a new filter loads, the calendar icon centred in its tab, and 24px between the bubbles, the chips and the list; then, at the author's request, the pending and owed bubbles got the same space above them as the chips.
- The author asked to anonymize the docs and shorten the long sessions entries. Real people, places, merchants, employers and amounts were taken out of sessions.md, bugs.md and three design docs; nine entries were rewritten short.
- The author asked for invented names in the tests: pgTAP 19, 20 and 21 and two import unit tests now use made-up people, aliases and a group, and test 20 an invented rent; the same names replaced "Maman" and a real alias in six migration comments and one code comment. "Ben & Flo" stays, as it is a restaurant's name.
- The author asked to remove the real data from git history and to anonymize amounts too. The last real figures left the docs (a holding's return, the employer rate, the gridline step), and the real institutions left the tests, in every spelling (the author caught one). The assistant prepared a `git filter-repo` rewrite (journal docs replaced by their anonymized version in every commit, a replacement list for the rest) and checked it on a throwaway clone; the author asked the assistant to run it, then force-pushed. The push's CI failed on em dashes, formatting and an e2e selector, and the author asked why keys showed in the e2e log (the local stack's throwaway ones, now silenced): fixed, see bugs.md.

**What Went Well:**
- The end loader and the spacing were checked on the gallery's transactions specimen at phone width.

**What Could We Do Better:**
- A stray `git stash` was created and dropped while running a test; the working tree was not affected.
- A search for an institution name read the git-ignored real data folder into the transcript; searches must exclude `src/data/`.

### 2026-11-18 - Investment return on the hub row

**What We Worked On:**
- The author asked for a senior designer's view of a holding's row: "+xxx (xx %)" and "▲ xx %/an" were unclear, and the per-year figure seemed to include contributions. The assistant confirmed it did (a value change, compounded) and proposed one figure per row following the range, measured as a return, with the lifetime profit out of the subtitle. The author asked to build those two points.
- Built (ADR-062): `holding_flows()` with a pgTAP test, `returnOver` (modified Dietz, per year on Tout) with tests, the flows through `getNetWorth` and the chart hook, the profit removed from the row. The gallery check caught a holding opened mid-range read too high; it now starts at its first money in.

- The author then asked for placed and profit on the holding's card or chart: `HoldingFigures` shows Placé, Retiré and Profit total over an investment's opened chart, aligned right at the author's request; withdrawn left the investment's subtitle.
- The author asked that archived accounts and holdings keep their graph and info: they are now the same rows, drawing their whole history, with the closing date in place of the value and change. `EntryRow` lost its `aside` and `alignTop`; the gallery got an invented archived TFSA.

**What Went Well:**
- Checked on the gallery's invented figures: the RRSP fed monthly reads 9 %/an where the value change read about 21 %.

**Friction Points:**
- The assistant had said the holding's page kept the lifetime profit; it showed none, which led to the figures over the chart.

### 2026-11-17 - Net worth hub and subpages merged

**What We Worked On:**
- The author asked for a senior designer's review of /net-worth and its subpages. The assistant found repeated figures, two list patterns for the same items and controls scoped to one card. The author asked for every change: link cards with a count only (ADR-060), hub rows opening the item's form, debts owed in red, `circle-slash` for accounts hidden from new transactions, the range tabs above the dashboard.
- The author asked whether to merge the subpages into the hub. The assistant said yes, with a "Grouper par" choice for the bank-by-bank update round. Built (ADR-061): one list of every account and holding, grouped by type or institution, one archived section and one +; the subpages redirect; the old rows, drawers and sorts deleted.
- Next rounds, at the author's request: the sparkline opens the chart, the chart and the list side by side from `xl` with the list's controls on the tabs' row, a ⋮ menu for the actions and a shared `DrawerHeader`, the change legend and the composition card removed.
- The author found a card in credit shown as a negative debt confusing: a shared `OwedMoney` reads a debt in red, 0 plain, a credit as "+X $" in green.

**What Went Well:**
- Checked on the gallery's invented figures at 1400 and 390 px, in both groupings.

**Friction Points:**
- The Iconify API returns icons in its own order, so `ui-icons.json` was rebuilt from the committed file with only `circle-slash` added.
- Opening the real /net-worth to check the redirects was blocked (real data); only the gallery and the route tree were checked.

### 2026-11-17 - Net worth hub redesign

**What We Worked On:**
- The author asked for a senior designer's review of the hub. From the gallery only, the assistant flagged unlabelled change periods, names cut on phones, an outlier swamping the bars, the total repeated and too many gridlines.
- Asked whether it would keep the chart, the assistant proposed the net worth line alone, change bars by group, the composition as sidebar bars and rows opening their own chart. The author asked to build it on the page: `periodChanges` and `axisTicks` with tests, spec 20 and NW-04 rewritten.
- After trying it the author asked to remove the "X $ (total)" line (ADR-059), to merge the period menu and the range tabs into one row, and for Tout to read per year (`annualChangeOver`).
- The author asked for the same review of /transactions. Kept: the hub's 12-column grid, the period as tabs, the search beside them, a shared `GroupHeader`, a gallery specimen. A headline of spent and received was built, then removed at the author's request with its migration.
- Then, at the author's request: rolling tabs (1M to 1A, Tout), fewer controls in the filter sheet, the calendar's month and year as one picker, the stores filter loading on scroll, the sidebar's amounts at one size.

**What Went Well:**
- Checked at 1440 and 390 px on the gallery's invented figures; the phone check caught the range tabs running off the card.

**Friction Points:**
- The headline's migration first returned 0 instead of null on later pages; caught by its test, then undone with the headline.
- A regex removing strings by key took another block's keys; caught by the typecheck.
- `32_event_skips` fails five tests on the linked database; unrelated, left for the author.

### 2026-11-16 - Net worth chart

**What We Worked On:**
- The author asked for the net worth dashboard: the chart and what it leaves out (NW-04, 05); salaries (NW-09) later. Month ends as samples, a month with no value keeping the last one, each point at its own date's rate.
- Grilled on the plan, the author chose ranges of 1 to 10 years and Tout, the total and the chart in one card, items left out one by one, pending counted. The author also had specs 19 to 21 marked built and the roadmap made the one status record.
- Built: `net_worth_series()` (migration, test 33), ADR-057, the series model with tests, Recharts through shadcn's chart.
- After trying it, several rounds at the author's request: a list with sparklines instead of a line per item, accounts in assets and credit cards in debts, debts as amounts owed, a closed item ending at 0, the total leaving out hidden items (ADR-058), a composition with monthly bars, hiding items behind an eye, the sidebar on 4 of 12 columns.

**What Went Well:**
- Test 33 passed on the linked database before any UI was written.

**What Could We Do Better:**
- The function first returned numeric, which the generated types read as a number; changed to text (ADR-023).
- A browser console error on the real hub carried a real figure into the transcript. The chart was then checked only on the design gallery.

**Friction Points:**
- `shadcn add chart` also added `cn` and `lucide-react` and tried to rewrite `card.tsx`; all three undone.

### 2026-11-16 - Income titles, Types filter, defaults from filters

**What We Worked On:**
- The author asked that an income from a person or a merchant show their name as the row's title, not the category: the source person now names the row, as a merchant already did.
- The author asked for a filter on the three types (transfer, income, expense): a Types filter first in the bar and the sheet, without a search. Migration `20261116100000_list_by_kind.sql` adds `kinds` to `list_transactions` (pushed), test 10 extended.
- The author asked that a filter narrowed to one value be the default of a transaction added with the +: the account, type (transfer opens the transfer form), category with its type, merchant with its default category, person (source of an income, guest of an expense) and event. `withFilters` in `transaction-defaults.ts`.
- The author asked for a traditional desktop layout for the filters, after setproduct's sidebar template. Asked how sections should start, the author chose folded; once built with the lists unfolding inline, the author asked whether to keep the phone layout since category and people lists are long. The assistant proposed a sidebar of summaries (the phone's first level, each row opening the sheet); the author chose it. The author then asked for that sheet to open from the left on desktop, and for every group in a sheet's lists to start folded.
- The author asked for more space between the sidebar and the list (48px), and said adding a transaction lost their place in the list: fixed in `useTransactionPages` (bugs.md).

**What Went Well:**
- The + was checked in a browser: a list filtered on incomes opens the form on Revenu.

**What Could We Do Better:**
- Test 32 (event skips) fails 5 of 10 on the linked database; it does not touch this change and was left alone.

**Friction Points:**
- The running dev server rendered the new filter label as its key on the server (a hydration warning) until restarted.

### 2026-11-13 - Sauf, calendar header, avoirs card

**What We Worked On:**
- The author asked for the auto-link category exclusions back, per event and as a default list, visible: ADR-055, then a Réglages tab for the default with the event following it (ADR-056), migrations pushed, test 32.
- The author found "Sauf" unclear: the field became "Catégories exclues du lien automatique", a sub-field of the auto-link checkbox, itself a sub-field of the dates.
- The author said the assistant again invented patterns (a + icon, a new picker). The field now reuses the receipt's category circles and the filter's category screen.
- Smaller requests: a ball icon for pet games, one "n avoirs" count, the calendar's month and year as lists with one pair of arrows, groups found by name in people pickers.
- Fixed (bugs.md): "Translations for fr were not loaded", a default list that timed out on save (`relink_events` in one pass), a generic place saved as a merchant.

**What Went Well:**
- Each screen was checked at phone width in a browser.

**What Could We Do Better:**
- Invented a + icon and a picker instead of comparing with the receipt and the filters first.
- The pgTAP tests are unrun (no Docker).

**Key Takeaways:**
- Chromium's `scrollIntoView` now returns a promise: an arrow effect must not return it.

### 2026-11-13 - Speed

**What We Worked On:**
- The author said every load and action was slow. Fixed the session check, per-row "in use" queries and `list_transactions` (ADR-053). The author turned down merging the form's 8 calls: measure first.
- Sheets and pages still paused. Measured in a browser on a production build (the author signed in): the cause was rendering. Sheets and pages now open at the click and load in place (ADR-053, ADR-054).
- The author asked for every list to be fast, for any amount of data, and for one language to ship. Lists build rows as they scroll, list pages preload, each language is its own chunk (ADR-054).
- `.playwright-mcp/` is ignored and its committed files removed.

**What Went Well:**
- Profiling a production build found each cause quickly.

**What Could We Do Better:**
- Guessed twice before measuring in a browser.
- Wrote journal entries far longer than the 2026-11-11 trim allows; the author asked to shorten them.

**Friction Points:**
- Measuring needs the author's sign-in in the test browser.

**Key Takeaways:**
- Measure before restructuring; keep journal entries short.

### 2026-11-12 - Next step, first run moved to improvements

**What We Worked On:**
- The author asked what comes next. The assistant proposed the Phase 4 dashboard; at the author's request first run (SET-01) moved to improvements.
- The author found the history before 2023 imported with day and month swapped. The rows were fixed in the database, not re-imported, and two rows already corrected by hand were restored (bugs.md).
- Most of the session was a clean-up of the imported history, row by row with the author: sellers for expenses bought from a person, people roles (with, invited, owes) matched to the sheet's words, merchants created from notes and then reviewed, events linked to trip costs outside their dates, categories split out of Divers, foreign amounts set from the notes, ATM fees moved to Frais bancaires, everyday money taken out of trip events. Each fix is a bugs.md entry.
- The author said an invited person has no part ("I paid for them"): ADR-052 and two migrations let an invited line be 0, in the form and in the import.
- The author asked for a suggested default category on merchants without one (MER-08): a view, test 30, and a "Suggérée" tag that confirms it in one click.

**What Could We Do Better:**
- The first passes on people roles and sellers read the author's rules too loosely; each needed a correction.

### 2026-11-12 - First pass on an iPhone

**What We Worked On:**
- The author tried the app on an iPhone 12 and listed what broke. Done: the search field has a clear button (the native one is hidden so it looks the same everywhere); a tap on a picker's clear button keeps the focus, so the keyboard and the list no longer shift under the finger; picking an option on a phone blurs the field, so the keyboard closes; the sheet follows the visible area (`useVisualViewport`) instead of the page behind the keyboard, and the list flips and shrinks against the sheet; the sheet no longer focuses its first field on a phone.
- The author asked for toasts to carry the result: green for a success, the FormAlert error style for a failure, neutral for a note. A failed save in a form is now a toast instead of a message at the bottom of the form (`SheetForm`'s `error`). Success reuses the income green, replacing the purple of `FormAlert`'s success.
- Not confirmed on a device: the first letter skipped in pickers (the likely cause is the layout moving when the keyboard opens, now addressed) and the touch point sitting below the field. Not reproduced: "a person cannot be saved as a store", which needs the steps the author took.

**What Could We Do Better:**
- Nothing was seen on a phone; the fixes follow known Safari behaviour and need the author's retest.

### 2026-11-12 - Data management page name, holdings polish

**What We Worked On:**
- The author asked to rename the import page "Gestion des données", move it beside "Se déconnecter" and choose between a subpage and tabs. The assistant recommended one route per tab under `/data`.
- Two ideas for improvements.md at the author's request: a privacy mode and a relationship view on Proches.
- Holdings, at the author's request: the name without the currency, the profit percent in parentheses, a thin gap before a currency or a percent (`Money`, `Percent`), "Lié à…" with a Placement choice in the transaction form, the holding naming the row, transfers as a list with "Ajouter un transfert".
- The author chose "Avoirs" for holdings (ADR-051) and "Patrimoine" for net worth in French; the import's labels followed.
- A transfer question was settled by arithmetic: the percent was right, only not annualised. An annualised return went to ideas.

**What Could We Do Better:**
- Nothing was seen in a browser.

### 2026-11-12 - Holdings import

**What We Worked On:**
- The author asked for the import to take the net worth history from a spreadsheet export and a yearly tracker, and to first rebuild the employer contributions that no account shows.
- The assistant estimated the employer share from pay slips and balance changes. The author settled the open points (series that moved between institutions, year-end points only for the approximate years, labelled estimates where the real split is unknown). The assistant advised labelled estimates over leaving contributions out, which would inflate profit.
- Built: ADR-050, migration `20261112110000_import_holdings.sql`, test 27, the import's holdings columns, errors, templates and summary block; import.md, IMP-02, database.md and spec 19 updated.
- A one-off update linked the existing investment transactions to their holdings.
- Two bugs fixed on the way (bugs.md); the summary reworked with the author. The author's files sit in the git-ignored data folder; a dry run passed.

**What Could We Do Better:**
- 11 existing pgTAP failures on "permission denied for function check_transaction_holding" predate this work.
- The import screen was not tried in a browser.

### 2026-11-12 - Holdings: separate icons for values and contributions, transfers

**What We Worked On:**
- The author asked for values and outside contributions to leave the edit form for icons of their own, and for contributions to move between holdings when an account changes institution.
- Asked what moves, the author chose everything placed, a dated entry on both holdings, and archive only for a holding with a history: ADR-049, `holding_transfers`, migration and test 26, pushed.
- The author asked that a withdrawal not erase what was placed: placed and withdrawn are now separate figures, withdrawn shown above zero only.
- Smaller requests: no repeated institution under its drawer, the accounts' sort options on holdings.

**What Could We Do Better:**
- The pgTAP tests are not run (no Docker). Nothing was seen in a browser.

---

### 2026-11-12 - Holding type select needs two clicks

**What We Worked On:**
- The author reported that on the holding form, choosing a type other than the prefilled one needs two picks: the first closes the select with the value unchanged, the second and later ones work. It happens on new and existing holdings. This is the first-pick bug left open in the 2026-11-11 session.
- The assistant read the select, `useHoldingChoices`, `offeredType`, `useSheetForm`, the validation hooks and `FormSheet` and found no cause by reading. The only first-time-only behaviour is `markChanged` on the sheet's first input. No code changed; the next step is to reproduce it in a logged-in browser.

- The author said the currency select fails the same way, so the cause is shared. The assistant suspected the sheet's `onInputCapture={markChanged}`, which re-renders on the first input before the select's own change handler runs, and moved it to the bubbling `onChange`. The author tried it and the first pick now registers.

**Friction Points:**
- Reproducing needs a signed-in session, and `.env` must not be read.

---

### 2026-11-11 - Planning the holdings and the net worth page

**What We Worked On:**
- The author asked to plan the holdings. Decided with the author: an optional holding on an expense, snapshots now, employer and government contributions in this slice, debts with values only, a count of investment transactions without a holding (spec 19, ADR-045).
- The author asked for accounts and holdings under one Net worth hub with subpages; the assistant advised one page, the author chose the hub (spec 20, ADR-046). A grilling settled the total, a missing rate, the update label and the order of work.
- The author corrected the "no back link" rule, since the subpages need one. Institutions moved to Réglages, shared by accounts and holdings (spec 21, ADR-047).
- Many rounds of form changes from the author: country first and the type following, an optional name, "Autre" as a nested sub-field, smaller cents, no "(facultatif)", one segmented choice pattern, a warning orange (ADR-048).
- Built across the session: the holdings migrations, server functions, the hub, the holdings subpage and sheets, the Placement field and filter. The first-pick bug of the type select stayed open for the next session.

**What Could We Do Better:**
- The migrations and pgTAP tests were not run locally (no Docker, ADR-014).
- The assistant first wrote "Fermer" for archiving a holding; the rules say "Archiver".

**Key Takeaways:**
- Export then import will not round-trip the holding link until the export adds a `holding` column (ADR-045).

---

### 2026-11-11 - Code review and fixes

**What We Worked On:**
- The author asked for a review as a recruiter, then as a senior engineer, then to fix everything. The review found `verify` failing on main (formatting in `events.ts`), migration churn, almost no component or server tests, a manual row mapping in `getTransaction`, and the per-request cost of `getSession`.
- Fixed: formatting. Moved `isCrossSiteWrite` from `server.ts` to `lib/server/security-headers.ts` with a unit test.
- The author asked whether Playwright could do end-to-end tests. The assistant said yes and proposed a local stack in CI, a test user with TOTP computed from the enrolment screen, and three flows. The author said build it, non-blocking at first. Built (ADR-044): `e2e/` with a setup project, sign-in specs and an import-then-add-expense spec, plus an `e2e` CI job.
- Not changed, and why: squashing migrations waits for the first real import (the project is still the dev database, ADR-022) and needs the author's say. `getSession` revocation and the dependency pin policy are decisions, not defects.

**What Could We Do Better:**
- The e2e specs were never run: the laptop cannot start the stack (ADR-014). They are written from the screens' source and need fixes on the first CI runs.
- The review claimed there was no Origin check. It was wrong: `server.ts` already refused cross-site writes and `security.md` says so. The grep that was meant to find it had failed and the miss was reported as a finding.

**Key Takeaways:**
- Run `npm run verify` before proposing a commit.
- A CI action pinned by SHA must be copied from a workflow that already uses it, never recalled.

### 2026-11-11 - A design gallery in place of Storybook

**What We Worked On:**
- The author asked whether to build Storybook for a more consistent design system. The assistant advised against it (a dependency, decorators for i18n and the router, and the real problem is reuse) and proposed a dev-only `/design` route. The author said yes.
- The author then asked for the inconsistencies the gallery should catch. The assistant listed them from the code; the author chose 48rem for every column, and asked for the fixes: one `IconBubble` for the round badges, one error style (date fields use `FieldMessage`), rates, percents and import dates through `format.ts`, round `Tag`, one small radius. Mid-way the author asked for amounts and currency codes in Inconsolata everywhere, and for the sub-field line (`LinkedFields`) in the gallery.
- Built `/design` (ADR-043): foundations (colours, text, radius, icons), actions, fields, display, lists and cards, feedback. Dev-only and English-only, so the i18n lint rule skips it.

**What Could We Do Better:**
- Not seen in a browser: the route sits behind sign-in and MFA. Checked with typecheck, lint and tests only.

**Key Takeaways:**
- A new shared component gets a specimen in `components/design/` in the same change.

---

### 2026-11-11 - Docs audit and trim

**What We Worked On:**
- The author found the docs too big for a new dev (about 98,000 words) and asked for an audit. The assistant reported that sessions, decisions, process and the 13 screen specs were most of it.
- The author decided: drop process.md's "Who decided what" table; split design calls from ADRs (design calls to a file under `designs/`, ADRs more technical); delete built screen specs and anything the UI does not show; trim improvements.md to ideas not built and not decided against, with a mention of those turned down; trim sessions.md keeping the structure and the why, who and what for; fix stale docs and trim database.md to what the code does not say.
- Done: `design-decisions.md` and `domain-rules.md` created; `02-screens.md` became UI conventions; 12 built specs deleted, first run and export kept as the only screens left to build; roadmap rewritten as a checklist; CLAUDE.md's definition of done no longer points at the removed table. About 98,000 words became about 38,000.

**What Could We Do Better:**
- Comments in `src/` still say "(spec 12)" and similar; those specs no longer exist.

**Key Takeaways:**
- Built screens are specified by the code. Docs keep the reasons, the rejected options and the rules the code does not show.

### 2026-11-11 - A rotating loader instead of "..." words

**What We Worked On:**
- The author asked to replace every "Enregistrement…" / "Chargement…" with a rotating loader.
- Added `components/feedback/spinner.tsx`. A pending button keeps its label and shows the spinner before it, so the width does not jump. Unused pending keys removed in both languages.

**What Went Well:**
- Every pending state already went through a `pending` flag, so no logic changed.

**Key Takeaways:**
- A pending button shows its usual label with a spinner, so it needs no second translation.

### 2026-11-11 - Events that do not link by date

**What We Worked On:**
- The author asked whether to bring back tags for a Swiss youth visa year (2026-2027) that should not swallow a real trip. The assistant advised an event over tags; the author asked for a checkbox on events that turns the automatic link off, and chose to remove existing automatic links while keeping manual ones.
- Built `events.auto_link`, the form checkbox, ADR-042.

**What Could We Do Better:**
- The migration forgot the column grant (`events` has column-level grants); pgTAP caught it after the push.

**Key Takeaways:**
- A new column on a table with column-level grants needs its grant in the same migration.

### 2026-11-11 - Merging people after the first import

**What We Worked On:**
- The first real import created a person that was an alias of another, and left some merchants unrecognised. Only the first was an app gap; the rest came from the converter, which the author fixed by hand. The author asked for a people merge: `merge_people`, PPL-07, ADR-039. Merchant aliases got an editor shared with people's (`save_merchant`).
- The author said "Cette personne est le magasin" made no sense and asked to review what a person can be on a transaction. The assistant proposed a `with` role and a seller on the transaction; the author chose both (ADR-040, PPL-08, PPL-09). The Magasin / Proche choice went through several corrections by the author until it became a toggle group, with a merchant also allowed on an income.
- The author found the app slow and a sheet sometimes not opening. Read from the code: every sheet loaded all pickers' data and rows preloaded on hover. Fixed with one layout route for the form data (ADR-041). The sheet that did not open was just unpushed migrations.
- Smaller asks: the year in day headers; merchant aliases kept out of the merchants list.

**What Could We Do Better:**
- The first answer covered four points before the author chose; only one was wanted built.

**Friction Points:**
- Generated types lack new functions until migrations are pushed and `db:types` runs.

**Key Takeaways:**
- A merge touching a table with a unique key needs a collision rule, written in the ADR.

### 2026-11-10 - The import format

**What We Worked On:**
- The author asked how the spreadsheet should be divided for an import of currencies, people, events, merchants, categories and fees, then asked to start the format from scratch with everything created on demand: ADR-033, import.md rewritten, IMP-06.
- A local converter (outside the repo) turned the Aspire export into the import files, reviewed in many rounds by the author, who corrected the assistant on what is a person, a trip, a merchant or a category. Decisions: drop nothing, import starting balances (ADR-034), accept archived categories up to their archive day (ADR-035), reimbursements read by hand rather than by score.
- Database: `import_batch` (check, dry run, write, set-based to fit the 8-second API limit) and `import_undo`, ADR-036. The assistant wrongly believed an event needs a start date and built around it; the author corrected it.
- Screen: the author chose a steps layout from three previews and gave eleven rounds of feedback (two steps, a stepper after a Figma reference, merges and edits of new items, aliases kept on merge, an error card paired with the done card). The author said the import being built is the wizard, narrowing IMP-03 (ADR-037).
- Bugs found: the first letter typed in a combobox was lost in every sheet (an unstable callback); merges and aliases were lost after an import error (now kept in browser storage); a late-rent repayment above the expense was wrongly refused, then fixed in `save_transaction`.

**What Could We Do Better:**
- A rolled-back trial does not run deferred constraints, so early trials hid `people_sum_mismatch`.
- The assistant refused repayments above the expense and deleted links from the data; the author said that is normal and the fix is in the code.

**Friction Points:**
- `db lint` cannot see temporary tables (solved with a no-op pragma function); the import first ran 6 s against an 8 s limit, so guest-only people lines were made set-based (4.4 to 5.1 s).
- The data folder was not git-ignored, so real data could have been committed. Fixed.

**Key Takeaways:**
- Test the real files as the API role with its timeout, and commit-time constraints need a real commit.

### 2026-11-10 - Transactions filters redesign

**What We Worked On:**
- The author asked, as a senior UI/UX designer review, to improve filtering on phone and desktop: the custom calendar opened in another modal, chosen filters showed nowhere, and five filters in one tabbed sheet did not work.
- The assistant proposed a scrolling bubble row on phones; the author chose two navigation levels instead (ADR-029). After trying it, the author asked for individual chips, a bubble that always keeps its name, sheets from the right, the period inside the Filtres sheet (ADR-030), a "Dates" bubble with Tout as Effacer (ADR-031) and finally one calendar for the period, no tabs, year list or month grid (ADR-032).
- Also: "Sans événement" removed; a filter with nothing to choose is disabled, found by a cheap existence query (the author rejected loading every list).

**What Went Well:**
- The sheet already skipped its tab row for a single tab, so desktop needed little.

**Friction Points:**
- Running prettier over `docs/` reformatted 34 files; reverted. The docs are not formatted by prettier.

**Key Takeaways:**
- A bubble that names the filter makes tabs inside the sheet redundant.

### 2026-11-10 - List and filter polish

**What We Worked On:**
- After the events build the author asked for the Magasins category filter to match the transactions bubble filter, a bigger currency chip, wrapping filter tabs with counts, faster ticking, an alphabetical Réglages menu, and counts removed from event and type rows.
- Deletes: the author rejected a count in the dialog, then any database change; a blocked delete fails with a toast saying why. Delete titles end with "?". Sort labels read "Nom (A à Z)", "Solde (plus faible)".

**Key Takeaways:**
- Counts do not belong on every settings list; the dashboard may show them later.

### 2026-11-09 - Events (spec 22)

**What We Worked On:**
- The author asked for a spec for events, then to be grilled on it, then to build it. Decisions after three rounds of questions: one event per transaction, a removed automatic link remembered, a page in Réglages with Événements and Types tabs, a type not required, events deleted but never archived (past is by date), a free hex colour shown as a soft Gmail-style pill, the event's people kept apart from the transaction's, and the transaction form showing the match as the date changes. The assistant added that the narrower range wins and the rule stays in one SQL function.
- Built: migration `events`, pgTAP `16_events`, the page and forms, the tag, the field on the transaction form, the list and its filter.
- The author then reshaped it over the day: no Sauf field, then dates optional, then one date range field (react-aria, calendar rising from the bottom like TravelSpend; ADR-027, ADR-011), then no categories on events at all (the tag is removed by hand), no icon on types, and every date field on the shared calendar (ADR-028).

**What Went Well:**
- The matching rule lives in one SQL function that the form, the save and the recompute all call.

**What Could We Do Better:**
- The first plan assumed archiving and a required type; both were wrong.
- No browser check: sign-in needs the author's password and second factor.

**Key Takeaways:**
- Ask what an optional or archived thing means before copying the people screens.

### 2026-11-09 - Bubbles without a background

**What We Worked On:**
- The author asked to uniformize bubbles and the sort and collapse buttons with no background, and the same for the receipt's buttons. Bubbles (`chipSurface`) are transparent with a border; the author then asked the pending and owed bubbles to keep their tint.

**Key Takeaways:**
- New bubble-like buttons take `chipSurface`, not a `Button` variant.

### 2026-11-09 - Duplicate logic removed

**What We Worked On:**
- The author asked for a senior full-stack review for consistency, reuse and one place to edit each behaviour, without overengineering. Findings: archive and delete dialogs copied in every actions file, the list row shell three times, the name schema four times, repeated server delete and archive queries, and many inline search helpers.
- The author questioned inconsistent names (`DeleteAction` vs `ArchiveDialog`) and an unfounded time estimate, chose dialogs, and asked to do everything. Built shared `DeleteDialog`, `ArchiveDialog`, `ListRow`, name and note schemas, `updateRow`/`deleteRow`, and `compareNames`/`matcher`.

**What Could We Do Better:**
- A time estimate was given with no basis. Say relative size instead.

**Key Takeaways:**
- The shared form and sheet layer was solid; the duplication sat in per-entity actions, rows and server CRUD.

### 2026-11-08 - Code layout by role and feature

**What We Worked On:**
- The author asked for a senior review of the architecture, suspecting `components/`, `lib/` and `i18n` lacked structure. The first answer was built from file names; the author said reviewing without knowing the code was bad work. The assistant then read exports and counted importers, and changed the plan in four places.
- The author decided: every hook in `hooks/`, more folders, i18n regrouped by language, and the pass also covers naming, server types and import cycles. Done in seven green phases: hooks, `lib/` by feature, types out of `server/`, `components/` by role, fifteen export renames, five import cycles removed, icon files renamed (ADR-026).

**What Went Well:**
- A throwaway script moved files and rewrote imports (288 files), and typecheck passed after each phase.

**Friction Points:**
- `sed` on macOS has no `\b`; one rename silently did nothing and the typecheck caught it.

**Key Takeaways:**
- Count who imports a file before deciding where it goes. A name two files share is a naming problem even when the folders differ.

### 2026-11-05 - Events take the place of tags, people, reimbursements

**What We Worked On:**
- The author asked whether tags and events are the same. They overlap, so the author decided events are the priority, get the automatic linking and show as a tag on the transaction, and tags go to improvements (EVT-07).
- The author then proposed moving Réglages into a menu icon like TravelSpend's: four tabs (Transactions, Comptes, Dashboard, Budget), accounts at `/accounts`, Proches in the menu, net worth joining Comptes later.
- People (spec 19 to 21, built the same day): groups and people with aliases for the import (PPL-06), people lines on a transaction with a Proches filter, an owed highlight, and reimbursements. The author set the rules: a person's icon is their initial, a group's its members' avatars, a group is never a line, Invité by default, and an empty amount means not known yet, set later by the reimbursement; linking is from the income only. The author asked for many form details (check lists with the field's radius, a create row, focus only after keyboard use, the add button first in focus).
- Found and fixed: no focus outline anywhere (Tailwind 4 `outline-none` quirk, bugs.md), and a person without a name could not be paid back.

**What Went Well:**
- The tag and event overlap was caught before either spec was written.

**Friction Points:**
- `node` and `npx` were not on the shell PATH (nvm), and the Playwright MCP failed to start for the same reason.

**Key Takeaways:**
- Two requirements that can hold the same thing get settled before their specs.

### 2026-11-05 - Phases reordered, and the balance adjustment

**What We Worked On:**
- The author corrected the assistant's reading of the roadmap: proches, tags and events come next, then the dashboard, with the import before the dashboard so it is built on real history. Region packs, birth date, country, local purchases and the goal celebration moved to improvements; the yearly review and dashboard might merge.
- Balance adjustment: the assistant proposed a fourth tab on the +; the author said a fourth tab no longer fits on phones and an adjustment needs the account's value in sight. Final shape after the author's corrections: "Ajuster un solde" as a third choice under Comptes' +, the account chosen in the sheet, built on the receipt slip with the app's balance and the gap (`adjustment_edit`, `save_adjustment`).

**What Could We Do Better:**
- The first answer read the roadmap's numbering instead of the order the author set the session before.

**Friction Points:**
- A numeric function result reaches the app as a float; a text variant was added (ADR-004).

**Key Takeaways:**
- When the roadmap's numbering and a recorded decision disagree, the decision wins and the numbering gets fixed.

### 2026-11-05 - Transfers, their QA, and the import moved after the social layer

**What We Worked On:**
- The author said the import comes after people, tags and events, so everything a transaction can carry exists before the one pass. Holdings and tags joined phase 3; recurring stayed later.
- Built the transfer form (spec 16) on the existing SQL functions: received amount at the rate, conversion cost, fee category, a pending box per side.
- From the author's QA: pending rows stand out in the spreadsheet's blue with a "3 en attente" bubble; fees read as the transfer's and unsigned ("Frais de conversion", "Frais de transaction"), drawn as lines inside the row on the tree's elbow with a dashed rule; the loss on a currency conversion counts as spending in one fee category. The fee category moved from a Réglages row to a checkbox on the category itself, after the assistant suggested it.

**What Went Well:**
- The database side was already done and tested, so the work stayed in the app.

**Key Takeaways:**
- A reviewed spec older than the screen it extends needs checking against what was built since.

### 2026-11-05 - Category history and the archived section

**What We Worked On:**
- The author asked for the category history as a two-column table, and whether the archived section keeps the tree and whether a sub-category can come back without its parent. The assistant recommended a tree and reactivating the archived parents with it; the author agreed (`reactivate_with_parents`, `via_category_id` so a history line says "Archivée avec “Animaux”").
- The author reported closing a sheet scrolling the list to the top. The fix took two tries: first the router's `resetScroll`, then the `invalidate()` after navigation (bugs.md). The transaction delete dialog was rebuilt from a table into sentences at the author's request.

**Friction Points:**
- Claude in Chrome and the Playwright MCP were unavailable, so nothing was seen in a browser.

**Key Takeaways:**
- A history reads faster as a table when every line has the same shape.

### 2026-11-05 - Filtering on phones

**What We Worked On:**
- The author asked, as a senior designer, to check the transactions page on a phone: filtering did not work, worst inside the sheet. The browser tool failed, so the assistant reviewed the code and listed the problems (period buried, search squeezed, ticks invisible behind a full-screen sheet, 32px rows).
- Built a bubble row (period with arrows, a button per filter), a tabbed sheet with a search per tab and a footer with the result count (`total`), whole-row targets, and a single Filtres button on phones.

**What Could We Do Better:**
- Nothing was seen in a browser, which is how a tab overflow got through.

**Key Takeaways:**
- On a full-screen sheet, a filter that applies at once still needs a visible way back to the list.

### 2026-11-05 - The transactions list

**What We Worked On:**
- Spec 14 built as a month list with tiles. The author found it mixed the list with the dashboard: no tiles, a choice of period (everything as you scroll, a year, a month, custom days), the account named with its institution, the note in the row, every split category as an avatar stack, one-size amounts, a day net with a minus only. The assistant asked four questions; the author's choices became ADR-level rules in design-decisions.md.
- Then search (through every field a row shows), filters by account, category and merchant with trees and whole-branch ticking, room for thousands of merchants, the field border colour set halfway between the card border and the old field edge (the assistant flagged the contrast), tabs inside the sheet on phones.
- The author twice corrected scope: "we are in the transactions page, not account", removing the account actions the spec had placed on the list.

**What Could We Do Better:**
- The first build followed the spec's tiles and markers without asking whether a list needed them; the author's first look undid most of it.
- The signed-in screens need the author's second factor, so nothing was clicked through.

**Key Takeaways:**
- Totals that must match the charts belong in SQL. The list is for finding and reading transactions; summaries go to the dashboard.

### 2026-11-05 - Codebase review

**What We Worked On:**
- The author asked for a senior full-stack review: consistency, reuse, one place to edit each behaviour, no overengineering. Findings: sheet forms threw on a network error while the transaction form caught it, no translated error or not-found page, the same submit skeleton and create flow repeated, server error mapping repeated, amount helpers written twice, `lib/` importing from `components/`.
- The author asked to fix all of it: ADR-025 (`useSheetForm`, `useInlineCreate`, `lib/db.server.ts`, `failureFor`, `lib/money.ts`, route error screens).

**What Went Well:**
- The base was already consistent: one `Result` type, `SheetForm`, `RouteSheet`, `useServerAction`, i18n lint, money in BigInt.

**Key Takeaways:**
- Extract patterns repeated three or more times; do not add layers.

### 2026-11-05 - Needs, wants and where subscriptions go

**What We Worked On:**
- The author asked how to track needs, wants and savings when a sub-category differs from its parent, and where subscriptions go. The assistant recommended a mark on expense categories only, an unmarked branch as unclassified, and subscriptions filed by purpose (CAT-10, DSH-09).
- Built the `necessity` column and the form field. It took seven looks: a select, a pill, two chips, two buttons, then radios, because the three states (own, inherited, none) never fit two buttons.
- The author also asked every sheet to stop scrolling the list to the top (`staticData.sheet`).

**What Could We Do Better:**
- "Write it up" with a category choice in the same message was read as docs only; the author also wanted the categories added.
- Naming the three-state problem before the first build would have saved rounds.

**Key Takeaways:**
- A category says what money is for; how it is paid (recurring, subscription) belongs to recurring rules, so a category never mixes needs and wants.

### 2026-11-05 - One add button, dropdown selection and list fixes

**What We Worked On:**
- The author sent eight changes: search above the tabs, one round + on every page that fans out several choices, popups with the field's radius and border, a tinted selected row with no check, no favourites on Devises, merchant icon at full row height. The assistant asked three questions and previews settled the ambiguous ones.
- A shared `cn` quirk kept popups round (it did not know `rounded-field`); fixed after the author pointed it out. The institution header opens its sheet from anywhere on the line.
- The author found the date selector "not cute"; the assistant built a shadcn calendar field (ADR-024), the author found month and year could not be chosen directly, and asked to go back to native. Everything was reverted.

**What Could We Do Better:**
- The popup radius change was reported done without checking the rendered classes.

**Key Takeaways:**
- Reversing a recorded decision (add buttons beside the title) needs every spec that drew the old layout updated, first-run included.

### 2026-11-04 - The transaction form (spec 15) and actions in the sheet header

**What We Worked On:**
- The author asked to build spec 15. Asked where delete should live, the author decided after looking at TravelSpend: on phones all actions sit in the sheet header, on desktop on the row.
- Built the form: BigInt previews, splits, foreign currency with fee, merchant and category pickers with "Fréquentes", a floating add button, "Abandonner les modifications?" on every sheet. The Transactions tab moved to `/transactions`.
- The form was redesigned three times after the author's reactions: a step-by-step version (category first, chosen by the author) was built and rejected because the merchant could then fill nothing. The assistant's expert-designer recommendation, which the author adopted: one form in the order of a receipt (mono type, torn edge), merchant before category, a category row opening a full-screen list. Many details then followed from the author: the receipt slip, "Magasin" instead of "Marchand", round category icons, split lines with a remaining-amount line.
- The author made clear time should not exist at all (no time zone, a date typed as 17.08.2026 never moves): `transactions_without_time`, TRX-01 changed. Percentages are capped at 100. Date shortcuts removed.
- A `/clear` is a session boundary for this journal.

**What Went Well:**
- Questions with mockups let the author compare layouts before any code.

**What Could We Do Better:**
- The step-by-step entry was built before its costs were weighed.
- The form could not be tried in a browser (sign-in needs the owner's TOTP).

**Key Takeaways:**
- An open question in a spec is the author's: ask before building.

### 2026-11-04 - The transactions migration

**What We Worked On:**
- The author asked to start with the transactions migration, from specs 14 to 16: `transactions`, `transaction_splits`, deferred constraint triggers for the split sum and transfer shape, the save functions, `account_balance_on`, real balances, `merge_merchants` moving transactions. 39 pgTAP tests.
- Dry-run on dev inside a rolled-back transaction, then pushed.

**What Went Well:**
- A migration and its test in one rolled-back transaction caught two mistakes before dev.

**Key Takeaways:**
- Deferred checks need `set constraints all immediate` in tests, or they never run.

### 2026-11-03 - Add buttons, balance sort labels, and merchants (spec 13)

**What We Worked On:**
- The author asked to redesign the Ajouter menu holding both account and institution, then pointed out other screens said "Ajouter une …" and asked for one standard. The author chose short buttons with the noun everywhere, and noted "Date d'ouverture" is its own field, not a sub-field of Devise.
- Merchants (spec 13) built whole before transactions. A duplicate is an alias: a merge keeps the source's name as an alias of the target (MER-02, MER-05). The author asked for a sort and a category filter on Magasins, tree-drawn category dropdowns everywhere, and shared "Rechercher" / "Aucun résultat." wording.
- Favourites dropped (`is_favourite`) after the author asked if they were necessary; the assistant suggested an automatic "Fréquentes" group, and the author agreed (CAT-06).
- Category archive history can take past periods (`add_category_pause`).

**What Went Well:**
- Asking before redesigning: "redesign" had several readings.

**What Could We Do Better:**
- The first version changed Comptes alone; checking the other screens' add buttons first would have raised the consistency question.

**Key Takeaways:**
- A label change on one screen is a pattern change: check the shared patterns and the other screens in the same pass.

### 2026-11-03 - Categories (spec 12), and aligning every spec with the accounts corrections

**What We Worked On:**
- Spec 12: migrations for `categories`, append-only `category_status_events`, `recolor_categories`, 25 pgTAP tests, 128 icons with words in both languages, then the tree, archived section, form, icon picker.
- The author asked why the screens replicated "old and bad patterns" compared with accounts. The assistant found eight gaps; the author dropped "Enregistrer et ajouter", asked for the shared combobox for Parent, and parent rows like institution headers. Every spec was then aligned (shared patterns added to 02-screens.md).
- The author reviewed the category sheet at length: parent as a sub-field of Type only, a custom colour as a round circle, a new bright palette keeping their yellow, red, royal blue, green and purple, colours grouped by theme, elbow connectors after a first try ("no thats not what i meant"), expand all, a sort, a + on each row. The author answered a tree review (Voyage stays, employers become earnings, Spectacles merged into Évènements, plural names) and the assistant applied it to the dev database after a snapshot.

**What Could We Do Better:**
- Spec 12 was built without reading process.md or the accounts code, and spec 11's body still showed the old design, so every later spec copied it.
- Three entries were added here for one session.

**Friction Points:**
- A migration committed meanwhile had the same timestamp. Check `migration list` before naming one.

**Key Takeaways:**
- A correction is done when the spec body says it. Read the shared patterns and the latest built screen before a spec.

### 2026-11-03 - Account names unique per institution

**What We Worked On:**
- The author asked that two institutions may hold accounts with the same name. Open account names are unique per institution (accounts with no institution share one namespace), with `nulls not distinct`.

**Key Takeaways:**
- `nulls not distinct` (Postgres 15+) stops a nullable column from letting duplicates through a unique key.

### 2026-11-03 - Codebase review: shared pages, forms and actions

**What We Worked On:**
- The author asked for a review of `src/app` (reusable components, one way of doing similar layouts, no help text, good DX and UX) and then to apply all of it: `SettingsPage`, `ListCard`, `SheetForm`, `useServerAction`, `Result`/`failed()`, generated database types (ADR-023). Fixed "today" being the UTC date (bugs.md). Helper text cut.

**What Could We Do Better:**
- The first pass centred archived rows and moved header icons against spec 11 and earlier decisions. Read the spec's layout notes before unifying two layouts.

**Key Takeaways:**
- When two similar layouts differ, check whether the difference was decided before merging them.

### 2026-11-03 - Currencies and accounts (specs 10 and 11), a dev database, shared form pieces

**What We Worked On:**
- The author asked to start spec 10 (currencies, exchange rates, the rates job) then spec 11 (accounts). The author asked why the app could not be tried in dev without pushing. The assistant first proposed a backup-gated push; the author said "We do not push on main something untested" and that with no data, backups are not needed yet. Result: ADR-022, the project is the dev database, `npm run db:push`.
- A long review by the author shaped the shared form layer: actions on the row, one line per currency, a sheet over Comptes with one "Enregistrer", institutions managed on Comptes, a plum focus outline (the ring had been 12 hue degrees from the error red), 4px fields, a red shared delete confirmation, linked sub-fields, no helper text, "Archiver". Plum became the primary.

**What Went Well:**
- Measuring settled two questions: the focus ring's hue distance, and the slowness being serial round trips.

**What Could We Do Better:**
- The assistant treated an empty dev database as production, twice.
- The combobox shipped without being opened once.
- This session was first logged as nine entries.

**Key Takeaways:**
- A feature is done when it runs in local dev, before `main`. Match safeguards to the data that exists today.
- Reuse first; cut text before adding it. A visual rule belongs in one component or token.

### 2026-11-03 - App name hidden when the header is narrow

**What We Worked On:**
- The author asked that the app name disappear, leaving the logo, when it would wrap. The logo shrinks first and the switchers do not.

**Key Takeaways:**
- Let the least important element of a row give way first.

### 2026-11-03 - Page change loader

**What We Worked On:**
- The author asked for a loader on page change: a thin sunset bar while the router is pending, after 150 ms so preloaded routes never flash it. No dependency.

### 2026-11-03 - Currency symbol after the name

**What We Worked On:**
- The author asked for the symbol in parentheses after the currency name. The assistant also changed the add list unasked; the author asked to put it back.

**Key Takeaways:**
- Change only the screen the author named.

### 2026-11-02 - Locale contract, one account, the sunset look, phase 1 screen specs

**What We Worked On:**
- The author said the backup was done, both authenticators enrolled, and that a demo account would only matter if another user joined: DEM-01 and DEM-02 moved to later and unfinished work is tried in the owner's account (ADR-021). Phase 0 closed. The `profiles.locale` contract migration landed.
- The author shared two Pinterest pins for the look: grainy sunset gradients, sparkles, flat surfaces with no shadows, Inconsolata as accent. An icon on every signed-out card title.
- The next morning the author asked to start the phase 1 screen specs: a map and nine specs, each drafted with open questions and rewritten with the author's answers. Requirements updated (CUR-04, ACC-01, CAT-03, CAT-07, SET-01, MER-05, TRX-12, IMP-06); the `multi_currency` account type dropped.

**What Could We Do Better:**
- The roadmap listed the contract migration in two phases; the assistant said the demo account "stays" without checking it existed.
- This session was first logged as two entries.

**Friction Points:**
- `npm` is not on the PATH Claude's shell gets. Headless Chrome hangs with `--virtual-time-budget`.

**Key Takeaways:**
- Removing the shadow scale from the Tailwind theme enforces "no shadow" for components added later.
- The author prefers one familiar form over a second way in (bulk entry lost to "Enregistrer et ajouter").

### 2026-11-02 - Audit, cleanup, quality checks

**What We Worked On:**
- The author asked for an audit and to fix all of it, then a docs and comments cleanup in a plain voice, the shadcn focus ring, and quality checks that always run.
- Fixes: the private-data hook covers Bash, Grep and Glob; CI `migrate` fails instead of skipping when no backup ran; actions pinned to SHAs; least-privilege grants; the server refuses cross-site writes and sets `no-store`. Added `npm run verify` locally and in CI, size limits, an em dash check, and a hook that formats and lints edited files.

**What Could We Do Better:**
- The cleanup rewrote the skill's journal files; the author stopped it and they were restored.

**Key Takeaways:**
- A job that `needs` a skipped job is skipped too, and the run stays green.

### 2026-11-02 - Two languages, coolicons, validation, a softer look

**What We Worked On:**
- The author asked for FR and EN only (ADR-019), coolicons for every icon with emoji gone (ADR-020), form validation (SET-07), a softer piggy-bank look, Nunito self-hosted, and TravelSpend as the mobile layout reference. A temporary unguarded route let the shell be checked with screenshots, then was removed.
- Sign-in was refused everywhere because `config.toml` switched the email provider off (bugs.md).

**What Could We Do Better:**
- The Google Fonts import in the scaffold was blocked by the CSP for a week unnoticed. Look at the deployed page, not only its headers.
- The first design pass guessed at intent (icons in fields, dropping the sign-in title); the author corrected both.

**Key Takeaways:**
- Keep anti-enumeration messages narrow; log the rest.

### 2026-11-02 - First deploy

**What We Worked On:**
- A setup runbook (`setup.md`) and the first deploy to Netlify, verified from outside (CSP, headers, immutable assets, no Supabase code in client chunks). At the author's request the `db:*` scripts became plain `npx supabase --workdir ..` commands.

**What Could We Do Better:**
- The live page carried a script the local build did not (Netlify's toolbar). A production check must run against the real host.

**Friction Points:**
- Netlify's Vite plugin emulates Edge Functions with a Deno binary that rejects a flag; that emulation is off.

**Key Takeaways:**
- Hosts change responses. Verify headers and markup on the deployed URL.

### 2026-10-27 - Local session check

**What We Worked On:**
- ADR-018: the session check verifies the token locally with `getClaims()`, access tokens last 15 minutes.

**What Went Well:**
- Reading the library's own doc comments showed the fallback to a request with a legacy secret before relying on it.

**Key Takeaways:**
- Read the library's own doc comments for fallbacks; "verifies locally" had a condition.

### 2026-10-27 - One database

**What We Worked On:**
- ADR-017: one Supabase project for development and real use, migrations only from CI after an encrypted backup, additive migrations, Netlify previews off. Backup plan written into security.md.

**What Could We Do Better:**
- Two environments were planned by default. For one user whose goal is replacing a spreadsheet, a simpler setup with stronger migration rules fits better.

**Key Takeaways:**
- Size the environments to the users, then make the risky path (migrations) strict.

### 2026-10-27 - Phase 0, part 4: password reset, free plans

**What We Worked On:**
- Forgot-password flow (same answer for every address, MFA challenge before the new password). ADR-016: free plans; the nightly dump is the only backup and gates the first real import. ADR-006 re-examined at the author's request.

**What Could We Do Better:**
- The invite email claimed a 24-hour link while `otp_expiry` is one hour.

**Key Takeaways:**
- Check plan limits (regions, backups, email) before committing to an architecture that depends on them.

### 2026-10-27 - Phase 0, part 3: invitations

**What We Worked On:**
- The set-password page, pulled forward at the author's request: without it, invite-only sign-up could not be used. `/auth/confirm` and `/set-password`, bilingual invite templates.

**What Could We Do Better:**
- Deferring the page was a planning mistake: an invite-only app with no way to accept an invite is closed.

**Key Takeaways:**
- A flow is only done when every step from the email to the first screen exists.

### 2026-10-27 - Phase 0, part 2: the app

**What We Worked On:**
- TanStack Start scaffold, auth entirely in server functions with `httpOnly` cookies and `aal2` guards, react-i18next, `Intl` helpers, a per-request CSP nonce (ADR-015).

**What Could We Do Better:**
- `shadcn add` silently installed a 0.x `cn` package and rewrote imports; caught in the diff, now blocked by a lint rule.
- The first server entry rebuilt the `Request` and returned 500s; found by running the production build.

**Key Takeaways:**
- Read every generated diff, including what a CLI installs. Run the production build; the dev server hides CSP and server-entry problems.

### 2026-10-27 - Phase 0, part 1: database pattern and CI

**What We Worked On:**
- First migration (`profiles` with RLS in the same migration, owner-only policies, a restrictive `aal2` policy, sign-up trigger), pgTAP guard tests over every table, CI docs and database jobs, nightly backup workflow. ADR-014 after finding no Docker on the machine.

**What Could We Do Better:**
- The machine was not checked before planning; Node and Docker were both missing.

**Key Takeaways:**
- Check the toolchain before the first phase, not during it.

### 2026-10-27 - Project setup from the Lifebook template

**What We Worked On:**
- Created the repository from Lifebook's layout, kept the four sets of French notes verbatim, and merged them into one requirements list with IDs, sources and phases. Read the two reference spreadsheets for shape only.
- Wrote the security model and answered whether Supabase fits. First ADRs set the stack (Supabase, TanStack Start, shadcn/ui, money as numeric, composite FKs, no browser-to-database queries).
- The author's rule that recommendations must be mainstream and production-grade drove the dependency policy (ADR-011) and the i18n choice (react-i18next, ADR-008). The author scoped v1 to one fixed CSV format with an undoable batch import (ADR-010) and moved the wizard to improvements. A whole-plan review fixed multi-row writes as SQL functions (ADR-012), transaction amounts in the account's currency, and cross-currency transfers.
- Portfolio pass: process.md, definition of done in CLAUDE.md, a stop hook.

**What Went Well:**
- The spreadsheets surfaced requirements the notes never stated: pending status, special transfer/adjustment categories, reimbursements recorded as inflows, employer match in contributions.

**What Could We Do Better:**
- Several notes conflicted (base vs display currency, transfers as linked pairs). Resolved provisionally.

**Key Takeaways:**
- Real figures and the people in memos stay out of Git. Docs describe shape only.

---

## Format

### YYYY-MM-DD - Session Title

**What We Worked On:**
- What the author asked, what was decided and why, what was built

**What Went Well:**
- Approaches that worked

**What Could We Do Better:**
- Misunderstandings, process slips

**Friction Points:**
- Blockers, tool limits

**Key Takeaways:**
- Lessons for future sessions
