# Architectural Decision Records

Technical and structural choices, with the alternatives that were rejected. Check this file before proposing a change that might conflict. Screen and interaction choices live in [design-decisions.md](../00_briefing/designs/design-decisions.md). Superseded ADRs stay as one line so the numbers keep their meaning.

<!-- Newest first: a new ADR goes directly below this line. Template at the bottom. -->

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

**Context:**
- An investment's row on the hub showed two look-alike figures: its lifetime profit ("+12 000 $ (30 %)") under the name, and its change in value over the range ("▲ 6,0 %/an") under the value. The first ignored the range tabs; the second counted every deposit as growth, so a plan fed monthly looked like a great investment.
- The author asked for a senior designer's review of the row and approved one figure per row, following the range, measured as a return.

**Decision:**
- On an investment, the figure under the value is its return over the range: the gain is the change in value less the money put in (linked transactions, external contributions, transfers in) plus the money taken out, and the percent is over the start value plus each flow weighted by the share of the range it was in (modified Dietz). On Tout, past a year, both are per year and the percent is compounded, as for the other rows.
- A holding with no value at the range's start begins at its first money in, earlier flows counting at the start.
- `holding_flows()` gives each investment's flows by day in the display currency at that day's rate, null with a missing rate; the browser computes the return for whatever range is picked.
- The lifetime profit leaves the row. Opening an investment's chart shows, over it and to the right, Placé, Retiré (when above 0) and Profit total in amount and percent, since it opened whatever the range (author, 2026-11-18); its subtitle no longer shows what was withdrawn. Accounts, other assets and debts keep their change in value.

**Alternatives Considered:**
- A time-weighted return chained month by month -> Values are entered by hand, often months apart; a deposit before the next value reads as a loss that month and a jump later.
- The return computed in SQL per range -> Eight ranges per holding on every load, or a round trip per tab.
- Keeping the lifetime profit in the subtitle with a label -> Two figures, two periods on one row; Tout already gives the return since the start.

**Consequences:**
- The return's percent is a float (weights and a root); it is shown only, never summed (ADR-004). The gain amount stays exact.
- The lifetime figures need the chart opened; the row carries the range's return only.

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

**Context:**
- ADR-046 put each subpage's total on its hub card, and ADR-058 kept those totals complete while the rest of the hub leaves the hidden items out.
- Since the hub groups items by type (credit cards with the debts), the card "Comptes" and the group "Comptes" beside it showed two figures under one name. The author asked to remove the repeat.

**Decision:**
- The Comptes and Avoirs cards show a name, a count and a chevron. `getNetWorth` returns the counts and the net worth, no per-subpage totals.
- The net worth, the composition and the item list's group headers are the hub's only figures, all without the hidden items.

**Alternatives Considered:**
- Renaming the card totals ("Tous les comptes") -> Still two figures for overlapping sets, and the card's total ignored what is hidden.
- Dropping the cards for links beside the title -> The cards are the hub's only way into the subpages on a phone; kept as links.

**Consequences:**
- Supersedes ADR-046 and ADR-058 where the hub cards carry a complete total. The rest of both stands.
- A subpage's total is its drawers' totals; the hub shows no "accounts only" figure.

### ADR-059: No complete total under the hub's net worth (2026-11-17)

**Context:**
- ADR-058 showed "X $ (total)" under the net worth while items were hidden. After the hub's redesign the author asked to remove it.

**Decision:**
- The hub shows only the net worth without the hidden items. The eye beside the title, eye-off while some are hidden, is the one sign that something is left out.
- The Comptes and Avoirs cards stay complete.

**Alternatives Considered:**
- Keeping the line -> The author found it clutter under the headline.

**Consequences:**
- Supersedes ADR-058 where it adds the complete figure under the net worth. The rest of ADR-058 stands.

### ADR-058: The hub's net worth leaves out the hidden items (2026-11-17)

**Context:**
- ADR-048 kept every hub total complete and made leaving items out a chart view. With the total now in the sidebar beside the chart, the author asked for it to follow what is hidden, with the complete figure under it.

