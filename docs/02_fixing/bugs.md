# Bug Log

Track bugs with dates, solutions, and prevention notes. Search this file before debugging familiar-looking issues.

<!-- Newest first: a new bug goes directly below this line. Template at the bottom. -->

### 2026-11-25 - The end-to-end setup could not find the password field
- **Issue**: In CI, the e2e job timed out on its first step: `getByLabel('Password', { exact: true })` found nothing, and the seven specs after it did not run.
- **Root Cause**: Playwright matches `getByLabel` on the label's whole text, `aria-hidden` included, so a required field's label reads `Password*`. Email passed only because it was not matched exactly.
- **Solution**: The specs match `/^Password\*?$/`, which still leaves out the "Show password" button.
- **Prevention**: In e2e, match a required field's label with a regex that allows the asterisk.

### 2026-11-25 - The page showed under a sheet's footer when the keyboard opened
- **Issue**: On an iPhone, tapping a field in a sheet moved the sheet up and showed the list behind it between the footer and the keyboard. A picker's list flipped above its field.
- **Root Cause**: Once `useVisualViewport` was removed (above), Safari scrolled the page under the sheet to bring the field above the keyboard, past the bottom of the fixed sheet. Radix's `overflow: hidden` on the body does not stop that scroll on iOS.
- **Solution**: `usePageLock` fixes the body in place while a sheet is open on a touch screen, so the page has nothing to scroll; the scroll position comes back on close. The sheet keeps its full height.
- **Prevention**: Retest on an iPhone: a field low in a sheet (Note), and a picker. iOS 26 has open WebKit bugs on fixed elements and the keyboard (WebKit 300523), so a gap may remain there.

### 2026-11-25 - Collapsed net worth groups opened, then closed, on load
- **Issue**: Opening the net worth page showed every group open, and the collapsed ones closed only once the chart had drawn.
- **Root Cause**: `useStoredState` read local storage in an effect, so the first render always used the default, and the effect ran after the whole page, chart included, had rendered.
- **Solution**: The folded groups moved to a cookie read with the page's data (ADR-074), so the server renders them closed. The other stored choices (sorts, tabs, open branches) now read storage through `useSyncExternalStore`: right away on a page opened from inside the app, right after hydration on a full load.
- **Prevention**: Read per-browser state on the first render, never in an effect; a cookie when a full load must render it.

### 2026-11-25 - Filters set together made a request each, and a removed chip waited
- **Issue**: On the transactions list, each tick, chip ✕, period tab or status bubble sent its own request, and a chip, removed or new, waited for the list to reload.
- **Root Cause**: The page drew the chips, tabs and sidebar from the loader's query, which trails the address, and every change navigated at once. Chips were named only by the server, with the list. Only the filter sheet held its ticks locally (`useLocalFilters`).
- **Solution**: `useDraftSearch` holds the page's choice: every change shows at once, and the address follows 400 ms after the last one, so one request covers them. The sheet's own debounce is gone. A new chip takes its name from the choices the sheet already loaded (`useFilterNames`), so it shows before the reload too.
- **Prevention**: A control on the list reads the draft (`go.shown`), never `data.query`, which only says what the list shows.

### 2026-11-25 - No exchange rate after 2026-11-02
- **Issue**: No rate of any kind was stored after 2026-11-02, and CLP and GTQ, added on 2026-11-12, had none at all.
- **Root Cause**: The Netlify rates function had no `SUPABASE_SECRET_KEY`; the history came from a run of `npm run rates` on the laptop. CLP and GTQ also had no source for past days (ADR-009).
- **Solution**: The author sets `SUPABASE_SECRET_KEY` on Netlify (Functions only, setup.md). The job moved to Frankfurter v2 (ADR-069), and a laptop run filled CLP and GTQ back to 2018 and every currency to 2026-11-25. Each run now logs a first line, so one that stops at once still shows.
- **Prevention**: A function that logs nothing has not run; check its variables first.

