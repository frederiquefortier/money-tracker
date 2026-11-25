# Architectural Decision Records

Technical and structural choices, with the alternatives that were rejected. Check this file before proposing a change that might conflict. Screen and interaction choices live in [design-decisions.md](../00_briefing/designs/design-decisions.md). Superseded ADRs stay as one line so the numbers keep their meaning.

<!-- Newest first: a new ADR goes directly below this line. Template at the bottom. -->

### ADR-078: Privacy mode and the folded net worth groups are httpOnly cookies (2026-11-25)

Merges ADR-071 and ADR-074.

**Context:**
- Privacy mode (SET-08) and the hub's folded groups (ACC-07) must render right on a full load; browser storage applies only after hydration.

**Decision:**
- Each is an httpOnly cookie (`figures-hidden`, `net-worth-collapsed`) the server reads with the page's data and a server function writes. Folded keys are checked on both sides.
- Privacy mode masks amounts as "##,## $" and percents as "## %" inside `Money`, `Percent` and `useMoneyText`, so the digits never reach the page. Forms being filled, memos and names stay shown.
- Sorts, tabs and open branches stay in browser storage.

**Alternatives Considered:**
- Browser storage -> Figures flash and groups jump on every load. A cookie written by the browser -> Not httpOnly (security.md).
- A CSS blur or bullets per digit -> The number, or its length and sign, stays in the page.

**Consequences:**
- Every new way of showing an amount goes through `Money`, `Percent` or `useMoneyText`.

---

### ADR-077: One hosted Supabase project on free plans, tested in CI (2026-11-25)

Merges ADR-014, ADR-016, ADR-017 and ADR-022. The one account is ADR-021.

**Context:**
- The development Mac cannot run current Docker, so there is no local stack. One user, free plans.

**Decision:**
- One project, `money-tracker`, for development and real use, on free Supabase and Netlify. CI runs `db lint` and pgTAP on a fresh database; deploy previews are off.
- CI on `main` migrates after a backup. Until the first real import, `npm run db:push` also migrates from the laptop, with no backup; revisit before that import. Migrations are additive, since the app and the database deploy apart.
- The nightly encrypted dump is the only backup; it and one tested restore gate the first real import. Upgrade near 500 MB, or when pauses or Ohio latency hurt.

**Alternatives Considered:**
- Separate dev and production projects -> A second schema to keep in step, and the free slot kept for the demo (DEM-01), which must never share real data.
- Supabase Pro now -> A cost not needed yet.

**Consequences:**
- A bad migration reaches real data; pgTAP, the additive rule and the backup are the defences.

---

### ADR-076: Shared hooks in `hooks/`, features in `form/` and `list/`, history out of comments (2026-11-25)

**Context:**
- A review found 33 hooks outside `hooks/`, against ADR-026. Three were used by other files, the rest only by the file that holds them.
- `merchants`, `institutions` and `currencies` kept flat folders while the other features split into `form/` and `list/`.
- 88 comments carried "(author, date)" tags, which repeat the journal and age fast.

**Decision:**
- Supersedes ADR-026's "every hook in `hooks/`": a hook that a second file uses lives in `hooks/`; one used by its own file only may stay there, unexported.
- A feature's components: its form in `form/`, its list rows, actions and skeleton in `list/`, and what other features use (a picker, a badge) at the feature's root.
- Code comments say what holds and why, never who asked or when; that stays in sessions.md and git.
- `tsconfig` targets the ES2024 library, so rows are grouped with `Map.groupBy` instead of a loop per file.

**Alternatives Considered:**
- Move every hook to `hooks/` -> One-file hooks become files of their own with nothing to share.

**Consequences:**
- `Map.groupBy` needs Safari 17.4 or later.

---

### ADR-075: Each list page and list end loads in its own shape (2026-11-25)

Removed 2026-11-25 (a screen choice): loading states are in [design-decisions.md](../00_briefing/designs/design-decisions.md).

### ADR-074: The net worth hub's folded groups are saved in a cookie (2026-11-25)

Merged into ADR-078.

### ADR-073: TanStack Query caches the reads made outside loaders (2026-11-25)