**Decision:**
- Hidden items (the eye beside the page title, per browser) leave the chart, the sidebar's net worth, assets, debts and their changes, and the Détail list. While any are hidden, a line under the net worth reads "X $ (total)", X counting everything open.
- The Comptes and Avoirs cards stay complete: they total their subpages.
- Still no flag on the account or holding; the choice stays in the browser.

**Alternatives Considered:**
- The full total large and the visible one under it (as built on 2026-11-16) -> The author wanted the large figure to match the chart.

**Consequences:**
- Supersedes ADR-048 where the hub's total always counts everything. The rest of ADR-048 stands.

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

**Context:**
- Under ADR-055 an emptied event list fell back to the default, so an event could not untick every default category. The author asked for the defaults to show ticked in the event and be deselectable, and for the default list to move to a tab.

**Decision:**
- `events.skips_own`: false follows the default list, true uses the event's `event_skips`, even empty. `save_event` takes null to follow the default.
- In the event form the defaults show ticked and marked "Par défaut"; a change makes the list the event's own, and picking exactly the defaults follows them again.
- The default list is the Événements page's Réglages tab, as a list; the explanation is a tooltip. The event field is a sub-field of the link checkbox, shaped like the other fields.

**Alternatives Considered:**
- Copy the defaults into the event when the link is ticked -> A later change to the default would not reach it; the author chose to follow the default.

**Consequences:**
- Supersedes ADR-055 where it says an emptied list follows the default and where the default list sits.

### ADR-055: The link by date skips categories again, with a default list (2026-11-13)

**Context:**
- Since 2026-11-09 an event links every expense and income in its dates. Salaries, phone bills and insurance landed in trips and were removed one by one (bugs.md). The author asked for the Sauf field back, with a default.

**Decision:**
- `event_default_skips`: the categories every event skips. `event_skips`: an event's own list, which replaces the default when it has any category; emptied, the event follows the default again.
- A skipped category takes its sub-categories. A transaction is skipped only when all its splits are in skipped categories.
- `matching_event` takes the form's category ids, or reads the saved splits, so the form and the save agree. Saving the default list recomputes every automatic link. Manual links ignore the skips.
- The default list sits above the events on the Événements page; an event's form shows it, marked "Par défaut", until the event has its own.

**Alternatives Considered:**
- Per event only -> The same salary and phone categories on every trip. A default only -> No trip-specific exception. A flag on categories -> Hides an event rule in the category form.

**Consequences:**
- An event cannot skip nothing while a default exists.

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

**Context:**
- "Invited" means the author paid for the person. The check on `transaction_people` still wanted a part above zero for every line but Moi and With, so a gift or an item bought for someone (the whole amount on Moi, their part at 0) could only be saved as a With line, which says the person was there, not that the author paid for them. The author found the amount requirement meaningless for the state.

**Decision:**
- An invited person is "with me, and I paid for them": a step above With, no amount of their own, the transaction amount is what the author paid for everyone. `transaction_people_value_check` therefore lets `invited` lines have a part of 0, like `me` and `with`. Owes and From lines still need a part (or an unknown amount for owes).
- Applied 2026-11-12 by `npm run db:push`; the 42 "pour" rows (gifts, items for someone) are Moi at the whole amount and the person invited at 0.
- No change to `save_transaction`, the parts sum or the deferred checks. The form already sends 0.

**Alternatives Considered:**
- Keep "with" for gifts -> The person page and the label say "with me", not "paid for".
- A tiny positive part -> Rounds to 0 in some amounts and not in others.

**Consequences:**
- A transaction whose lines are all 0 still fails the sum check (the form prevents it).
- Every invited line was set to a part of 0 on 2026-11-12 (DUO, TRIO and QUATUOR rows included: DUO means the author paid for both). Moi holds the whole amount, less what others owe back. The form treats an invited person like a With line: no part field, no share in the preview, sent with a part of 0 (a nameless invited line keeps its head count). The import does the same (`20261112150000_import_invited_without_part.sql`, test 29): an invited person is written with a part of 0 and Moi has the whole amount.
- Migration `20261112140000_invited_without_part.sql`, test `28_invited_without_part.test.sql`.

---

### ADR-051: "Avoirs" names the holdings in French (2026-11-12)

**Context:**
- The French page and each item were called "Placement(s)", and "Placement" was also one of the three natures (placement, actif, dette). The author found it odd for one word to mean two things on the same screens. English already separates them (Holdings; Investment, Asset, Debt).