### 2026-11-25 - A sheet shrank and moved up when the keyboard opened
- **Issue**: On an iPhone, tapping a field in a sheet made the sheet shorter and moved it up, so the whole page seemed to jump.
- **Root Cause**: `useVisualViewport` (2026-11-12) set the sheet's top and height to the visible area at each keyboard move. It was added for two symptoms never confirmed on a device: the first letter lost in a picker and a tap landing below the field.
- **Solution**: The hook is gone: the sheet keeps the full screen and the keyboard covers its bottom. A picker's list still opens above the keyboard, since Radix measures it against the visible area too.
- **Prevention**: Retest on an iPhone: type in a picker low in a sheet, tap fields after the keyboard is open. If a tap lands off its field, fix that alone, without resizing the sheet.

### 2026-11-25 - Safari zoomed the page into the slip's fields
- **Issue**: On an iPhone, tapping Débité, Reçu, a fee or a split amount on the receipt slip zoomed the page. Found while looking at the keyboard moving sheets (above).
- **Root Cause**: Those fields took the slip line's 14px text, and Safari zooms into any field under 16px when it takes focus.
- **Solution**: `slipTyped` (`receipt-line.tsx`) is 16px below `md` and 14px above; the big amount keeps its size at both.
- **Prevention**: A field's text is at least 16px on a phone; `fieldControl` already is.

### 2026-11-25 - The export's rows were squeezed while loading
- **Issue**: On opening the Exporter tab, each file's row was one line high, then grew when the line counts arrived.
- **Root Cause**: The count is the row's second line, left out until `getExportCounts` answers.
- **Solution**: The row shows a skeleton in that line until then (`export-card.tsx`); `CheckNode.detail` takes any node.
- **Prevention**: Text that arrives later keeps its place with a skeleton (ADR-068).

### 2026-11-23 - A dashboard row's name lit up before the rest on hover
- **Issue**: Hovering a row of the category or merchant table, the name cell took the hover colour at once while the rest of the row faded in.
- **Root Cause**: The row fades its background (`rowHover`), but the sticky name cell paints its own opaque background from `--row-bg`, and it had no transition.
- **Solution**: `STICKY` in `components/dashboard/category-table-row.tsx` fades its background as the row does.
- **Prevention**: A cell that paints its own background over a row's gets the row's transition too.

### 2026-11-20 - A merchant's open panel ran off a phone's screen
- **Issue**: At phone width, an open merchant's receipt lost its amounts and its chart ran past the card's edge.
- **Root Cause**: The panel is a cell spanning the table's columns, inside the table's sideways scroll, so it took the table's width.
- **Solution**: `TablePanel` (`components/dashboard/table-panel.tsx`) pins the panel to the scroll area's visible width (a container query, `tablePanel` in `styles.ts`). The category table's charts use it too.
- **Prevention**: A row that opens content inside a table that scrolls sideways is checked at phone width.

### 2026-11-20 - "Taux manquant" in a merchant's chart
- **Issue**: Hovering a month without a visit in a merchant's chart said the rate was missing.
- **Root Cause**: The chart drew the average bill, null without a visit, and the tooltip reads null as a missing rate.
- **Solution**: The chart draws the total per month, 0 without a visit, as a category's (`merchant-bills.ts`, with a test). Only a missing rate stays null.
- **Prevention**: A null in a money series means a missing rate; "nothing happened" is 0.

### 2026-11-19 - An income repaying several expenses kept only one
- **Issue**: Ticking several owed lines on an income and saving kept a single one; the form showed one ticked again.
- **Root Cause**: `save_transaction` paid the ticked lines in order, and a part not known yet took all that was left of the income. The next lines got 0, and a line given 0 is not stored (`amount > 0`), so its link vanished without a word.
- **Solution**: Migration 20261119120000: the known parts are paid first in the order ticked, then the parts not known yet share what is left equally, each within its expense's room, a share that does not fit going to the others. pgTAP 36 failed on the old function (800 on the first line, nothing on the second) and passes on the new one.
- **Prevention**: A rule that hands "all that is left" to one item needs a test with two of them.

