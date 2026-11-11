# Design decisions

Screen and interaction calls, with who decided and why. The built screens are not specified here: the code is the spec. This keeps what the code cannot say, the reasons and the options turned down, so they are not proposed again. Shared conventions are in [02-screens.md](02-screens.md); structural choices are ADRs in [decisions.md](../../01_building/decisions.md).

Newest first inside each section.

## Navigation and layout

- **Four tabs: Transactions, Comptes, Dashboard, Budget** (2026-11-05). Comptes is a tab because it shows balances. Everything set up once (categories, merchants, currencies, people, events, import) sits in the Réglages menu, a sheet from the left. Tab labels are one short word; "Dashboard" stays in French because "Tableau de bord" wraps.
- **One round + button bottom right on every screen that adds something** (2026-11-05), in place of buttons beside the title. A screen with several things to add fans them out as round icons.
- **No summary tiles on the transactions list** (2026-11-05). Spent-this-period belongs to the dashboard.
- **Amounts at one size** (2026-11-05). TravelSpend sets cents smaller; not kept.
- **No helper text, legends or "(facultatif)"** (author's standing rule). If a field needs explaining, fix its label or layout. A reason something is unavailable goes in a toast on tap.
- **Sort and expand-all on pages only**, never inside a sheet or a list over a form (2026-11-05).

## Dates, period and filters

Dates went through four rounds in November 2026. The result:

- **Every date field uses the shared react-aria field and calendar** (ADR-028 as first written, 2026-11-09): typed segments (jj/mm/aaaa in both languages) and a calendar rising from the bottom of the sheet. History: native `<input type="date">` (2026-11-05) was "not cute"; shadcn's Calendar (react-day-picker) was built and dropped the same day because it cannot jump to a month or year directly; the author then wanted one look for single dates and ranges, hence react-aria.
- **The transactions period is one range calendar and nothing else** (2026-11-10). No year list, month grid, tabs or ‹ › stepping: three pickers for one job. An old address carrying a month or year still reads. "Tout" (the whole history) is the default and what Effacer returns to, not a tab. A pick applies at once and the sheet stays open; the footer's "Voir N résultats" closes it.
- **The period lives in the filters' sheet** (2026-11-10), as its first screen on phones and as the "Dates" bubble opening that screen on desktop. One place for everything that narrows the list.
- **No scrolling row of filter bubbles** (2026-11-10): sideways scroll hides filters. On phones one Filtres button lists the filters (two navigation levels); from `md` up each bubble opens the sheet on that filter alone.
- **Chips are always one per chosen value**, never merged into "Catégories · 5". A bubble always shows its own name, with the count after it.
- **A filter with nothing to choose from is disabled**, found by a cheap existence query, not by loading its list.
- **Every sheet slides in from the right**, at every width; only the menu comes from the left.
- Tried and rejected: popover per filter on desktop (the sheet already holds search, grouped lists and the count; left as an improvement), year list as check rows with a second click clearing, a twelve-year grid.

## Transactions

- **The form is one screen, not steps** (2026-11-04, after a step-by-step version was tried). A "receipt slip" with the amount, currency and category first, then the details.
- **No time of day** (2026-11-04). A transaction has a calendar date, so no time zone can move it.
- **Pending is blue and owed is amber, with no visible label** (the spreadsheet's colour for pending); a bubble names each and screen readers hear them. Pending wins on a row that is both.
- **Incomes are green, expenses the text colour, and red never marks an amount** (red means an error).
- **A transfer is one row though it is two legs**; its fees hang under it on the row's elbow line, drawn apart from the amounts.
- **Converted amounts** show the booked amount muted under the display amount. That line is the marker: no ≈, no underline.
- **A merchant's default category fills the category** unless one was chosen by hand or the transaction has splits.
- **"Magasin" in French, "merchant" in the code and docs** (2026-11-04).

## Categories

- **Free colour, quick picks, automatic variation for sub-categories** (2026-11-03). A new top-level category takes the first quick pick no sibling-level category of its kind uses. A sub-category starts from a variation of its parent's colour and follows it until a colour is picked by hand. The icon is drawn white or a dark shade of the same hue, whichever passes 3:1.
- **Need or want is three radios** (2026-11-05): "Comme {parent} ({value})" (follows the parent, stores nothing), Besoin, Envie. Tried first: a select, a pill with icons, chips, then two buttons; two buttons cannot show three states.
- **The transfer-fee category is a checkbox on one expense category** with an info popover (2026-11-05). One category holds the role; ticking it elsewhere takes it over and moves existing fees.
- **Icons are coolicons, no emoji** (ADR-020). The icon follows the name until the user picks one by hand.
- **Favourite star removed** (2026-11-04); the picker's "Fréquentes" works out frequent categories from transactions (CAT-06).
- **A category pause**: archiving can take a "Réactivée le" date, for the years a category sat unused in the spreadsheet.

## People and reimbursements

- **A group is never a line on a transaction, only its members** (2026-11-05), so each person's part and debt stay their own.
- **Proche is the word in the interface** for a person.
- **An empty amount field means not known yet** and never blocks the save (2026-11-08). The reimbursement sets an unknown part.
- **Linking a reimbursement is done from the income only** (2026-11-05). The first linked line gives the income its expense's category, as a refund.
- **Repayments above the expense are allowed** (2026-11-11). A roommate paying two months at once is not a gift; the income keeps its category and that category's total can go below zero. Rejected: refusing it in the import check, or unlinking it.
- **No notifications** (2026-11-05). The amber "me doivent" bubble and the tag on a person's row are the reminders.
- **"With me" is a role and "bought from" a field on the transaction** (2026-11-11, ADR-040), after "this person is the shop" made no sense.

## Events

- **An event has no categories** (2026-11-09). It links every expense and income inside its dates; the author removes a link by hand from a transaction that does not belong, and that removal is remembered.
- **Event types have a name and a colour, no icon** (2026-11-09). The tag is a soft tinted pill, readable on any hex.
- **Dates are optional.** With none, the event links by hand only. The `auto_link` checkbox does the same for an event with dates (2026-11-11, ADR-042).
- **Tags were taken out of the plan** (2026-11-05): see improvements.md.

## Import

- **Steps, not a files card or a drop zone only** (2026-11-10). Then, after seeing it: two steps (the check is not one), a stepper after a Figma reference, a first step like a CSV upload dialog, "Téléverser" always visible, file icons in round badges without a check mark, and a "big figures" summary with the files as one quiet line.
- **Before it is created, a new merchant, person or event can be merged, renamed (part sent to the note) or dropped** (2026-11-10). A merge keeps the old spelling as an alias.
- **Starting balances are imported**, not dropped; no row is silently discarded (2026-11-10).
- **Currencies the import names are created**, not refused.

## Accounts

- **One account per currency for multi-currency providers** (Wise CAD, Wise EUR, grouped under one institution). Each balance has its own statement and an account books in one currency (TRX-02), so balances stay exact. The `multi_currency` account type was dropped. Moving between balances is a transfer; paying in euros from CAD is an expense with an original price (CUR-08).
- **A currency's favourite star removed** (2026-11-05): a user keeps a handful, so pinning saved nothing.
- **Removing a currency never changes a transaction or account**; it leaves pickers only. An open account blocks it; the default cannot be removed. Adding it back skips the rate check (`removed_at`).