**Decision:**
- In French the holdings are "Avoirs" (one item: "un avoir"); the natures keep Placement, Actif and Dette, and the investment category kind stays "Placements". Only labels change: code, tables, routes and the import's file names (`holdings.csv`) keep "holding".
- The import's "Comptes" tile, which counted holdings, now reads "Avoirs", and the "Contributions" labels read "Contributions externes" as in the app.

**Alternatives Considered:**
- "Patrimoine" -> No clean singular for one item.
- "Positions" -> A market term, odd for a house or a mortgage.

**Consequences:**
- A debt is an "avoir" in the accounting sense only.

---

### ADR-050: Holdings join the import in the same batch (2026-11-12)

**Context:**
- The author wants eight years of net-worth history (values, employer contributions, a TFSA moving to another institution) in the app through the CSV import, not typed one entry at a time (IMP-02). Part of the history is estimated: the employer share of an employer plan is not on any account, and a Swiss second pillar was filled in from its balance.

**Decision:**
- `import_batch` takes four more optional arrays: `holdings`, `snapshots`, `contributions`, `holding_transfers`. A new function, `import_holdings(payload, batch)`, checks them (no batch) and writes them (with the batch), so `import_batch` keeps one transaction, one summary and one undo. Its errors join the others, by file and line.
- A holding is matched by type, institution and name, the app's version is kept, and the other files name a holding by a key from holdings.csv. Lines already in the app are skipped, so a file can be sent twice.
- `import_batch_id` on holdings, values, contributions and transfers; `import_undo` removes them, and a holding only when nothing else points at it.
- An estimate is entered as a normal line with a label that says so ("Employer 3% (estimate)"). The app has no estimate flag.

**Alternatives Considered:**
- A second function and a second request for the holdings -> Two transactions: a bad holdings file could leave the transactions in and the net worth out, against ADR-012.
- A `holding` column on transactions.csv now -> Needs the 800-line import function to link rows already imported; left for when a history is imported with its holdings from the start.
- An estimate flag on contributions -> A column for one import; the label does the job.

**Consequences:**
- The summary shows holdings counts and the holdings to create; they cannot be merged or edited in the screen.
- Existing transactions that pay into a holding are linked by hand or by a one-off update.
- The export (IMP-04) must write these files too for the round trip to hold.

---

### ADR-049: Transfers between holdings are dated entries (2026-11-12)

**Context:**
- The author closes an account at one institution and moves the money to another holding, new or existing. The author asked for a transfer to have a date, "like a transaction", and chose a dated entry on both holdings over moving the history.

**Decision:**
- A `holding_transfers` table: from, to, date, amount above zero. Both holdings are investments in the same currency, so one amount serves both; neither is closed before the date. RLS and a pgTAP test come with it.
- Amended the same day, supersedes ADR-045 on "placed": a withdrawal used to be subtracted from placed, which shrank the basis and inflated the percent. Placed is now only money in (linked expenses, external contributions, transfers in) and never goes down. `holding_totals` gains `withdrawn` (linked incomes, transfers out). Profit is latest value + withdrawn - placed; percent is over placed. A transfer is withdrawn on the source and placed on the target. History stays on the holding that earned it. The row shows "Retiré" only above zero.
- A holding with a transfer cannot be deleted (foreign keys without cascade). More generally, a holding with any history (transactions, values, external contributions, transfers) can only be archived; the server checks it, so the delete icon is muted.
- The currency lock and the closing date also look at transfers.
- On the page, values, external contributions and transfers each have an icon and a sheet of their own; the holding form carries no lists. "Contribution de l'employeur ou de l'État" is renamed "contribution externe".

**Alternatives Considered:**
- Move the linked transactions and contributions to the target -> Rewrites history, and the author wanted a dated entry.
- Allow different currencies with two amounts -> More form and no use case yet; listed in improvements if needed.

**Consequences:**
- A transfer has no edit; delete and add again.
- Export and import do not carry transfers yet (as with the link, ADR-045).

---

### ADR-048: Holdings by country and type, optional name, no exclusion flag (2026-11-12)