### 2026-11-19 - The dashboard's net worth differed from the net worth page
- **Issue**: The Patrimoine tile showed another figure than the net worth page.
- **Root Cause**: The page shows today's balances (open accounts, open holdings' latest values) while no item is hidden; the tile read the last date of `net_worth_series`, which lags behind today.
- **Solution**: `todayTotal` in `lib/net-worth/net-worth.ts` computes the page's figure; both server functions call it, and the tile ends its series on it while no item is hidden, as the page does.
- **Prevention**: One figure shown on two pages comes from one function.

### 2026-11-19 - The category table showed this month on a past year
- **Issue**: With 2024 picked, the dashboard table still showed Ce mois-ci, the last 6 and 12 months and the average counted back from today, in 2026.
- **Root Cause**: `tableColumns` always counted back from today's month and ignored the year picked.
- **Solution**: A past year counts back from its December, the current one from today (`lib/dashboard/category-table.ts`, with a test).
- **Prevention**: A figure "counted back from today" on a page with a period needs a test on a period other than the current one.

### 2026-11-19 - Every dashboard figure was 0
- **Issue**: On real data the dashboard showed 0 everywhere, while the gallery's invented figures were right.
- **Root Cause**: The API returns at most 1000 rows (`max_rows`). `my_monthly()` gave 1751 for the owner's history, ordered oldest first, so the response stopped years before the current one. No error is raised on a cut response.
- **Solution**: `allRows` in `lib/server/db.server.ts` fetches a function's rows a page at a time with `.range`. The dashboard uses it for `my_monthly` and `net_worth_series`, the net worth page for `net_worth_series` (629 rows today) and `holding_flows`. Each function orders its rows, so the pages never overlap.
- **Prevention**: A query that returns one row per month and item can pass 1000 rows: page it, and count its rows on the real history before calling it done.

### 2026-11-18 - CI red after the history rewrite push
- **Issue**: The first push in a while failed three jobs: docs (em dashes), app (`npm run verify`) and e2e (sign-in setup).
- **Root Cause**: The "no figure" mark was a literal em dash in four components and three docs; four files had drifted from Prettier and an import was duplicated; the show-password button's name contains "Password", so `getByLabel('Password')` matched two elements.
- **Solution**: One `NO_FIGURE` constant written as `'\u2014'`, the docs say "a dash"; the files reformatted and the import merged; the e2e selectors use `exact: true`. The e2e job no longer prints the local stack's throwaway keys from `supabase start`.
- **Prevention**: Run `npm run verify` and the em dash check before pushing; a label that is a substring of another control's name needs `exact: true`.

### 2026-11-18 - pgTAP 32 (event skips) failed 5 of 10
- **Issue**: Every check expecting a transaction linked to the event got NULL.
- **Root Cause**: The test's helper `pg_temp.event_on(day, amount)` filtered on `t.amount = -amount`. In a SQL function a column wins over a parameter of the same name, so it compared the column with itself and matched nothing. The linking itself was right, checked step by step in a rolled-back transaction.
- **Solution**: The helper names its parameter `event_on.amount`; 10 of 10 pass.
- **Prevention**: Qualify a parameter in a SQL function when a column shares its name.

### 2026-11-16 - Adding a transaction lost the place in the list
- **Issue**: After adding a transaction (or closing any sheet) deep in the list, the list went back to its first page and the scroll was lost.
- **Root Cause**: Closing a sheet reloads the list's first page, and `useTransactionPages` started over on any new first page, dropping the older pages loaded by scrolling.
- **Solution**: With the same query, the older pages stay on screen (minus the days the new first page holds) and reload in the background down to the same day, then replace the old ones. Another period, filter or search still starts over.
- **Prevention**: A reload after a write keeps what the user had loaded.