**Context:**
- Nine reads (the heat map, the filter options, a rate, the matched event, the adjustment's balance, owed lines, the export counts) were fetched from components, each a `useEffect` with its own guard and no cache, so the heat map showed its skeleton on every visit. The author asked to adopt TanStack Query for all nine.

**Decision:**
- Supersedes ADR-011's line on data loading and cache for these reads. Pages keep their router loaders.
- A `QueryClient` per router, with the loaders' 30 s stale time and no retry; each read a `useQuery` keyed by what it asks.
- `useRefresh`, called by every save, marks every query stale; `useSessionReload` empties the cache on sign-in and sign-out.

**Alternatives Considered:**
- A key carrying the transaction count -> A request for the count on each visit, and an edit keeps the count.
- A hand-made cache -> The same work again for eight reads.
- Query for the loaders too -> Two ways to load a page.

**Consequences:**
- A new read outside a loader is a `useQuery`, never a `useEffect`.

### ADR-072: Pages, charts and transactions load as skeletons (2026-11-25)

Removed 2026-11-25 (a screen choice): loading states are in [design-decisions.md](../00_briefing/designs/design-decisions.md).

### ADR-071: Privacy mode hides figures in a fixed shape, saved in a cookie (2026-11-25)

Merged into ADR-078.

### ADR-070: The default excluded categories open from a settings icon (2026-11-25)

Moved 2026-11-25 to [design-decisions.md](../00_briefing/designs/design-decisions.md) (Events): a screen choice.

### ADR-069: Frankfurter v2 for every currency it has (2026-11-25)

Supersedes ADR-009 for the rates; HexaRate still validates an added currency.

**Context:**
- Under ADR-009 a currency the ECB does not publish (CLP, GTQ) had HexaRate's rate from the day it was added and none before, so an older amount in it would stay without a rate. Frankfurter's v2 API now gathers rates from many central banks: 161 fiat currencies, CLP and GTQ daily from 1999.

**Decision:**
- The rates job asks Frankfurter v2 (`/v2/rates?base=EUR&from&to&quotes`) for the currencies someone uses and those already kept (the ECB's list), each resuming from its own last stored day, a year per call. A currency added later gets its history back to 2018 on the next run. Rows keep the `frankfurter` source; no migration.
- `/v2/currencies` says which codes Frankfurter has, since an unknown one fails the whole query (422). HexaRate's daily rate stays only for a used currency Frankfurter lacks.

**Alternatives Considered:**
- Every currency Frankfurter has, used or not -> About 500,000 rows since 2018 for currencies nobody holds.
- A paid provider -> Still a key, a bill and a third party seeing our currencies (ADR-009).

**Consequences:**
- Rates outside the ECB's list come from other central banks, not all of them the same kind of rate; over a trip the gap is a fraction of a percent.
- A newly added currency has no rate until the next daily run, as before.

### ADR-068: A skeleton for text, a spinner for the rest (2026-11-25)

Removed 2026-11-25 (a screen choice): loading states are in [design-decisions.md](../00_briefing/designs/design-decisions.md).

### ADR-067: The export is one SQL function, zipped by the server (2026-11-24)

**Context:**
- IMP-04 and the cold backup need the user's data in the import format, and export then import must give it back. The format has nine files (ADR-050).

**Decision:**
- `export_data()` (security invoker) returns one jsonb with every file's rows as text: one value, so the 1,000-row limit does not apply. `export_counts()` gives each file's row count for the Exporter tab.
- The server function writes the ticked CSVs (`toCsv`, the mirror of `parseCsv`) and zips them with Node's `zlib` and a small zip writer, returned as base64. No dependency.
- A transaction's ref is its import ref or its id; a holding's key is its name or type and institution, numbered on a clash.
- A pgTAP test imports, exports, imports into an empty account and compares the two exports.

**Alternatives Considered:**
- Queries per table -> Paging past 1,000 rows, joins rebuilt in TypeScript.
- One download per file -> The author asked for one zip.
- JSZip or fflate -> A dependency for what zlib does.
- A route streaming the zip -> Leaves the server functions (ADR-006) for a small file.

**Consequences:**
- What the format cannot hold is lost on a round trip (import.md).
- Built in memory, no zip64: fine at this size.

---

### ADR-066: The year in review loads a year's transactions at my share, per year (2026-11-23)

**Context:**
- The Événements redesign shows each day's transactions with their merchant and people, and ranks the costliest days and the people I spent with (YR-03, YR-04). `my_lines` has the amounts at my share but no merchant or people; ADR-063 rejected sending every line of the history on each load.

**Decision:**
- `getYearActivity(year)` reads that year's `my_lines` and, from the transactions table, each transaction's merchant and everyone on it, whatever their role, the seller included (author, 2026-11-23). It returns the days (the heat map's, as before) and one row per transaction at my share. No migration: both reads go through RLS with the user's session.
- It replaces `getDailySpending`; Argent and Événements share one request per year. A past year loads once per visit, the current one on each mount.
- On a year, one year loads. On Tout, every year loads in parallel with the tab, since the highlights rank over the whole period; the calendar's months are still built as they near the screen.
- The highlights are computed in the browser and wait for every year: no ranking on part of the period.

**Alternatives Considered:**
- SQL aggregates per person and per day for the highlights -> Two more functions with pgTAP tests, and the calendar still needs the transactions per day.
- Loading a year only when its months near the screen -> The highlights on Tout would rank on the years seen so far.

**Consequences:**
- Tout on Événements reads every line of the history, one year per request. Fine for one owner's eight years; a larger history would want the aggregates above.

### ADR-065: One loader per situation; a write's refresh shows the page bar (2026-11-23)

**Context:**
- Switching the display currency showed nothing while every amount reloaded. A spinner in the currency chip was tried first: it was a new kind of loader, and it went away before the amounts changed, since `router.invalidate()` reloads a page that has data in the background and ends at once.

**Decision:**
- Four loaders, one per situation: a page loading for the first time shows the spinner in its body (`listPagePending`, ADR-054); a page changing or loading its data again shows the bar at the top (`RouteProgress`); a button that saves shows a spinner inside it; a list growing on scroll shows a spinner at its end.
- Every write refreshes through `useRefresh` (`hooks/app/use-refresh.ts`): `invalidate({ sync: true })`, so the router stays pending and the page bar shows until the new data is on screen. The page stays as it was meanwhile.
- Sign-in, sign-out and the error retry keep a plain `invalidate()`: they navigate right after, which shows the bar.

**Alternatives Considered:**
- A spinner in the control that started the write -> One more kind of loader, and each control would need the same fix.
- `defaultStaleReloadMode: 'blocking'` on the router -> A cached page would wait for its reload on every visit (ADR-054).

**Consequences:**
- A dialog's busy state, and a sheet's `onClosed`, last until the new data shows.

### ADR-064: A merchant's bills per month, summed from my lines (2026-11-20)

**Context:**
- MER-04 shows what a merchant's bill costs and how it changed. The dashboard reads monthly sums at my share (ADR-063), which have no merchant.

**Decision:**
- `merchant_monthly()` sums each expense's `my_lines` back into one bill, then per merchant and month: transactions, total, smallest and largest bill, NULL with a missing rate. At my share, as every dashboard figure; the author first chose the full bill, then my part the same day.
- The row gives the category table's totals and the number of transactions. The slip gives the average per bill, so going more often does not read as a price rise; on a year, it compares it with the same months a year earlier.
- Loaded with the dashboard's months in the same round trip; the browser cuts the period and sorts.

**Alternatives Considered:**
- The full bill -> A shared dinner would read differently here and in the categories.
- One row per transaction -> Every bill over eight years on each load, for sums, a minimum and a maximum per month.

**Consequences:**
- The merchants card and the categories agree on what a shared meal cost me.

### ADR-063: My share is computed once in SQL, per line; the dashboard aggregates in the browser (2026-11-18)

**Context:**
- The dashboard needs totals, means, medians, the change versus the previous period and event totals, all at my share (Q5) and without counting a repayment on top of the share it repays.

**Decision:**
- `my_lines(from, to)` returns one row per split of an expense or income at my share in the display currency: an expense less its known owed parts, an income less what it repaid (the excess stays in its category). NULL with a missing rate. `event_totals()` sums the same lines per event.
- `my_monthly()` sums those lines per month and category over the whole history. The dashboard loads it once and cuts the year or everything in the browser with BigInt (2026-11-19, when the author asked for the sheet's charts and table: they all read monthly sums, and switching the period then loads nothing).

**Alternatives Considered:**
- One SQL aggregate per figure -> A round trip per filter change.
- Every line to the browser -> Eight years of splits on each load, for figures that only need monthly sums.
- Gross amounts -> A shared bill and its repayment would both count.

**Consequences:**
- The money rules for reports live in one function with its pgTAP test. Conversion costs computed from rates are not in the lines yet.

### ADR-062: An investment's row shows its return over the range, deposits left out (2026-11-18)

Moved 2026-11-25 to [domain-rules.md](domain-rules.md) (Net worth and holdings).

### ADR-061: One net worth page, the subpages merged into it (2026-11-17)

**Context:**
- ADR-046 kept the accounts and the holdings on two subpages because their rows, actions and grouping differed. Since ADR-060 the hub listed every item, and each row opened its form, so the subpages were a second list of the same things.
- The author confirmed the monthly routine of updating values bank by bank, which the subpages' institution drawers served.

**Decision:**
- `/net-worth` holds the net worth, the charts and one list of every account and holding, with their row actions, the archived section, the sort and the + (account, holding, adjustment).
- The list groups by type (default) or by institution, a choice beside the sort, remembered per browser. Group totals leave the hidden items out in both.
- The forms stay route sheets at their URLs, now over the hub; `/net-worth/accounts` and `/net-worth/holdings` redirect to it. Their loaders' data comes from the hub's, which calls `getNetWorth`, `getAccounts` and `getHoldings` in parallel.
- Rows show the value in the item's own currency, as the subpages did; totals are in the display currency.

**Alternatives Considered:**
- Keeping the subpages beside the hub list -> Two lists and two row patterns for the same items.
- Grouping by type only, the institution on the row -> The author updates values bank by bank.
- One server function for the three loads -> They run in parallel; ADR-053 kept such calls apart until measured.

**Consequences:**
- Supersedes ADR-046 where the accounts and holdings are separate subpages, and ADR-060's link cards, which are gone. The rest of both stands.
- `institution_totals` is no longer read; group totals are summed in the browser from each item's display value.

### ADR-060: The hub's subpage cards carry no total (2026-11-17)

Removed 2026-11-25: a screen choice, replaced by ADR-061. The net worth page is in [design-decisions.md](../00_briefing/designs/design-decisions.md).

### ADR-059: No complete total under the hub's net worth (2026-11-17)

Removed 2026-11-25: a screen choice. The rule for hidden items is in [domain-rules.md](domain-rules.md).

### ADR-058: The hub's net worth leaves out the hidden items (2026-11-17)

Moved 2026-11-25 to [domain-rules.md](domain-rules.md) (Net worth and holdings).

### ADR-057: The net worth series is per item in SQL, summed in the browser (2026-11-16)

**Context:**
- The hub's chart (NW-04) needs the net worth at every month end since the first data, and NW-05 lets the browser leave out chosen accounts and holdings, remembered per browser.

**Decision:**
- One SQL function, `net_worth_series()`, returns a row per month end (and today) per open account and per holding with a value: its figure in the display currency at that date's rate, debts negative, NULL when a rate is missing. Holdings carry their last value forward.
- The hub loader fetches the whole history once. The browser leaves out items, cuts the range and sums with the existing bigint helper, so a missing rate empties that point, never a partial sum.

**Alternatives Considered:**
- Totals summed in SQL, with the left-out ids as an argument -> A round trip for each tick in the filter.
- Every point at today's rate -> The past would move whenever rates move; transactions already use their own date (CUR-07).

**Consequences:**
- A few thousand rows for eight years; fine at one user, revisit if it grows.
- Recharts gets numbers only to draw; every figure shown is the string amount.

### ADR-056: An event's excluded categories may be its own empty list (2026-11-14)

Moved 2026-11-25 to [domain-rules.md](domain-rules.md) (Events), with ADR-055.

### ADR-055: The link by date skips categories again, with a default list (2026-11-13)

Moved 2026-11-25 to [domain-rules.md](domain-rules.md) (Events), with ADR-056.

### ADR-054: Pages change at the click, lists build what is on screen (2026-11-13)

**Context:**
- A page change waited for the new page's data. Each Supabase request costs about 200 ms whatever the query, and two lists were slow to render (674 merchants, 150 transactions).

**Decision:**
- List pages show their title at once and load their content in place (`listPagePending`). `_authed` keys its `Outlet` per page, since a transition never shows the fallback of a boundary already on screen.
- `/transactions` has one match (no `loaderDeps`): filters and search reload in the background.
- List pages preload in the background once the app shows (`usePreloadPages`).
- Every list that grows with the user's data builds its rows as they near the screen (`Revealed`, `useRevealed`). Dialogs mount only when opened.
- Each language is its own chunk; `src/client.tsx` loads it before hydration.

**Alternatives Considered:**
- A router-wide pending component -> The root's session check would blank the app.
- Virtualizing lists -> A dependency, for what revealing on scroll already does.

**Consequences:**
- List pages show their content 10 to 90 ms after the click; about ten calls run in the background at start.
- Ctrl+F does not find rows not yet built; each page's search does.

### ADR-053: Fewer round trips per page (2026-11-13)

**Context:**
- Every page and save was slow: a session check before every page, one request per row to know what could be deleted, and `list_transactions` at about 470 ms a page.

**Decision:**
- The browser keeps an `aal2` session 5 minutes; pages stay fresh 30 s (`defaultStaleTime`).
- "In use" is one query per table (`used_category_ids`, `used_account_ids`, `holdings_with_history`).
- `list_transactions` is plpgsql planned per call (`force_custom_plan`): about 60 ms.
- A sheet opens at the tap with a loading sheet; rows preload their sheet after 100 ms.
- `useLocale` selects the locale, so a navigation no longer re-renders every amount.

**Alternatives Considered:**
- Merging the form's 8 calls -> Saves little, the calls run in parallel (author's choice: measure first).
- Moving Netlify out of Ohio -> A plan decision (ADR-016).

**Consequences:**
- A session revoked elsewhere keeps the screens up to 5 minutes, with no data (RLS).

### ADR-052: An invited person carries no amount of their own (2026-11-12)

Moved 2026-11-25 to [domain-rules.md](domain-rules.md) (Splits and people).

---

### ADR-051: "Avoirs" names the holdings in French (2026-11-12)

Removed 2026-11-25 (a label choice): in [design-decisions.md](../00_briefing/designs/design-decisions.md) (Accounts).

---

### ADR-050: Holdings join the import in the same batch (2026-11-12)

**Context:**
- The author wants eight years of net-worth history (values, employer contributions, a move between institutions) through the CSV import (IMP-02). Part of it is estimated.

**Decision:**
- `import_batch` takes four more optional arrays: `holdings`, `snapshots`, `contributions`, `holding_transfers`, checked and written by `import_holdings` inside the same transaction, summary and undo. Errors join the others, by file and line.
- A holding is matched by type, institution and name; the app's version is kept. Lines already in are skipped, so a file can be sent twice.
- `import_batch_id` on the four tables; the undo removes a holding only when nothing else points at it.
- An estimate is a normal line with a label that says so; no estimate flag.

**Alternatives Considered:**
- A second request for the holdings -> Two transactions, so half an import could stay (ADR-012).
- A `holding` column on transactions.csv now -> Links rows already imported; left for later.
- An estimate flag -> A column for one import.

**Consequences:**
- New holdings cannot be merged or edited in the summary.
- The export must write these files for the round trip to hold.

---

### ADR-049: Transfers between holdings are dated entries (2026-11-12)

**Context:**
- The author closes an account at one institution and moves the money to another holding, and asked for the transfer to have a date, "like a transaction", instead of moving the history.

**Decision:**
- `holding_transfers`: from, to, date, amount above zero, between two investments in one currency. RLS and a pgTAP test.
- Supersedes ADR-045 on "placed": subtracting withdrawals shrank the basis and inflated the percent. Placed is money in only and never goes down; `withdrawn` is money out; profit is latest value + withdrawn - placed, percent over placed. A transfer is withdrawn on the source and placed on the target.
- A holding with any history can only be archived; the currency lock and the closing date count transfers too.
- Values, external contributions and transfers each have their own sheet; the holding form carries no lists.

**Alternatives Considered:**
- Move the linked transactions and contributions to the target -> Rewrites history.
- Two currencies with two amounts -> More form, no use case yet.

**Consequences:**
- A transfer has no edit: delete and add again.

---

### ADR-048: Holdings by country and type, optional name, no exclusion flag (2026-11-12)

**Context:**
- After trying the first holdings screens the author asked for the country first with the type following from it, a text box when no type is predefined, an optional name, the "leave out of net worth" choice on the chart instead of the holding, and no holdings filter in the transactions list.

**Decision:**
- `holdings` gets a required `country`. A type is predefined (`type`) or typed (`type_label`), exactly one; `kind` comes from the type, or is chosen for a typed one.
- `name` is optional. An unnamed holding reads "type en currency (institution)". Names stay unique among open named holdings, ignoring case and accents.
- `exclude_from_net_worth` is dropped: leaving items out is a chart filter kept per browser (NW-05).
- The holdings filter of `list_transactions` is dropped; the "n transactions sans placement" count links to the list on the investment categories.
- Supersedes ADR-045 on the exclusion flag, the required name, the type list, and the list filter. The rest stands.

**Alternatives Considered:**
- Keep the flag and add the chart filter -> Two ways to leave something out, and a total that silently differs.
- A free-text type always -> No kind, no profit logic, no translations.
- Keep the holdings filter -> The author's call: the category filter is enough.

**Consequences:**
- A typed type is never translated (user-typed content).
- The count's link lists linked investment transactions too; the ones without a holding tag are the ones to link.

---

### ADR-047: Institutions are managed in Réglages (2026-11-12)

Removed 2026-11-25 (a screen choice): in [design-decisions.md](../00_briefing/designs/design-decisions.md) (Accounts).

---

### ADR-046: One Net worth tab with the accounts and the holdings as subpages (2026-11-12)

Removed 2026-11-25: replaced by ADR-061. The net worth page is in [design-decisions.md](../00_briefing/designs/design-decisions.md).

---

### ADR-045: Holdings, their values, and an optional holding on an investment transaction (2026-11-11)

**Context:**
- NW-01 to NW-03 need investments, assets and debts with dated values, and the money put into each. That money already exists as transactions on investment-kind categories. Bank accounts count through their balance, not as holdings.

**Decision:**
- Tables: `holding_types` (reference), `holdings`, `holding_snapshots` (one value per date, in the holding's currency) and `holding_contributions` (employer or government money). Composite keys (ADR-005), RLS and a pgTAP test each.
- `transactions.holding_id` is optional, allowed only on an expense or an income on investment-kind categories, so my own contributions are never entered twice.
- `holding_totals` returns placed, latest value, profit and percent, each flow converted at its own date, null with a missing rate (ADR-004).
- Snapshots and the exclusion flag come now instead of phase 5; the chart (NW-04) stays in phase 5. Debts have values only.
- The import format does not change; past contributions are linked by hand, helped by a count of investment transactions without a holding.

**Alternatives Considered:**
- A transfer to the holding, as to an account -> Holdings would need balances, and accounts and holdings blur.
- One investment category per holding -> Renaming or merging a category silently breaks the totals.
- A current value field now, snapshots later -> A migration to unwind, and no history.
- A `holding` column in the import now -> Format work for a history already in.

**Consequences:**
- Export then import loses the link (revisit with IMP-04).
- A missing rate empties the profit instead of showing a wrong one.
- A holding with transactions can only be archived.

---

### ADR-044: End-to-end tests with Playwright, on a local stack, in CI (2026-11-11)

**Context:**
- Unit tests cover the logic and pgTAP the database; nothing ran a request from the browser through a server function, nor the sign-in with MFA. The laptop cannot run the local stack (ADR-014), and the hosted project holds the owner's account (ADR-021).

**Decision:**
- `@playwright/test` in `src/app/e2e/`, run by a CI job on the local stack the pgTAP job starts. Non-blocking at first (`continue-on-error`).
- A setup project creates a test user through the Auth admin API, signs in, enrols TOTP from the screen's secret (computed with `node:crypto`) and keeps the session.
- Specs: sign-in cases and a refused cross-site write, the import of the example files, a new expense, in order on one worker.
- `e2e/env.ts` refuses any URL that is not `localhost` or `127.0.0.1`.

**Alternatives Considered:**
- The hosted project -> Test entries among real data.
- Seeding the factor in SQL -> Skips the enrolment screen.
- otplib -> Fifteen lines of `node:crypto` (ADR-011).

**Consequences:**
- To gate merges, remove `continue-on-error` and add the job to `migrate`'s `needs`.
- To run locally, someone with Docker sets the `E2E_*` variables from `supabase status` and runs `npm run e2e`.

---

### ADR-043: A dev-only design gallery instead of Storybook (2026-11-11)

**Context:**
- The author asked whether to build Storybook for a more consistent design system. Shared components already live in role folders (ADR-026), and the inconsistency comes from new screens not reusing them.

**Decision:**
- `/design`, a route under `_authed` that throws `notFound()` unless `import.meta.env.DEV`. It renders the shared components in their states, with the app's real providers (i18n, router, toaster), and a Dark toggle that puts the `dark` class on the preview.
- Its code is in `components/design/`, one file per role. It is in English only, outside the i18n lint rule, because it is a developer tool. A new shared component gets a specimen there in the same change.

**Alternatives Considered:**
- Storybook -> A second build and a new dependency (ADR-011), and every story needs decorators for i18n, the router and Tailwind that drift from the app. Revisit with a second developer or visual regression tests.
- A components inventory in the docs only -> Goes stale; the gallery cannot.

**Consequences:**
- The route ships in the bundle but answers 404 outside dev. Popovers and dialogs open in the light theme even with Dark on, since they render at the page root.
- Review of the gallery's components (2026-11-11) led to shared pieces: `IconBubble` with tones and sizes, `CurrencyCode`, `pageColumn` and `errorTint` in `styles.ts`, and `formatRate`, `percentFormat` and `formatInstant` in `lib/shared/format.ts`.
- Not shown: the add button, sheets and the date range calendar, which need the route or the layout around them.

---

### ADR-042: An event can opt out of the automatic link by date (2026-11-11)

Moved 2026-11-25 to [domain-rules.md](domain-rules.md) (Events).

---

### ADR-041: The transaction form's data is one layout route (2026-11-11)

**Context:**
- Each transaction sheet loaded the data of all the form's pickers (about 15 queries), a hovered row preloaded it again, and closing a sheet ran `router.invalidate()`, which reloaded every active route including the sheets' own loaders. The app felt slow and a sheet sometimes did not open.

**Decision:**
- A pathless layout route, `/_authed/transactions/_form`, runs `loadTransactionForm()` once for the three sheets (`staleTime` one minute), read with `useTransactionFormData()`. Sheets keep only their own data.
- Layout and sheets carry `staticData.sheet`; `RouteSheet` invalidates on close with `filter: match => match.staticData.sheet !== true`. Rows no longer preload on hover.

**Alternatives Considered:**
- A browser memo -> Cleared by hand on every write.
- Loading the form data in the list route -> Slows the list for sheets not opened.

**Consequences:**
- Usage ranks (merchants, frequent people) can be up to a minute old after a save; a merchant, person or category created inline invalidates at once.

---

### ADR-040: "With me" is a role and "bought from" is a field on the transaction (2026-11-11)

**Context:**
- After the first import, the author found that making a merchant "be" a person (ADR-038) made no sense. A person on a transaction is one of: with me (no money effect), paid for by me (invited, owes), or sold to me.

**Decision:**
- `transaction_people.role` gains `with` (PPL-08): `amount = 0`, a person, head count 1, expenses only. `save_transaction` sets these lines aside, computes the others' parts as before, then writes them last.
- `transactions.seller_person_id` (PPL-09): composite FK, set null on person delete, expenses only. `save_transaction` takes `seller_id`.
- `merchants.person_id` is dropped; the migration moves those expenses to the seller field and deletes merchants left unused. `merge_people` moves sellers.
- Import: on an expense, a merchant text equal to a person's name or alias sets the seller and creates no merchant. `people.csv` accepts `with`.

**Alternatives Considered:**
- Keep the merchant link and reword it -> Still two steps for one fact about a purchase.
- A separate table for people "with me" -> A second place to filter, list, import and merge.
- Seller on incomes -> An income already names its source (`from`).

**Consequences:**
- Supersedes ADR-038. ADR-037's alias and merge rules stand.

---

### ADR-039: Merging people is one SQL function that refuses a shared transaction (2026-11-11)

**Context:**
- The first import created a duplicate person (an alias of another). Merchants could be merged (MER-05); existing people could not.

**Decision:**
- `merge_people(source, target)` (`security invoker`, PPL-07) re-points lines, group memberships and event links to the target, keeps the source's name and aliases as aliases of the target, and deletes the source.
- It raises `people_merge_shared_transaction` when both people are on one transaction: two lines for one person would each carry a part, and choosing is the author's call.
- `authenticated` gets `update (person_id)` on `transaction_people` for it.

**Alternatives Considered:**
- Delete and re-insert lines -> Line ids change and reimbursements name them.
- Summing the parts of a shared transaction -> Silently rewrites a split the author set.

**Consequences:**
- No undo, like a merchant merge.

---

### ADR-038: A merchant can be a person (2026-11-10)

Superseded by ADR-040 (the link moved from the merchant to a seller field on the transaction).

---

### ADR-037: Merges leave aliases, and new items can be edited before import (2026-11-10)

**Context:**
- An import merge only renamed rows, so a re-import showed the same spelling as new again, and a merchant merge deleted the source's name. The author also wanted to edit or drop a new item before it exists.

**Decision:**
- `merchant_aliases` (MER-02) with people's rules: a name or an alias points to one merchant. Merging a merchant or person keeps the old spelling as an alias, and the import matches by name or alias. An optional `aliases` file (kind, name, alias) carries the converter's spellings.
- Before creation, a new merchant, person or event can be renamed, partly moved to the note of its transactions, or dropped. Applied in the browser to the rows, so the database sees only names.
- IMP-03 is narrowed to reading other sources; the rest is IMP-06 and MER-02.

**Alternatives Considered:**
- A plain rename per import -> No trace; the same question every time.

**Consequences:**
- No screen lists merchant aliases yet (the merchant form edits them).

---

### ADR-036: import_batch is set-based, checks first (2026-11-10)

**Context:**
- The API role gives a statement 8 seconds (`statement_timeout`), and the first import is about 4,800 rows. `save_transaction` per row is far too slow but holds the rules for people parts and reimbursements.

**Decision:**
- `import_batch(payload jsonb, dry_run boolean)`, one `security invoker` function: parse rows into temporary tables, check everything (each error with file and line), write nothing unless there is none. `dry_run` returns the checks plus what would be created (the summary screen). Merge choices (IMP-06) are applied by renaming rows before the call.
- Plain expenses, incomes, transfers, fees and adjustments are written in bulk. Rows with people go through `save_transaction`, one call each, expenses before the incomes that repay them.
- Imported events are created by name only, and rows naming them are linked by hand.
- Amounts on an expense's people lines are an error: empty lines take the rest, an `owes` line is set by its reimbursement.
- `import_undo(batch)` deletes the batch's transactions, then what it created if unused, and restores the opening balance and date it changed.

**Alternatives Considered:**
- `save_transaction` per row -> Too slow. Chunked calls -> Not all or nothing. A staging table -> More tables and states for a file that fits in one call.

**Consequences:**
- `import_ref` and `import_batch_id` on `transactions`, and a batch id on everything the import can create.

---

### ADR-035: The import accepts an archived category up to its archive day (2026-11-10)

**Context:**
- Old categories were archived in the app, but their history has to import under them.

**Decision:**
- A transaction may use an archived category up to and including the archive day; later dates are refused in the check. Nothing is reactivated.
- The stored periods are `[active_from, active_to)` and leave the archive day out (CAT-04), so the import allows one more day than the pickers.

**Alternatives Considered:**
- Refuse archived categories -> Reactivate and re-archive by hand. Ignore the date -> A later transaction could land on a hidden category.

---

### ADR-034: The import sets the opening balance of an account with no transactions (2026-11-10)

**Context:**
- Accounts exist with an opening balance of 0, and the history's real starting balances have to land somewhere.

**Decision:**
- An account matched by name and institution with no transactions takes the file's `opening_balance` and `opened_on`; every other field, and every account with transactions, is left alone. Undo restores the old values.
- Rows from before the accounts were tracked go to a placeholder account whose opening balance makes it end at zero.

**Alternatives Considered:**
- Starting balances as adjustments -> An adjustment is a gap against a computed balance, not an opening balance.

---

### ADR-033: The import format, with people, events and everything created on demand (2026-11-10)

**Context:**
- The earlier import notes predated accounts, merchants, people and events. The author asked to start again.

**Decision:**
- Files: accounts.csv, transactions.csv, splits.csv, people.csv (optional). No events file. The category lives only in splits.csv. People are lines with the form's roles. Format in [import.md](import.md).
- Every named thing is matched ignoring case and accents and created when missing (currency, account, institution, category, merchant, person, event). The summary lists them, each kept or merged into an existing one (IMP-06).
- No time of day.

**Alternatives Considered:**
- A `people` cell (`Alex; Marie`) -> Cannot say who owes or who repaid. An events.csv -> Events are edited in the app afterwards. Refusing unknown currencies -> The author wants them added.

---

### ADR-032 to ADR-027: Calendar, period and filters

Moved to [design-decisions.md](../00_briefing/designs/design-decisions.md). The dependency they added (react-aria) is in ADR-011.

---

### ADR-026: The code is grouped by role and by feature (2026-11-08)

**Context:**
- `components/` had 45 loose files, `lib/` 58, hooks lived in five places, nine file names existed in both `lib/` and `server/`, and 35 files imported types from the server layer.

**Decision:**
- The layout and naming rules are in CLAUDE.md (Layout). In short: role folders in `components/`, every hook in `hooks/`, `lib/<feature>/` holds `<entity>.ts`, `<entity>-draft.ts` and `<entity>-list.ts`, `server/` holds server functions only, and an export is named for what it is, with no name exported by two files.
- `i18n/fr/` and `i18n/en/` hold the same files; English is typed against French.

**Alternatives Considered:**
- `lib/` by layer only -> A feature's files stay in one flat list.
- A barrel `index.ts` per folder -> Hides where code lives and slows the dev server.

**Consequences:**
- Journal entries before this date point to the old layout; they are left as written.

---

### ADR-025: Each repeated form, picker and server pattern lives in one place (2026-11-05)

**Context:**
- The same code existed three to six times (sheet-form submit, "Créer « … »" in pickers, server error mapping and insert-or-update) and the copies had drifted: four forms crashed on a network error.

**Decision:**
- `useSheetForm` runs every RouteSheet form (validate, save, toast, close, keep values on failure, focus the first error). `useInlineCreate` runs "Créer « … »".
- `lib/db.server.ts`: `loaded`, `saveRow`, `updateProfile`. `failureFor(scope, known)` in `lib/result.ts` maps SQLSTATEs to error ids. Money helpers live in `lib/money.ts`. `lib/` never imports from `components/`.

**Alternatives Considered:**
- React Hook Form or TanStack Form -> React 19 actions and Zod already do the work (ADR-011).
- A generic data layer over supabase-js -> Hides the queries.

---

### ADR-024: Dates stay native, after a calendar was tried (2026-11-05)

Superseded by ADR-028 (design-decisions.md). Kept for the reason it was tried and dropped: shadcn's Calendar (react-day-picker) cannot jump to a month or year directly, so a later picker must offer that.

---

### ADR-023: Generated database types, amounts kept as text (2026-11-03)

**Context:**
- Server functions read rows untyped and cast them, so a renamed column compiled and failed at runtime. `supabase gen types` types `numeric` as `number`, which invites a float into money code (ADR-004).

**Decision:**
- `npm run db:types` writes the committed `src/lib/database.gen.ts`. `src/lib/database.ts` wraps it and overrides written amount columns as strings. Reads cast amounts to text in the select (`balance::text`).

**Alternatives Considered:**
- Hand-written row types -> Drift without warning. type-fest `MergeDeep` -> A dependency for one override.

**Consequences:**
- A new numeric column the app writes needs a line in `database.ts`; forgetting `db:types` leaves types a migration behind.

---

### ADR-022: Until real data exists, the project is the dev database (2026-11-03)

Merged into ADR-077.

---

### ADR-021: One account; unfinished work is tried in it (2026-11-02)

**Context:**
- ADR-017 planned a demo account for trying features. It was never created and the demo work is deferred.

**Decision:**
- The owner's account is the only one. Unfinished screens are tried there. Isolation between users is proven by pgTAP only.

**Consequences:**
- Supersedes the demo account in ADR-017. Test entries land among real data: delete them or undo the import batch (IMP-05).

---

### ADR-020: coolicons for every icon, categories included; no emoji (2026-11-02)

**Context:**
- The logo is a coolicons icon and the author wants one icon set, categories included (CAT-07). The CSP allows no third-party requests and security.md forbids `dangerouslySetInnerHTML`.

**Decision:**
- `@iconify/react` through its **offline** build: no fetching, icons only from registered data. `src/app/src/icons/coolicons.json` holds only the icons used, generated by one Iconify API request (command in that folder's README). `IconName` is derived from the file, so an unknown name fails type-checking.
- Categories store a coolicons icon name. `lucide-react`, `emoji-picker-react` and the Noto Color Emoji font are dropped (supersedes ADR-013).

**Alternatives Considered:**
- `unplugin-icons` -> Needs `@svgr` packages too. `@iconify/json` -> 640 MB. SVG paths by hand -> Does not scale to a picker. Emoji for categories -> Two visual languages and a picker library.

**Consequences:**
- Adding an icon means re-running the request; forgetting it is a type error.

---

### ADR-019: French and English, without regional variants (2026-11-02)

**Context:**
- ADR-008 offered six locales so numbers followed each region. The author wants two languages.

**Decision:**
- `profiles.locale` is `fr` or `en`. Formatting still needs a region: `fr` formats as `fr-CA` and `en` as `en-CA` (`FORMAT_LOCALE` in `i18n/locales.ts`). Bare `fr`/`en` would pick France and the US: euro spacing and US dates for a Canadian-dollar ledger.
- The database change follows ADR-017's expand and contract: a migration accepts both new and old values and normalises rows; a later one drops the old.

**Consequences:**
- Supersedes the locale list in ADR-008. Swiss formatting is gone, by choice.

---

### ADR-018: The session check verifies the token locally (2026-10-27)

**Context:**
- Every navigation ran `getUser`, the MFA level and `listFactors`: two to three Auth requests per page.

**Decision:**
- `getSession` and `setLocale` use `getClaims()`, which verifies the access token against the project's cached public signing key. An `aal2` token proves a verified factor, so only an `aal1` session on the MFA pages asks Auth for factors. Password change and TOTP enrolment keep `getUser()`.
- Access tokens last 15 minutes (`jwt_expiry = 900`). The project must sign with an asymmetric key; with the legacy secret `getClaims()` silently falls back to a request.

**Alternatives Considered:**
- `getUser()` on every page -> Catches revocation at once, costs a round trip per navigation. An app-side cache -> Our own invalidation for something Supabase already signs.

**Consequences:**
- A session revoked elsewhere keeps passing the page check for up to 15 minutes. RLS trusts the same token, so data is guarded as before.

---

### ADR-017: One Supabase project for development and real use (2026-10-27)

Merged into ADR-077.

---

### ADR-016: Free plans until a real limit is hit (2026-10-27)

Merged into ADR-077.

---

### ADR-015: A per-request CSP nonce, set by the server entry (2026-10-27)

**Context:**
- TanStack Start renders inline hydration scripts. `script-src 'self'` blocks them and `'unsafe-inline'` defeats the CSP. `netlify.toml` headers cover static files only and cannot vary per request. The router accepts `ssr.nonce`.

**Decision:**
- `src/app/src/server.ts` generates 16 random bytes per request, passes them as request context, and sets the CSP on HTML responses: `script-src 'nonce-…' 'strict-dynamic'`, `connect-src 'self'`, `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'none'`. The router reads the nonce with `getGlobalStartContext()`.
- The same entry sets HSTS, nosniff, referrer and permissions policies; `netlify.toml` repeats them for static assets. The CSP is off in the Vite dev server.

**Alternatives Considered:**
- `'unsafe-inline'`, or hashes (the payload changes per page and user), or the nonce as a request header (rebuilding the runtime's `Request` fails on private fields).

**Consequences:**
- `style-src` keeps `'unsafe-inline'` for inline `style` attributes Radix sets. A third-party script needs an explicit CSP change, which is the point.

---

### ADR-014: Develop against a hosted project; database tests run in CI (2026-10-27)

Merged into ADR-077.

---

### ADR-013: Google-style emoji from a self-hosted font (2026-10-27)

Superseded by ADR-020 (icons instead of emoji).

---

### ADR-012: Writes that touch several rows are Postgres functions (2026-10-27)

**Context:**
- supabase-js sends one HTTP request per call, with no transaction across calls. A transfer, a transaction with its splits (a deferred sum check), an import and an undo must be atomic. Netlify functions time out after about 10 s and accept about 6 MB bodies.

**Decision:**
- Any write touching more than one row is a PL/pgSQL function called with `.rpc()` (`save_transaction`, `save_transfer`, `delete_transfer`, `import_batch`, `import_undo`, and so on).
- They are `security invoker` so RLS applies as for a direct query, with `search_path = ''`. The server function validates with Zod first (ADR-006); the SQL function re-checks the invariants it owns.
- The import sends all rows in one request to one `import_batch` call.

**Alternatives Considered:**
- A direct Postgres connection -> RLS applies only if every query sets role and JWT claims by hand. Several calls and a compensating delete -> Not atomic. A staging table -> Needed only past the body limit.

**Consequences:**
- Money rules live in SQL, versioned in migrations and tested with pgTAP. Single-row reads and writes stay plain supabase-js calls.

---

### ADR-011: The platform first, a dependency only when it earns its place (2026-10-27)

**Context:**
- The stack had a library per concern. Each is code to update, audit and trust with financial data. React 19, TanStack Start, Postgres and modern browsers cover much natively.

**Decision:**
- Reach for, in order: the browser or Node platform, React 19, TanStack Start, Postgres. Add a dependency only when the native version is a real chunk of code to own, then pick the mainstream, maintained option.

| Concern | Native answer | Instead of |
|---|---|---|
| Forms | `<form action>`, `useActionState`, `FormData` | react-hook-form |
| Optimistic updates | `useOptimistic` | TanStack Query mutations |
| Data loading and cache | Router loaders, `router.invalidate()` | TanStack Query |
| Display currency | Profile in router context plus a cookie | Zustand |
| Number, currency, date formatting | `Intl` | date-fns, numeral |
| Money arithmetic | Postgres `numeric`; TypeScript integer minor units with `BigInt` | decimal.js |
| Collapsible groups | `<details>` | an accordion |
| UI preferences | `localStorage` | a state library |
| CSV import | `File.text()` and a small RFC 4180 parser | Papa Parse, SheetJS |

Dependencies that stay:

| Dependency | Why |
|---|---|
| `@supabase/supabase-js`, `@supabase/ssr` | Auth sessions, MFA, database client |
| Zod | Server input validation and the shared schema |
| shadcn/ui (Radix) and Tailwind | Accessible combobox, dialog, popover, menu; added one component at a time |
| class-variance-authority, clsx, tailwind-merge, tw-animate-css | What shadcn components are written with (`cn` in `src/lib/utils.ts`) |
| TanStack devtools (dev only) | Router inspector, stripped from the build |
| @tanstack/react-query | The cache for reads a component makes itself, outside the loaders (ADR-073) |
| i18next, react-i18next | Plurals, interpolation, server-rendered language switch (ADR-008) |
| Recharts (via shadcn charts) | Line, bar, area, donut charts |
| react-aria-components, react-aria, @internationalized/date | The date field and its calendar: typed segments, range calendar, tooltips (design-decisions.md) |
| @playwright/test (dev only) | End-to-end tests in CI (ADR-044). Runs a real browser; no native equivalent |
| @iconify/react (offline) | coolicons from a vendored file (ADR-020) |
| @fontsource-variable/nunito, /inconsolata | Self-hosted fonts: no request to Google Fonts, no CSP change |

**Alternatives Considered:**
- The full set from the first prototype (TanStack Query, Zustand, react-hook-form, a decimal library) -> A lot of surface for this size.
- No UI kit, native `<dialog>` and Popover -> The searchable grouped combobox still needs custom keyboard and ARIA work.

**Consequences:**
- shadcn 4 imports `cn` from its own `cn` package. Not adopted: after each `shadcn add`, point the import back to `src/lib/utils.ts` and uninstall `cn` (a lint rule rejects the import).
- A new dependency needs a line in the tables above or its own ADR.

---

### ADR-010: A fixed CSV format for import, no user seed (2026-10-27)

**Context:**
- The real history already exists and the category tree is being redesigned, so each transaction needs re-categorising on the way in. The app is multi-user, so the import should work for the next user too, without a large import UI in v1.

**Decision:**
- No seed of user data. `src/data/reference/` keeps lookup data and import templates.
- v1 imports one fixed, documented CSV format ([import.md](import.md)); the user prepares data beforehand. The app validates, summarises what it will create, and commits all or nothing as one undoable batch. Files are parsed in the browser, never stored, and the server validates every row again. Converting a source (the Aspire sheet) happens outside the app.

**Alternatives Considered:**
- An import wizard with source profiles -> Right eventually, too much UI first (improvements.md, IMP-03). A one-off script -> Useless to others and skips validation. Import as-is and re-categorise -> Thousands of manual edits.

**Consequences:**
- The same format is the export format, so the round trip is the test.

---

### ADR-009: HexaRate validates, Frankfurter converts (2026-10-27)

Partly superseded: the rates job by ADR-069.

**Context:**
- CUR-02 asks that added currencies be validated against HexaRate. CUR-07 converts at the rate of the transaction date, and the history starts in 2018.

**Decision:**
- HexaRate is called once, server-side, when a currency is added.
- Frankfurter (ECB reference rates, daily from 1999, no key) fills `exchange_rates`: a backfill to 2018, then a daily scheduled job. Weekends and holidays use the last published rate.
- A currency HexaRate accepts but the ECB does not publish gets HexaRate's daily rate from the day it is added, and none before. `exchange_rates.source` records the provider.

**Alternatives Considered:**
- HexaRate for everything -> Unconfirmed history. A paid provider -> A key, a bill, and a third party seeing which currencies we ask for.

**Consequences:**
- A missing rate is an error on the amount (ADR-004), never zero.

---

### ADR-008: French and English from the first screen (2026-10-27)

Locales partly superseded by ADR-019 (FR and EN only).

**Context:**
- The interface ships in both languages (SET-04..06) and retrofitting i18n means finding every string later. The app is behind a login, so no `/fr/` URLs.

**Decision:**
- react-i18next. `fr` is the source: keys are typed from the French resources and English is declared `satisfies` the same type, so an unknown key or a missing translation fails type-checking. Both languages are bundled.
- The locale lives on the profile, mirrored in a cookie so the server renders the right language before the session loads.
- All number, currency and date formatting goes through `Intl` with the full locale. Reference labels carry `_fr` and `_en` columns; user-typed content is stored as typed.

**Alternatives Considered:**
- A hand-written typed `t()` -> Plurals, interpolation and SSR become our code. react-intl, Paraglide -> Smaller ecosystem or younger. French only first -> Every string found again later.

**Consequences:**
- No string literal in a component, enforced by `eslint-plugin-i18next`. Every feature is written twice.

---

### ADR-007: Repository layout (2026-10-27)

**Decision:**
- Short root (`README.md`, `CLAUDE.md`, `.github/`, `.claude/`, `docs/`), then `src/app/` (TanStack Start), `src/supabase/` (CLI project, pgTAP tests) and `src/data/` (`reference/` in Git, `local/` ignored).
- **Every command runs from `src/app/`.** The Supabase CLI is a dev dependency there: `npx supabase --workdir .. <command>`.

**Alternatives Considered:**
- `supabase/` at the root -> Puts a sub-project at the root. A workspaces monorepo -> Machinery for a second app that does not exist.

**Consequences:**
- Netlify's base directory is `src/app`.

---

### ADR-006: The browser never queries the database (2026-10-27)

**Context:**
- Supabase's default is a browser client on the auto-generated API with RLS as the only guard. This app holds financial data and the brief asks for a Node backend.

**Decision:**
- All data access goes through server functions that call Supabase with the user's session, so RLS still applies. Sign-in and MFA are server functions too. The browser bundle contains no Supabase client and no key; CI fails if one appears in `dist/client`.
- Session cookies are `httpOnly`, `secure`, `SameSite=Lax`.

**Alternatives Considered:**
- Browser to Supabase directly -> Every rule must also live in SQL, and a table that slips through RLS is exposed. Server to Postgres directly (Drizzle) -> RLS applies only if every query sets role and claims by hand.

**Consequences:**
- Two walls: Zod in the server function, RLS in the database. One extra hop per query. No realtime subscriptions.

---

### ADR-005: Composite foreign keys carry `user_id` (2026-10-27)

**Context:**
- RLS checks the row being written, not the rows it points at. A user who guesses another's category UUID could attach a transaction to it, and joins would leak its name.

**Decision:**
- Every user table has `unique (user_id, id)`, and every FK between user tables is composite: `(user_id, category_id) references categories (user_id, id)`.

**Alternatives Considered:**
- An ownership trigger -> One more thing to remember per table. Trusting unguessable UUIDs -> Until one appears in a URL or log.

**Consequences:**
- Cross-user references are impossible at the database level. Slightly wider indexes.

---

### ADR-004: Money as `numeric`, conversion at read time (2026-10-27)

**Context:**
- Amounts appear in several currencies, the display currency can change at any time (CUR-06), and conversion uses the rate of the transaction date (CUR-07).

**Decision:**
- `numeric(19,4)` amounts, `numeric(24,12)` rates, ISO 4217 codes. A transaction stores what was paid and, when different, the receipt price. Display amounts are computed by joining `exchange_rates` on the date; nothing stores a display-currency amount.
- Arithmetic happens in Postgres. The little done in TypeScript (previews) uses integer minor units with `BigInt`, never floats.

**Alternatives Considered:**
- Integer cents -> Rates and percent splits produce fractions needing a rounding policy at every step. Converted amount stored at write time -> Wrong when the display currency changes or a rate is corrected.

**Consequences:**
- Reports need complete rates for every transaction date. A missing rate is shown as an error, not zero.

---

### ADR-003: shadcn/ui as the component base (2026-10-27)

**Decision:**
- shadcn/ui (Radix, Tailwind), components copied into `src/app` and owned there. Charts through shadcn's wrapper around Recharts. Forms are native React 19 actions (ADR-011).
- Zod is the one validation layer: the same schema validates the browser form, the server input and gives the TypeScript type.

**Alternatives Considered:**
- MUI or Mantine -> Faster start, but deep customisation fights the theme system.

**Consequences:**
- Accessible primitives by default. Component updates are manual.

---

### ADR-002: TanStack Start server functions are the Node backend, on Netlify (2026-10-27)

**Decision:**
- One TanStack Start app. Its server functions are the backend, running on Node inside Netlify Functions. Scheduled work (exchange rates, recurring transactions) uses Netlify scheduled functions.

**Alternatives Considered:**
- A separate Express/Fastify API -> A second deployable and host, plus CORS and auth between them; worth it only if a mobile client appears. Supabase Edge Functions -> Deno, and logic split across two platforms.

**Consequences:**
- Frontend and backend share types and Zod schemas.

---

### ADR-001: Supabase Postgres is the source of truth (2026-10-27)

The Pro plan is superseded by ADR-016.

**Decision:**
- Supabase (Postgres, Auth with TOTP MFA). All schema changes are SQL migrations in Git, so the database can be rebuilt on any Postgres.

**Alternatives Considered:**
- Neon or self-hosted Postgres plus an auth service -> More to secure ourselves. Firebase -> A document model fits splits, budgets and aggregations poorly.

**Consequences:**
- RLS discipline is mandatory (security.md, ADR-005, ADR-006). Lock-in is limited to Auth; dumps restore anywhere.

---

## Format

### ADR-XXX: Decision Title (YYYY-MM-DD)

**Context:**
- Why this decision was needed

**Decision:**
- What was chosen

**Alternatives Considered:**
- Option -> Why rejected

**Consequences:**
- Benefits and trade-offs