**Context:**
- After trying the first holdings screens the author asked for: the country to come first and the type to follow from it, with a text box when no type is predefined; a name that is not mandatory; the "leave out of net worth" choice to move from the holding to the chart filters; no holdings filter in the transactions list. This changes parts of ADR-045.

**Decision:**
- `holdings` gets a required `country`. `type` becomes optional; a typed type goes in `type_label`, with exactly one of the two set. `kind` is stored on the holding: for a predefined type the database sets it from the type, for a typed one the user chooses it (placement, asset or debt).
- `name` becomes optional. An unnamed holding reads "type · institution · currency". Names stay unique among open named holdings, ignoring case and accents.
- `exclude_from_net_worth` is dropped. The hub totals count every open holding and account. Leaving some out is a filter of the phase 5 chart, remembered per browser (NW-05).
- The `holding_ids` and `without_holding` arguments of `list_transactions` are dropped. The "n transactions sans placement" count stays on the holdings page and links to the transactions list on the investment categories. The row keeps the holding, now as its name, type labels, institution and currency, so the client composes the label ("type currency (institution)" when unnamed).
- The holdings page groups by institution, with each drawer's total.
- Amended 2026-11-12: an unnamed holding reads "type en currency (institution)" ("REER en CAD (Desjardins)"), not "type currency (institution)".
- Supersedes ADR-045 on: the exclusion flag, the name being required, the type list, and the list filter and unlinked count. The rest of ADR-045 stands.

**Alternatives Considered:**
- Keep the exclusion flag and add the chart filter -> Two ways to leave something out, and a headline total that silently differs from the page.
- A free-text type always -> No kind, no profit logic, no translations.
- Keep the holdings filter for finding unlinked contributions -> The author's call: the category filter is enough, opened from the count's link.

**Consequences:**
- A migration changes the table, rebuilds `holding_totals`, drops the filter arguments and changes the list row's holding column.
- A typed type is not translated (user-typed content is never translated).
- The link lists every investment transaction, linked ones included; the ones without a holding tag are the ones to link.

---

### ADR-047: Institutions are managed in Réglages (2026-11-12)

**Context:**
- Institutions were managed on the accounts page: one group per institution, with edit and delete. Holdings now share them, and the author's holdings sit mostly in other institutions than the accounts. The accounts page showed empty groups, and an institution used only by a holding looked deletable although the database refuses (the in-use check counted accounts only).

**Decision:**
- A Réglages list, `/settings/institutions`, with the form in a route sheet, replaces the institution routes under `/net-worth/accounts`. The account and holding forms keep the inline picker with "Créer « … »".
- Delete is blocked while an account or a holding uses the institution. The list shows how many of each.
- The accounts page groups only the institutions with an open account, plus the accounts with none. Its group header keeps the website icon and loses the form link and the delete.
- The institution code moves from `accounts` to its own `institutions` folders in `lib/`, `server/` and `components/`.

**Alternatives Considered:**
- Keep them on the accounts page, hide the empty groups and count holdings in the in-use check -> Where an institution is managed would still depend on whether it has accounts.
- Separate institutions for accounts and for holdings -> The same bank twice.

**Consequences:**
- ACC-05 and ACC-06 are reworded. The `/net-worth/accounts/institutions/*` URLs go, with no redirect (ADR-021).
- An institution with only closed accounts or only holdings is findable only in Réglages.

---

### ADR-046: One Net worth tab with the accounts and the holdings as subpages (2026-11-12)

**Context:**
- Holdings were planned as their own Placements page. Accounts and holdings are both parts of net worth, but their rows, actions and grouping differ. The author wanted one place for net worth, a dashboard feel, and the chart in phase 5.

**Decision:**
- The Comptes tab becomes "Net worth" (English in both languages). `/net-worth` is a hub: a total card, a slot for the phase 5 chart and a link card for each subpage with its own total. `/net-worth/accounts` is the accounts page moved, `/net-worth/holdings` is the new holdings page. Their sheets keep their own URLs below the page.
- The tab stays active on all three paths. Each subpage has a back link to the hub (the rule of no back link had no use case before this).
- The total counts open accounts and the open holdings not left out of net worth; a missing rate gives a dash per figure (ADR-004). The hub has no schema of its own.
- `/accounts` has no redirect (one user, ADR-021).