### 2026-11-14 - The default excluded categories did not save
- **Issue**: Saving the default list on the Réglages tab did nothing; no row was written.
- **Root Cause**: Saving recomputes every automatic link, and `relink_events` called `matching_event` once per transaction: 87 s for the whole history, past the 8 s statement timeout, so the save was cancelled.
- **Solution**: `relink_events` works in one pass with the same rules (migration `20261114110000_relink_events_set_based.sql`): 0.71 s. Checked in a rolled-back transaction: it agrees with `matching_event` on every row. One stored link was stale (a phone bill inside a trip's dates with no link and no exclusion) and will be linked on the next full recompute unless its category is excluded.
- **Prevention**: Time a function over the whole history before calling it from a request.

### 2026-11-13 - "Casse-Croûte" as a merchant
- **Issue**: "Casse-Croûte" (a kind of snack bar, not a business) was a merchant on 2 transactions.
- **Root Cause**: The merchant clean-up read it as a store name.
- **Solution**: Both transactions lost the merchant and got "Casse-croûte" at the start of their note ("Casse-croûte - …" when a note existed); the merchant was deleted.
- **Prevention**: A generic kind of place goes in the note, as with Parkomètre and Traversier.

### 2026-11-13 - "Translations for fr were not loaded" in dev
- **Issue**: In dev, opening the menu (or any page) showed "Translations for fr were not loaded".
- **Root Cause**: Two causes. A dev server started before `src/client.tsx` existed keeps Start's default client entry, so nothing loads the language before hydration. And after a hot reload, Vite serves a second copy of `i18n/index.ts` (`?t=…`) whose module-level cache is empty.
- **Solution**: The translation cache lives on `globalThis`, shared by every copy of the module. Restart the dev server once to pick up the client entry.
- **Prevention**: Restart the dev server after adding or moving an entry file.

### 2026-11-13 - Transactions whose note names or implies the business, with no merchant
- **Issue**: Some transactions had no merchant although the note says who was paid or makes it obvious (every train in one country is run by one company).
- **Root Cause**: The merchant clean-up only linked notes that were a store name; context and abbreviations were left.
- **Solution**: A one-off update gave about 60 transactions a merchant, the note kept as detail, from the notes and the author's answers about who runs a class, a route or a booking. Booking fees of one service moved to their own category.
- **Prevention**: When a note is a place or a route, ask which company runs it before leaving the merchant empty.

### 2026-11-12 - One "Gouvernement" merchant for two governments
- **Issue**: Incomes from two governments sat on one merchant "Gouvernement", the rest of the name left in the note.
- **Root Cause**: The import cut "Gouvernement" off as the merchant and kept the rest of the name in the note.
- **Solution**: A one-off update moved most of them to the right government: certain from the note, or from the pattern of the quarterly credits, which come in pairs of a larger and a smaller amount. A few stay on "Gouvernement" where the payer was not clear, as the author decided.
- **Prevention**: Keep a merchant's full name in the import file when it starts with a word shared by several payers.

### 2026-11-12 - Everyday money swept into the events by the dates rule
- **Issue**: An event links everything that falls in its dates, so salary, phone bills, insurance, interest and tax refunds sat inside trip events.
- **Root Cause**: The automatic linking looks only at the date and the kind (expense or income); the category rules were removed from events.
- **Solution**: 89 automatic links were removed in one update, each with an exclusion so a relink does not put it back. Manual links and a trip's own costs (food, transport, activities, ATM and exchange fees) stay.
- **Prevention**: The exclusions cover these transactions only. A new salary or bill inside an event's dates will be linked again, until the event excludes its category (ADR-055).

### 2026-11-12 - ATM fees filed as cash
- **Issue**: Several ATM fees were filed with the cash withdrawals they came with.
- **Root Cause**: The sheet filed the fee with its withdrawal.
- **Solution**: A one-off update moved them to Frais bancaires. An income in cash that only mentions the ATM stays where it is.
- **Prevention**: File a fee under Frais bancaires even when it belongs to a trip withdrawal; the event keeps it with the trip.

### 2026-11-12 - Foreign amounts left only in the note
- **Issue**: Cash withdrawals and purchases made in another currency on a CAD account had the foreign amount only in their note. No transaction had an original amount.
- **Root Cause**: The import file carried the CAD amount and the note, and the original amount and currency columns were empty.
- **Solution**: A one-off update set the original amount and currency on 12 transactions, the CAD amount staying the price paid, and enabled three new currencies. Each paid price was compared with the stored rate first: most fell within ATM fees and spreads. Two notes implied a rate far from the market and were corrected at the author's word. Withdrawals whose note gives no amount cannot be set.
- **Prevention**: Give the original amount and currency columns in the import file when a purchase or withdrawal was made in another currency.

### 2026-11-12 - A catch-all category holding 93 transactions
- **Issue**: 93 transactions were in Divers (no sub-category), many with a note that says what they are.
- **Root Cause**: The old sheet's catch-all columns were mapped to Divers whole, and the new categories were not split further.
- **Solution**: 61 transactions moved by a one-off update, matched by date, amount and kind, to existing categories and four new ones the author chose (colours and icons on auto). 32 stay in Divers on purpose.
- **Prevention**: Read the notes of a catch-all category after an import before it grows.

### 2026-11-12 - Merchants that were not merchants
- **Issue**: After the merchant clean-up, the author reviewed the new list: some names were not stores (a generic place, a person, a doctor, a parking) and some places lacked their location.
- **Root Cause**: The clean-up took every name in a note, including the old sheet's store cells for types of place and relatives written as a source.
- **Solution**: 18 merchants were removed and their name put back in the note of their transactions ("Name - note"). Four relatives were deleted as merchants, their incomes now coming from the person. Three places got their city. A merchant that held subway rides lost them to the note.
- **Prevention**: Do not create a merchant from the old sheet's store column when it is a type of place, a person or a payee without a name; keep it in the note.

### 2026-11-12 - Trip costs outside the dates of their event had no event
- **Issue**: An event links what falls in its dates by itself, so flights and lodging bought months before, trip refunds, health care and documents for a trip stayed without an event. Two events had no transaction at all.
- **Root Cause**: The import linked only the rows its file named, and the dates rule does not reach a booking made earlier or a refund paid later. A long stay abroad has automatic linking off, so its documents need a manual link.
- **Solution**: A one-off update linked 89 transactions to 21 existing events (source `manual`, so a relink does not undo them). A later check linked five more and, at the author's request, created one event for a camping trip and three for weekend trips; the pay slips the dates rule swept in were excluded.
- **Prevention**: After an import, list the unlinked rows with a trip word in the note (a city, "vol", "hostel", "visa") and link them by hand.

### 2026-11-12 - Stores left in the note instead of the merchant field
- **Issue**: 895 expenses had a note and no merchant, and many of those notes were a store, a restaurant, a museum or an organisation. Fifteen incomes had their source only in the note.
- **Root Cause**: The import only created a merchant for a store it could split from the text. In the travel rows the city comes first ("City - Store"), and in the old sheet some store cells were kept whole in the note.
- **Solution**: A one-off update from the notes and the author's sheets. 344 expenses got a merchant (84 matched by name, the others through a hand-made list), 187 merchants were created, and the note keeps only the rest. 15 incomes got their source. Nine payments to a person got the person as the seller. The old notes are saved outside Git.
- **Prevention**: After an import, list the transactions with a note and no merchant and read them for store names. Cash withdrawals, train and bus legs, products, unnamed meals and generic names stay as notes.

### 2026-11-12 - People named with "avec" were imported as invited
- **Issue**: The sheet marks who the author paid for with DUO, TRIO or QUATUOR. A person only named ("avec X") was with the author and paid for nothing, but the import made every one of them an "invited" line. The database had no "with" line at all.
- **Root Cause**: The people file given to the import used one role for both cases, and the words that told them apart were cut from the note.
- **Solution**: One-off updates in four passes, checked against the sheet text and the author's rules ("pour X" is a gift, a payment to a person is a seller, a refund means a split). Named people and groups moved from invited to with; gifts got the author's line at the full amount; payments to a person became sellers. The author then asked that an invited person need no part (ADR-052): every invited line is now 0, Moi taking the whole amount less what others owe, and the import writes invited people at 0 too. The lines changed are saved outside Git.
- **Prevention**: Keep the DUO, TRIO, QUATUOR words as the only way to get an invited line when preparing an import file, and count the roles after an import (invited, with, owes) to see that each is used.

### 2026-11-12 - A city taken for a person as seller
- **Issue**: Nine expenses of one trip named a person as the seller, because the city's name is also that person's name. Five stores of the same trip stayed only in the note.
- **Root Cause**: The sheet wrote "City - Store"; the import read the first part as the store, found the person with that name, and set the seller (ADR-040).
- **Solution**: A one-off update cleared `seller_person_id` on the nine rows, created the five merchants and linked them; generic notes stay as notes, as the author asked.
- **Prevention**: A person whose name is also a place or a business can be matched wrongly; read the sellers the import sets, not only the merchants it creates.

### 2026-11-12 - Expenses bought from a person had no seller
- **Issue**: Eleven expenses whose store in the sheet was a person showed the person only in the note and in a 50/50 split, with no "Acheté chez".
- **Root Cause**: The import sets the seller from a merchant text that is a person's name or alias (ADR-040). These rows came with the person already moved to the note and the people lines, so the rule did not run.
- **Solution**: A one-off update set `seller_person_id` on the 11 rows, matched on date, amount and note. With a seller the whole amount is the author's own part, so the split lines of nine of them were deleted (the first pass had kept them; the author corrected it).
- **Prevention**: After an import, list the expenses with no merchant and no seller and read their notes for a person's name.

### 2026-11-12 - History before 2023 imported with day and month swapped
- **Issue**: The old sheet wrote dates as MM-DD-YYYY. The first import read them as day first, so a transaction of 2018-08-02 sat on 2018-02-08, and the history showed rows from before the sheet began and after it ended. Dates with a day above 12 were fine.
- **Root Cause**: The file given to the import had the sheet's dates in the wrong order for every row whose day is 12 or less. The import format is `YYYY-MM-DD` and cannot tell the two apart.
- **Solution**: A one-off update (not a migration, not app code) swapped month and day on the 424 affected rows of the first batch, then `relink_events` ran over 2018 to 2022. The old dates and links were saved outside Git first. The rule was too broad for two rows already corrected by hand; both were put back.
- **Prevention**: Check a few known rows against the source after an import, and convert dates from an old source with its stated format. Before a bulk update of dates, keep out rows already edited by hand (`updated_at` later than `created_at`).

### 2026-11-12 - Saving a transaction died with "permission denied for function check_transaction_holding"
- **Issue**: As a signed-in user, any save of a transaction or its splits failed. 11 pgTAP tests (files 07, 14, 15, 24) had been failing since the holdings migration.
- **Root Cause**: The deferred triggers added for holdings run as the user and call `check_transaction_holding`, whose execute right was revoked from `authenticated` along with the trigger functions. A trigger function needs no right to be fired, but a function it calls does.
- **Solution**: `20261112130000_transaction_holding_check_grant.sql` grants execute on `check_transaction_holding(uuid)` to `authenticated`. It is security invoker, so it reads through RLS.
- **Prevention**: Run `npm run db:test` before pushing a migration that adds a trigger; only revoke execute from a function no other function of the user calls.

### 2026-11-12 - The import check failed with no message (error 21000)
- **Issue**: The import check failed in the app with "UPDATE requires a WHERE clause", though the same call passed in SQL.
- **Root Cause**: The API role has pg_safeupdate, which refuses an UPDATE or DELETE without a WHERE. `import_holdings` had two updates of its temporary table without one. The SQL runs of the check used another connection, which does not have it.
- **Solution**: `where true` on both (`20261112120000_import_holdings_where.sql`). The check's toast now ends with the database code.
- **Prevention**: Every UPDATE and DELETE in a function the API calls has a WHERE, even on a temporary table.

### 2026-11-11 - `npm run verify` failed on main
- **Issue**: `src/server/events.ts` was committed unformatted, so `prettier --check` failed
  and `verify` stopped before the tests ran.
- **Root Cause**: The last two commits touching the file were made without running `verify`.
- **Solution**: `prettier --write` on the file.
- **Prevention**: Run `npm run verify` before proposing a commit message.

### 2026-11-05 - A line without a name could not be paid back
- **Issue**: An expense where someone without a name owed me their part stayed owed for
  good: no income could link to it.
- **Root Cause**: Rembourse lists the owed lines of the income's Proche, and a line
  without a name has no person, so no income's list ever held it.
- **Solution**: The income's Proche field offers Sans nom (`ANONYMOUS`, stored as a
  `from` line with no person); its Rembourse lists the owed lines without a name.
