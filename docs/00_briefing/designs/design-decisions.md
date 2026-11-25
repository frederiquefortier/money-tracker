# Design decisions

Screen and interaction calls, with who decided and why. The built screens are not specified here: the code is the spec. This keeps what the code cannot say, the reasons and the options turned down, so they are not proposed again. Shared conventions are in [02-screens.md](02-screens.md); structural choices are ADRs in [decisions.md](../../01_building/decisions.md); the story of each round is in [sessions.md](../../01_building/sessions.md).

Newest first inside each section.

## Navigation and layout

- **Three tabs until budgets are built: Dashboard, Transactions, Net worth** (2026-11-25). The Budget tab only showed a coming-soon card; it comes back with BUD-01. The dashboard is first since 2026-11-20; `/` still opens the transactions list. Everything set up once (categories, merchants, currencies, people, events, import) sits in the Réglages menu, a sheet from the left. Tab labels are one short word; "Dashboard" stays in French because "Tableau de bord" wraps.
- **Événements waits** (2026-11-24). The author removed the tab: the basic use case is complete without it. It is in commit 45a8260 and improvements.md; `event_totals` and `event_category_totals` stay.
- **Comparer answers "was this one expensive for its kind?"** (2026-11-23). One column per event in date order, its cost per day stacked by top-level category with their names under the chart, the type's mean as a named dashed line (the author chose the mean over the median), the rows under it holding the figures without a percent. Types as colour-dot tabs, newest first, only the year's events on Année, no cap on rows. Rejected: a bar inside each row, from a centre line or from zero (a bar per row is not a chart), dots over time, a table alone, the total as the default measure (it mostly measures length).
- **Événements is the year in review** (2026-11-23). The social figures live there (no Social tab), who owes me only (PPL-05), every month on Tout, the highlights as receipt slips, everyone on an expense counting for "Avec qui j'ai dépensé", an eye hiding single events listed under their type (hiding whole types was tried first), Événements par jour built on Dépenses par jour's component. The export waits for phase 6.
- **The transactions list links back to the dashboard** (2026-11-20). A list opened from a dashboard figure shows an arrow back to the period it came from, kept while filters change.
- **Net worth totals without cents** (2026-11-20). The headline, its change and average, and each group's total drop the cents, as the dashboard's totals; items keep theirs, being the figures typed.
- **Net worth on Tout: the change since the first figure, ×N and the average per year** (2026-11-19). "▲ X $ (56 %) par an depuis 2018" read unclear. The compounded percent per year was dropped: on a net worth built from savings it reads as a return. Item rows keep their per-year figures.
- **Net worth layout** (2026-11-18). From `xl`, the chart card and the list side by side; narrower, one 48rem column. Each control sits with what it acts on: the eye in the chart card, expand-all, grouping and sort over the list. Groups are cards with their header inside (the transactions' day-header look was tried for a day, and the archived toggle then read as a group). A row's actions sit behind one ⋮ at every width (five icons per holding crowded the row). The sparkline opens the item's chart, in place of a chevron.
- **Net worth: no composition card, no change legend** (2026-11-18). The composition's bars and group amounts repeated the list's totals, and the Actifs and Dettes figures that replaced it went too. The legend repeated the group colours the tooltip already names. A debt reads as owed, in red, 0 plain; a card in credit reads "+X $" in green under Dettes (a "-X" in red confused the author).
- **One net worth page** (2026-11-17, ADR-061). The hub already listed every item, so its two subpages (Comptes, Avoirs, ADR-046) merged into it, grouped Par type (the default) or Par institution for the monthly bank-by-bank update round. This also ended the one back link a page had (subpage to hub) and the holdings' grouping by institution only.
- **The net worth chart is the net worth alone, with what moved it** (2026-11-17). A stacked composition sized the axis to gross assets and debts, so the net worth's slope was flat and one large debt shaped the whole history. Now the line on its own scale with four to six round gridlines, change bars by year (by month on short ranges) split by group, and rows that open their own chart. Tried and replaced: a composition scrubbed with the pointer, a line per item (about twenty tangled lines), a Totaux / Détail toggle, legend chips with a change each, a "Sans n éléments" figure under the total, a custom month range. Rejected when chosen: a waterfall and a bare line. Gross assets and debts over time were given up.
- **One period for the whole hub** (2026-11-17). Tabs 1M, 3M, 6M, 1A, 3A, 5A, 10A, Tout set the chart and every change; a period menu beside range tabs read as two controls for one idea. 24 mois and 7 ans went to keep one line on a phone. Hiding items is an eye in the chart card (a filter chip was a pattern found nowhere else).
- **The transactions list follows the net worth hub** (2026-11-17). The hub's 12-column grid (the title at the far left, the filters on 3 columns, the list on 7), the period as tabs, the search on the tabs' row capped at 18rem, pending and owed under the tabs, one look for groups (the header above its card in Inconsolata with its total). Built then removed: a headline of the result's net, spent and received. Declined: monthly bars for the filtered set. On phones the + keeps no side gutter: a gutter would cost a fifth of every row.
- **Cents are smaller** (2026-11-12, reversing "amounts at one size" of 2026-11-05, which followed TravelSpend's opposite choice): in every amount drawn by `Money`, the decimal separator and the cents are 0.75em. Amounts written into a sentence stay plain text.
- **One control for a short choice: ChoiceField** (2026-11-12), the segmented toggle: a store or a person, a holding's nature, a category's need or want. It replaces the radios. Nothing chosen on a required choice turns the group red, with the message under it.
- **Placeholders are lighter and smaller** (2026-11-12): 60% of the muted text colour, 0.85em, in the mono font, so a suggestion never reads as a typed value.
- **A notice that is not an error is orange** (2026-11-12), based on #FF9300 (darker for the text), in the shape of the form's error message (`FormAlert` with `tone="warning"`). The author disliked amber, then found the first orange too red.
- **The transactions list has no holdings filter** (2026-11-12). The category filter does that job.
- **A drawer's total is as large as a transaction's amount** (2026-11-12): `text-lg`, semibold.
- **No helper text, legends or "(facultatif)"** (author's standing rule, 2026-11-12 for "(facultatif)"). A required field has its asterisk. If a field needs explaining, fix its label or layout. A reason something is unavailable goes in a toast on tap.
- **One column width, 48rem** (2026-11-11), for the lists and the transactions list alike (`pageColumn` in `styles.ts`). The lists were 40rem.
- **Amounts and currency codes are in Inconsolata** (2026-11-11), wherever they show. Amounts inside a translated sentence (a toast, a dialog) stay in the body face.
- **Status pills are round** (2026-11-11): `Tag` follows `EventTag`. Small inline highlights (combobox options, date segments) take the field radius.
- **One round + button bottom right on every screen that adds something** (2026-11-05), in place of buttons beside the title. A screen with several things to add fans them out.
- **No summary tiles on the transactions list** (2026-11-05). Spent-this-period belongs to the dashboard.
- **Sort and expand-all on pages only**, never inside a sheet or a list over a form (2026-11-05).
- **The mobile layout follows TravelSpend** (2026-11-02), with our own palette, type, icons and copy: a bottom tab bar, a round add button, category circles on rows, day groups with their total, a big amount with a currency chip on the form, outline tab icons filled when active, full width with side padding. Not adopted: spreading one expense across days (worth considering with budgets), Apple Pay import (native only), trips as the top-level container (events cover it), a dark theme toggle (the palette has dark tokens).

## Dates, period and filters

- **The transactions period is a row of tabs** (2026-11-17): 1M, 3M, 6M, 1A (rolling, as on the hub), Tout, and a calendar for any other range, which then names it. Month names and years ("Novembre", "2026") were tried first and read odd. The period left the filters: no sidebar row, no chip. The sidebar has no "Filtres" heading and shows each filter's count only; its Tout effacer shows only while something is chosen. The sheets' button reads "Voir les résultats", without the count. In the accounts filter, "Sans institution" comes last. Long filter lists build their rows as they near the screen, never an "Afficher plus" button.
- **Every date field uses the shared react-aria field and calendar** (ADR-028, 2026-11-09): typed segments (jj/mm/aaaa in both languages) and a calendar rising from the bottom of the sheet. Dropped first: native `<input type="date">` ("not cute") and shadcn's Calendar (react-day-picker cannot jump to a month or year directly).
- **The calendar's month and year are one picker** (2026-11-17): the arrows step month by month, and "novembre 2026" between them opens the months and the years side by side, as iOS's date input does. Replaced the M3 header's two separate lists (2026-11-13).
- **No scrolling row of filter bubbles** (2026-11-10): sideways scroll hides filters. Below `lg` one Filtres button lists the filters (two navigation levels). From `lg` up a sidebar left of the list (2026-11-16) shows that first level; a row opens the sheet on that filter alone, since category and people lists are too long to unfold in a sidebar.
- **Chips are always one per chosen value**, never merged into "Catégories · 5". A sidebar row or the Filtres button always shows its own name, with what is chosen or the count.
- **A filter with nothing to choose from is disabled**, found by a cheap existence query, not by loading its list. A tap says why in a toast.
- **Every sheet slides in from the right**, at every width; only the menu and the desktop filters sheet come from the left.
- **Groups in a sheet's check lists start folded** (2026-11-16), except a lone group, which starts open (2026-11-19). A search shows its matches as plain rows.
- Tried and rejected: one range calendar as the only period control (2026-11-10), the period as the filters sheet's first screen (2026-11-10), a row of bubbles per filter on desktop, a sidebar unfolding each filter's list inline, a popover per filter on desktop (left as an improvement), a year list as check rows, a twelve-year grid.

## Transactions

- **The form is one screen, not steps** (2026-11-04, after a step-by-step version was tried). A "receipt slip" with the amount, currency and category first, then the details.
- **No time of day** (2026-11-04). A transaction has a calendar date, so no time zone can move it.
- **Pending is blue and owed is amber, with no visible label** (the spreadsheet's colour for pending); a bubble names each and screen readers hear them. Pending wins on a row that is both.
- **Incomes are green, expenses the text colour, and red never marks an amount** (red means an error).
- **A transfer is one row though it is two legs**; its fees hang under it on the row's elbow line.
- **Converted amounts** show the booked amount muted under the display amount. That line is the marker: no ≈, no underline.
- **A merchant's default category fills the category** unless one was chosen by hand or the transaction has splits.
- **"Magasin" in French, "merchant" in the code and docs** (2026-11-04).

## Categories

- **Free colour, quick picks, automatic variation for sub-categories** (2026-11-03). A new top-level category takes the first quick pick no sibling of its kind uses. A sub-category follows a variation of its parent's colour until one is picked by hand. The icon is drawn white or a dark shade of the same hue, whichever passes 3:1.
- **Need or want is three choices** (2026-11-05): "Hérité ({value})" (follows the parent, stores nothing), Besoin, Envie. Tried first: a select, a pill with icons, chips, two buttons (which cannot show three states).
- **The transfer-fee category is a checkbox on one expense category** with an info popover (2026-11-05). Ticking it elsewhere takes the role over and moves existing fees.
- **Icons are coolicons, no emoji** (ADR-020). The icon follows the name until the user picks one by hand.
- **Favourite star removed** (2026-11-04); the picker's "Fréquentes" works out frequent categories from transactions (CAT-06).
- **A category pause**: archiving can take a "Réactivée le" date, for the years a category sat unused in the spreadsheet.

## People and reimbursements

- **A group is never a line on a transaction, only its members** (2026-11-05), so each person's part and debt stay their own.
- **Proche is the word in the interface** for a person.
- **An empty amount field means not known yet** and never blocks the save (2026-11-08).
- **Linking a reimbursement is done from the income only** (2026-11-05).
- **Repayments above the expense are allowed** (2026-11-11). A roommate paying two months at once is not a gift. Rejected: refusing it in the import check, or unlinking it.
- **No notifications** (2026-11-05). The amber "me doivent" bubble and the tag on a person's row are the reminders.
- **"With me" is a role and "bought from" a field on the transaction** (2026-11-11, ADR-040), after "this person is the shop" made no sense.

## Dashboard

- **A click opens only the part clicked** (2026-11-20): a bar its month and flow, a slice or stacked part its category, a day that day, a table row its category. A chart-wide click and band read as the whole chart.
- **Few legends** (2026-11-20). None under the stacked bars, the monthly chart or the heat map, and no weekday letters: the tooltip names each part, the summary names the colours, the cumulative lines are named where they end.
- **One card per side of the money, two ways to draw it** (2026-11-20). Dépenses beside Revenus, each split by need and want, group or category, drawn as stacked months or a donut with its list, both from one table so they always agree. Every series shows, without folding the smallest into Autres. Ranked bar lines were dropped. Categories without a transaction are hidden, with no toggle.
- **Every card at half width from `xl`** (2026-11-20). The week-column heat map shrank to dots there, so it became twelve month calendars.
- **Income is the headline, and no net worth on the dashboard** (2026-11-19). The full bar reads as income, cut into spent, invested and what remains. The net worth tile repeated the net worth page; its ×N moved there.
- **Colours mean one thing each** (2026-11-19): earned green, spent red, invested yellow, what remains pale lavender, in every card. The first version gave purple, orange and grey two meanings side by side.
- **Nothing reads as finished before it is** (2026-11-19). The month in progress is drawn lighter and never shaded as a deficit; a month without any transaction is flagged in a tag and shaded grey, and trends break over it instead of dropping to zero. The heat map steps at the year's quartiles, so one trip does not wash out every other day.
- **A year or everything** (2026-11-19). The last 6 and 12 months and a custom range were built and dropped: the table already shows them as columns.
- **The sheet's information, not its chart forms** (2026-11-19): every figure the sheet had, in forms that read better. The cumulative chart is two plain lines that stop at this month; the sheet's filled lines meant nothing.
- **Tried and rejected** (2026-11-18): a narrow column with a category tree carrying count, mean, median and change per category; it missed most of the sheet.

## Events

- **An event has no categories** (2026-11-09). It links every expense and income inside its dates; the author removes a link by hand, and that removal is remembered.
- **Event types have a name and a colour, no icon** (2026-11-09). The tag is a soft tinted pill, readable on any hex.
- **Dates are optional.** With none, the event links by hand only. The `auto_link` checkbox does the same for an event with dates (2026-11-11, ADR-042).
- **Tags were taken out of the plan** (2026-11-05): see improvements.md.

## Import

- **Two steps, not a files card or a drop zone only** (2026-11-10): a stepper after a Figma reference, a first step like a CSV upload dialog, "Téléverser" always visible, file icons in round badges, and a "big figures" summary with the files as one quiet line.
- **Before it is created, a new merchant, person or event can be merged, renamed (part sent to the note) or dropped** (2026-11-10). A merge keeps the old spelling as an alias.
- **Starting balances are imported**, not dropped; no row is silently discarded (2026-11-10).
- **Currencies the import names are created**, not refused.

## Accounts

- **Institutions are managed in Réglages** (2026-11-12, ADR-047). Accounts and holdings share them, and most holdings sit in other institutions than the accounts.
- **One account per currency for multi-currency providers** (Wise CAD, Wise EUR, under one institution). An account books in one currency (TRX-02), so balances stay exact; the `multi_currency` type was dropped.
- **A currency's favourite star removed** (2026-11-05): a user keeps a handful, so pinning saved nothing.