**Alternatives Considered:**
- Keep `/accounts` and add `/holdings` as two more pages -> The tab needs a rule to stay active over unrelated paths, and nothing ties the totals together.
- One merged list of accounts and holdings -> Blurs two models with different actions.
- A tab for each -> Five tabs on a phone bar.

**Consequences:**
- Five links change (the tab, the transfer form, the account row, the institution group, the route files). The e2e specs use no `/accounts` path.
- The Dashboard tab is untouched; whether it shows net worth is left open.

---

### ADR-045: Holdings, their values, and an optional holding on an investment transaction (2026-11-11)

**Context:**
- NW-01 to NW-03 need investments, assets and debts with dated values, and the money the owner put into each. The money already exists as transactions on investment-kind categories. Bank accounts count through their balance, not as holdings (database.md).

**Decision:**
- Tables: `holding_types` (reference, loaded from `holding-types.csv`, kind investment, asset or debt), `holdings` (type, name, optional institution, country, currency, `opened_on`, `closed_on`, `exclude_from_net_worth`), `holding_snapshots` (date and amount in the holding's currency, one per date) and `holding_contributions` (employer or government money, date, amount, label). Every foreign key to a user table includes `user_id` (ADR-005), every table has RLS and a pgTAP test.
- `transactions.holding_id` is optional. A trigger allows it only on an expense or an income whose category is investment-kind, so a contribution is an expense and a withdrawal is an income. My own contributions are never entered twice.
- A `holding_totals` view returns placed, latest value, profit and percent, converted with `exchange_rate`, null when a rate is missing and never a partial sum (ADR-004). Placed is the linked expenses minus the linked incomes plus the contributions, each converted at its own date.
- Snapshots (NW-02) and the exclusion flag (NW-05) come with the holdings instead of phase 5, so the page shows profit from the start. The net worth chart (NW-04) stays in phase 5.
- Debts have values only. A loan payment does not link to a debt holding.
- The import format does not change. The history was imported before holdings existed, so the author links past contributions by hand, helped by a count of investment transactions without a holding and a transactions filter on them.

**Alternatives Considered:**
- A transfer to the holding, as if it were an account -> Holdings would need a balance and a currency per leg, and it blurs the line between accounts and holdings.
- Only the category, one investment category per holding -> Renaming or merging a category silently breaks the totals.
- A current value field now, snapshots in phase 5 -> A migration to unwind it, and no history.
- A `holding` column in the import now -> More format work for a history that is already in.

**Consequences:**
- Export then import no longer reproduces the data exactly: the link is lost. Revisit when the export is built (IMP-04), by adding an optional `holding` column then.
- Placed depends on exchange rates at each transaction date, so a missing rate empties the profit instead of showing a wrong one.
- A holding with transactions cannot be deleted, only archived.

---

### ADR-044: End-to-end tests with Playwright, on a local stack, in CI (2026-11-11)

**Context:**
- The unit tests cover the pure logic and pgTAP covers the database. Nothing exercised a request from the browser through a server function to an RPC, nor the sign-in with MFA. The development machine cannot run the local stack (ADR-014), and the hosted project holds the owner's account (ADR-021).

**Decision:**
- `@playwright/test`, specs in `src/app/e2e/`, run by a CI job on a local Supabase stack (the one the pgTAP job already starts). The job is non-blocking at first (`continue-on-error`): it gates nothing, and the `migrate` job does not wait for it.
- A setup project creates one test user through the Auth admin API, signs in through the screen, enrols TOTP from the secret the screen shows, and keeps the session. The TOTP code is computed with `node:crypto` (RFC 6238), no library.
- The specs: sign-in (wrong password, password without code, password with code, a cross-site write is refused), the import of the example files, a new expense. They run in order on one worker, since the import creates the accounts and categories the form needs.
- `e2e/env.ts` refuses any Supabase URL that is not `localhost` or `127.0.0.1`.

**Alternatives Considered:**
- Against the hosted project -> Test entries among real data (ADR-021).
- Seeding the test user's factor directly in SQL -> Skips the enrolment screen, the one most worth testing.
- A TOTP library (otplib) -> Fifteen lines of `node:crypto` (ADR-011).

**Consequences:**
- The specs could not be run on the laptop. They were written from the screens and tuned on the first CI runs; expect selector fixes. The job uploads the HTML report and traces.
- To gate merges, remove `continue-on-error` from the job and add it to the `migrate` job's `needs`.
- To run locally, someone with Docker sets `E2E_SUPABASE_URL`, `E2E_PUBLISHABLE_KEY` and `E2E_SECRET_KEY` from `supabase status` and runs `npm run e2e` from `src/app`.

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

**Context:**
- EVT-07 links every expense and income inside an event's dates. The author wants an event (a visa year) that holds only what is linked by hand.

**Decision:**
- `events.auto_link` (default true). `matching_event` skips an event with it off, so the form, `save_transaction`, the import and `relink_events` agree.
- Turning it off hands its automatic links to the next matching event, or to none, and keeps the manual ones. No `event_exclusions` row is written, so turning it back on links the dates again.

**Alternatives Considered:**
- Tags -> A second way to group, loose names, no dates or total.
- An event with no dates -> Links by hand only, but has no place on the calendar (EVT-04).

**Consequences:**
- An event with the link off is never offered for a date on a transaction.

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

**Context:**
- ADR-017 made CI on `main` the only way to migrate, after a backup. The project held no real data yet, so a new screen could not run locally until its migration reached `main`.

**Decision:**
- Until the first real import, `npm run db:push` (from `src/app`) applies migrations from the laptop with no backup step. Work is tried locally before `main`. CI still runs checks and pgTAP.
- Before the first real import, revisit: a separate dev project, or the backup gate back in front of every push.

**Alternatives Considered:**
- CI as the only path -> Nothing can be tried before `main`. Push gated on the backup workflow -> Ceremony for an empty database. A second project now -> A second sign-in and TOTP setup for no gain yet.

**Consequences:**
- Supersedes "migrations only from CI" in ADR-017 until real data exists.

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

Partly superseded: the demo account by ADR-021, migrations-only-from-CI by ADR-022.

**Context:**
- One user, a Canadian project, two free slots. A demo-only dev project plus production (ADR-014, ADR-016) is a second database to keep in step. Migrations cannot be tested locally without Docker.

**Decision:**
- One project, `money-tracker`, holds real data.
- Migrations are additive (expand, then contract in a later change): Netlify deploys the app and CI migrates the database independently, so either may land first.
- Netlify deploy previews are off: a preview runs unreviewed code against real data.
- The second free slot stays empty for the public demo (DEM-01), which relaxes MFA and must never share a database with real data.

**Alternatives Considered:**
- Separate dev and production projects -> Safer for experiments, but a second schema to keep in step, and it uses the demo's slot.

**Consequences:**
- A bad migration reaches real data directly. Defences: pgTAP on a fresh database, the additive rule, a backup taken minutes before.

---

### ADR-016: Free plans until a real limit is hit (2026-10-27)

Partly superseded: the two-project layout by ADR-017.

**Decision:**
- Stay on free Supabase and Netlify plans. The free Supabase plan has no downloadable backups and pauses after a week of inactivity; Netlify functions run in US East (Ohio).
- **The nightly encrypted dump is the only backup**, so the backup workflow and one tested restore gate the first real import.
- A pause is accepted: restore it from the dashboard.
- Upgrade triggers, each a new ADR: the database nears 500 MB, pauses become a real problem, Ohio latency is noticeable, or invitations need more email than the built-in sender (solved with a free custom SMTP, not a plan).

**Alternatives Considered:**
- Supabase Pro from the start -> Daily backups and no pausing, for a cost the project does not yet need.

**Consequences:**
- Data loss risk rests on one GitHub Action and one offline key; the restore test makes it real.

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

Partly superseded: the production-on-Pro part by ADR-016, the separate dev project by ADR-017.

**Context:**
- The development machine (macOS 12, Intel) cannot run current Docker Desktop, so the local Supabase stack is out.

**Decision:**
- Migrations reach the hosted project with the Supabase CLI. GitHub Actions runs `supabase db start`, `db lint` and `test db` (pgTAP) on every push.

**Alternatives Considered:**
- An older Docker or Colima -> Unsupported software on a machine holding financial exports.

**Consequences:**
- pgTAP results come back from CI, not instantly.

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