- **Prevention**: Every line kind a spec allows (named, Moi, without a name) gets a
  pgTAP case for each flow that reads it.

### 2026-11-05 - No focus outline anywhere
- **Issue**: Tabbing through the app showed no focus at all: links, buttons, fields,
  rows, the + and the tabs.
- **Root Cause**: `focusRing` (and the shared button) read `outline-none
  focus-visible:outline-2 …`. In Tailwind 4, `outline-none` sets `--tw-outline-style:
  none`, and `outline-2` only sets the width, taking its style from that variable, so
  the focused outline was still `none`.
- **Solution**: `focus-visible:outline-solid` in `focusRing` and in the button's base
  classes, which sets the style back to solid on focus.
- **Prevention**: Use `focusRing` for every focusable element; never pair
  `outline-none` with an outline width without a style.
  Second cause, found after the fix: in cards (`overflow-hidden`, for the rounded
  corners) and the sideways-scrolling Fréquentes row, an outline drawn 2px outside its
  element was clipped at the edges. Those containers now draw it inside (`insetFocus`).

### 2026-11-05 - Closing a sheet scrolled the list back to the top
- **Issue**: Closing the sheet of a row far down a list (an archived category, always at
  the bottom) jumped the page to the top.
- **Root Cause**: The fix of the same day only covered opening. Closing navigates to the
  list, a location with no sheet, so the router's scroll restoration runs. It also ran
  `router.invalidate()` after the navigation, and every router load ends in an
  `onRendered` event that resets the scroll unless that load's navigation said
  otherwise; the router rearms the reset after each one. So passing `resetScroll: false`
  to the navigation alone did not help (the first attempt): the refresh after it still
  scrolled to the top.
