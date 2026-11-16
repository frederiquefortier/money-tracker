# Design decisions

Screen and interaction calls, with who decided and why. The built screens are not specified here: the code is the spec. This keeps what the code cannot say, the reasons and the options turned down, so they are not proposed again. Shared conventions are in [02-screens.md](02-screens.md); structural choices are ADRs in [decisions.md](../../01_building/decisions.md).

Newest first inside each section.

## Navigation and layout

- **Cents are smaller** (2026-11-12): in every amount drawn by `Money`, the decimal separator and the cents are 0.75em. The author asked for it, reversing "Amounts at one size". Amounts written into a sentence stay plain text.
- **One control for a short choice: ChoiceField** (2026-11-12), the segmented toggle: a store or a person, a holding's nature, a category's need or want. It replaces the radios (`RadioGroupField` is gone). Nothing chosen on a required choice turns the group red, with the message under it. The author asked for one pattern; the need-or-want label "Comme {parent} ({value})" became "Hérité ({value})" so it fits.
- **Placeholders are lighter and smaller** (2026-11-12): 60% of the muted text colour, 0.85em, in the mono font, so a suggestion never reads as a typed value. The author asked for it.
- **A notice that is not an error is orange** (2026-11-12), based on #FF9300 (a darker shade of it for the text), in the shape of the form's error message (`FormAlert` with `tone="warning"`, as wide as its text): the "n transactions sans placement" link, which has a chevron and a darker tint on hover as it is a button. The author disliked amber, then found the first orange too red and gave #FF9300.
- **No "(facultatif)" on any field** (2026-11-12). A required field has its asterisk, and the others say nothing.
- **Holdings are grouped by institution, like accounts** (2026-11-12, was by kind). Institutions are shared and the author's holdings sit in few of them. The kind is a tag on the row; a drawer's total nets debts, as a credit card does in an accounts drawer, and a debt's value shows negative. The assistant recommended it when the author asked which was better.
- **The transactions list has no holdings filter** (2026-11-12). The category filter does that job. The author's call.
- **Four tabs: Transactions, Net worth, Dashboard, Budget** (2026-11-12, was Comptes since 2026-11-05). Net worth is a hub, and Comptes and Avoirs are its two subpages. Everything set up once (categories, merchants, currencies, people, events, import) sits in the Réglages menu, a sheet from the left. Tab labels are one short word; "Dashboard" stays in French because "Tableau de bord" wraps.
- **Net worth is a hub with two subpages, not one list** (2026-11-12). Accounts and holdings differ in their rows, actions and grouping, and a merged list blurs both. The hub carries the totals on its two link cards, in a layout that takes the phase 5 chart above them. The subpages show no total of their own. The author asked for it; ADR-046.
- **A page opened from a hub card has a link back to the hub** (2026-11-12). The earlier rule of no back link had no use case; this is the first. A tab or menu page has none, and sheets close instead.
- **One round + button bottom right on every screen that adds something** (2026-11-05), in place of buttons beside the title. A screen with several things to add fans them out as round icons.
- **No summary tiles on the transactions list** (2026-11-05). Spent-this-period belongs to the dashboard.
- **Amounts at one size** (2026-11-05). TravelSpend sets cents smaller; not kept. Reversed 2026-11-12: see "Cents are smaller".
- **No helper text, legends or "(facultatif)"** (author's standing rule). If a field needs explaining, fix its label or layout. A reason something is unavailable goes in a toast on tap.
- **One column width, 48rem** (2026-11-11), for the lists and the transactions list alike (`pageColumn` in `styles.ts`). The lists were 40rem.
- **Amounts and currency codes are in Inconsolata** (2026-11-11), wherever they show: `Money`, `CurrencyCode`, the typed amounts on the receipt slip and the opening balance field. Amounts inside a translated sentence (a toast, a dialog) stay in the body face.
- **Status pills are round** (2026-11-11): `Tag` follows `EventTag`. Small inline highlights (combobox options, date segments) take the field radius.
- **Sort and expand-all on pages only**, never inside a sheet or a list over a form (2026-11-05).

## Dates, period and filters

Dates went through four rounds in November 2026. The result:

- **Every date field uses the shared react-aria field and calendar** (ADR-028 as first written, 2026-11-09): typed segments (jj/mm/aaaa in both languages) and a calendar rising from the bottom of the sheet. History: native `<input type="date">` (2026-11-05) was "not cute"; shadcn's Calendar (react-day-picker) was built and dropped the same day because it cannot jump to a month or year directly; the author then wanted one look for single dates and ranges, hence react-aria.
- **The calendar's header follows the M3 date picker** (2026-11-13): one pair of arrows steps month by month, and between them the month and the year each open a list in place of the grid. The author wanted to jump straight to a month or a year. Every calendar has it, the period's included.
- **The transactions period is one range calendar and nothing else** (2026-11-10). No year list, month grid, tabs or ‹ › stepping: three pickers for one job. An old address carrying a month or year still reads. "Tout" (the whole history) is the default and what Effacer returns to, not a tab. A pick applies at once and the sheet stays open; the footer's "Voir N résultats" closes it.
- **The period lives in the filters' sheet** (2026-11-10), as its first screen on phones and the first row of the desktop sidebar. One place for everything that narrows the list.
- **No scrolling row of filter bubbles** (2026-11-10): sideways scroll hides filters. Below `lg` one Filtres button lists the filters (two navigation levels). From `lg` up a sidebar left of the list (2026-11-16, after the setproduct sidebar template) shows that first level, always in view: each filter with what is chosen and Tout effacer; a row opens the sheet on that filter alone. Category and people lists are too long to unfold in a sidebar, so they stay in the sheet with its search.
- **Chips are always one per chosen value**, never merged into "Catégories · 5". A sidebar row or the Filtres button always shows its own name, with what is chosen or the count.
- **A filter with nothing to choose from is disabled**, found by a cheap existence query, not by loading its list.
- **Every sheet slides in from the right**, at every width; only the menu and the desktop filters sheet (beside the sidebar, 2026-11-16) come from the left.
- **Groups in a sheet's check lists start folded** (2026-11-16): institutions, category types, people groups and events alike. A search shows its matches as plain rows.
- Tried and rejected: a row of bubbles per filter on desktop (replaced by the sidebar, 2026-11-16); a sidebar unfolding each filter's list inline (built and dropped the same day, the lists being too long); popover per filter on desktop (the sheet already holds search, grouped lists and the count; left as an improvement), year list as check rows with a second click clearing, a twelve-year grid.

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
- **Need or want is three choices** (2026-11-05; radios then, a ChoiceField since 2026-11-12): "Hérité ({value})" (follows the parent, stores nothing; was "Comme {parent} ({value})"), Besoin, Envie. Tried first: a select, a pill with icons, chips, then two buttons; two buttons cannot show three states.
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

- **A drawer's total is as large as a transaction's amount** (2026-11-12): `text-lg`, semibold, on the accounts and the holdings drawers and on their rows. The author asked for it; "Amounts at one size" stays for the rest.
- **Institutions are managed in Réglages, not on the accounts page** (2026-11-12). Accounts and holdings share them, and most holdings sit in other institutions than the accounts, so the accounts page showed empty groups and could offer a delete the database refused. The accounts page groups only institutions with an open account. The author asked for it; ADR-047.
- **One account per currency for multi-currency providers** (Wise CAD, Wise EUR, grouped under one institution). Each balance has its own statement and an account books in one currency (TRX-02), so balances stay exact. The `multi_currency` account type was dropped. Moving between balances is a transfer; paying in euros from CAD is an expense with an original price (CUR-08).
- **A currency's favourite star removed** (2026-11-05): a user keeps a handful, so pinning saved nothing.
- **Removing a currency never changes a transaction or account**; it leaves pickers only. An open account blocks it; the default cannot be removed. Adding it back skips the rate check (`removed_at`).