- **Solution**: `RouteSheet` refreshes first, while still on the sheet's route where
  scroll restoration is off, then navigates back with `resetScroll: false`. The
  `<Navigate>` a sheet route renders for a missing row passes `resetScroll: false` too.
- **Prevention**: After a navigation back to a list, do not trigger another router load;
  refresh before leaving the sheet.

### 2026-11-05 - A lost connection while saving showed a crash screen
- **Issue**: Saving a merchant, account, institution, category or currency with the
  connection down replaced the page with the router's English error screen instead of
  "La modification n'a pas été enregistrée." Creating an institution from the account
  form failed silently the same way. Any loader error showed that English screen too.
- **Root Cause**: Those forms awaited the server function without a `.catch`, so the
  rejection escaped `useActionState` to the error boundary; only the transaction form
  caught it. The router had no `defaultErrorComponent` or `defaultNotFoundComponent`.
  Separately, the add-currency form showed "HexaRate is unavailable" for any failure.
- **Solution**: Every sheet form runs on `useSheetForm` and every "Créer « … »" on
  `useInlineCreate`, which both catch and show the save failure (ADR-025). The router
  uses translated `RouteError` and `RouteNotFound` screens. The add-currency form tells
  an unknown currency, HexaRate down and a failed save apart.
- **Prevention**: New forms and pickers use the shared hooks; spec 02's Forms pattern
  says so.

### 2026-11-05 - Opening a sheet scrolled the list back to the top
- **Issue**: Opening a row's sheet (a category, an account, a transaction) far down a
  list jumped the page to the top, so closing it lost the place.
- **Root Cause**: Each sheet is its own route. With `scrollRestoration: true`, TanStack
  Router treats every navigation as a new page and scrolls to the top unless the link
  passes `resetScroll: false`.
- **Solution**: Every route that draws a `RouteSheet` sets `staticData: { sheet: true }`,
  and the router's `scrollRestoration` is a function that returns false when the target
  location matches one, so the scroll is left alone. Closing a sheet restores the list's
  position as before.
- **Prevention**: A new sheet route needs `staticData: { sheet: true }`; spec 02's Forms
  pattern says so.

### 2026-11-04 - Every dropdown opened with its first option highlighted
- **Issue**: Opening a `Combobox` (a merchant's default category, for one) showed the
  first option in purple, as if chosen, before anything was pressed.
- **Root Cause**: The keyboard highlight started on row 0 so Enter could pick it, even
  when the list was opened with the mouse or a tap.
- **Solution**: No highlight when the list opens. The arrows start it (Down at the top,
  Up at the bottom), typing puts it on the first match, and hovering highlights a row as
  in the menus.
- **Prevention**: A highlight means "Enter picks this"; show it only once the keyboard is
  in use.

### 2026-11-03 - New accounts and archive dates defaulted to tomorrow in the evening
- **Issue**: After 19:00 or 20:00 in Québec, a new account's opening date and the archive
  dialog's date showed the next day.
- **Root Cause**: "Today" was `new Date().toISOString().slice(0, 10)`, the UTC date, in two
  places. The archive dialog also kept the date from when the row first rendered.
- **Solution**: `todayIso()` in `lib/format.ts` reads the local date, with a test at
  23:30. The archive dialog sets the date each time it opens.
- **Prevention**: Never derive a calendar date from `toISOString()`; use `todayIso()`.

### 2026-11-02 - Sign-in failed everywhere: the email provider was switched off
- **Issue**: The right password was refused on localhost (and, after the same settings
  push, on the live site). The form said "invalid email or password".
- **Root Cause**: `config.toml` set `enable_signup = false` under `[auth.email]` as well as
  under `[auth]`. Under `[auth]` it closes new sign-ups; under `[auth.email]` it disables the
  email provider, so no account could sign in. `config push` applied it. The sign-in server
  function then reported every error as "invalid credentials", hiding the real code
  (`email_provider_disabled`).
- **Solution**: `[auth.email] enable_signup = true`, with a comment on what it controls.
  Sign-in now distinguishes wrong credentials, rate limiting and other errors, and logs the
  error code (never the email or password) for anything that is not wrong credentials.
- **Prevention**: Read what each Supabase setting toggles before pushing it; a key with the
  same name means different things in different sections. Do not collapse unexpected errors
  into a user-facing "wrong password": keep the anti-enumeration message for the one case
  that needs it, and log the rest.

---

## Format

### YYYY-MM-DD - Brief Bug Description
- **Issue**: What went wrong
- **Root Cause**: Why it happened
- **Solution**: How it was fixed
- **Prevention**: How to avoid it in the future
