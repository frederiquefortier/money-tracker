# Requirements

The organized feature list. It merges its sources and removes the duplicates between them:

| Tag | Source |
|---|---|
| `v1` | [01-app-v1.md](notes/01-app-v1.md), the first full list, plus the loose MISC notes |
| `ai` | [02-app-v-ai.md](notes/02-app-v-ai.md), the revised list. **Baseline when the two disagree.** |
| `add`, `C1`..`C11` | Feedback from testing the first prototype (built on Lovable, February 2026, see [brief.md](brief.md)) and the detailed correction prompts written from it. The notes were removed once their content was in the rows below. |
| `sheet` | Something the current spreadsheets do that the notes never mention ([reference-sheets.md](reference-sheets.md)) |

Each requirement has a stable ID (`ACC-03`) so ADRs, issues and commits can point at it.
**Phase** refers to [roadmap.md](../03_planning/roadmap.md). **v1 is phases 0 to 4**: the
point where the spreadsheet can be retired. Phase 5 is v2, phase 6 is v3, and
`later` is tracked in [improvements.md](../03_planning/improvements.md). The UI ships in French and
English; this file is in English like every other meta-doc.

---

## 1. Onboarding and settings (`SET`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| SET-01 | A new user is walked through choosing a language and a default currency (both required), then creating their first accounts and categories (each can wait). No starter category set in v1. | v1 | 1 |
| SET-02 | Birth date (drives the age-based account recommendations in `LOC`). | v1 | later |
| SET-03 | Home country, used for "local purchase" stats and for which region pack applies. | v1, inferred | later |
| SET-04 | The interface is available in French and English, nothing regional (ADR-019). Dates and amounts use Canadian conventions in either language ("15 janvier 2024", "1 234,50 $" / "January 15, 2024", "$1,234.50"). | C10, brief | 0 |
| SET-05 | The language is chosen at onboarding (defaulting to the browser's), saved on the profile, and switchable from any page. | brief | 0 |
| SET-06 | Reference labels (account and holding types, currency names) exist in both languages. What the user types (their own category names, merchants, notes) is stored as typed and never translated. | brief | 1 |
| SET-07 | Forms validate in the interface language: inline messages under each field on submit and when leaving a field, shared rules with the server (one Zod schema each), typed values kept after a failed submit, and focus on the first invalid field after a failed submit. Required fields carry an asterisk. Password fields have a show/hide button. | author | 0 |

## 2. Accounts and institutions (`ACC`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| ACC-01 | An account has a name, a type, an optional institution and a currency. A multi-currency balance (Wise) is one account per currency. | v1, ai, C6 | 1 |
| ACC-02 | Creating an account records its opening balance and date. | v1, ai | 1 |
| ACC-03 | An account can be closed (keeps history, gone from pickers). | v1, ai | 1 |
| ACC-04 | An account can be hidden from new transactions without being closed. | v1 | 1 |
| ACC-05 | Institutions are reusable records with a name and an optional website URL. CRUD, inline "create" from the account form. | add, C1 | 1 |
| ACC-06 | The accounts page groups accounts by institution: collapsible sections, institution name links to its site, per-institution balance total. | add, C1 | 1 |
| ACC-07 | Sort accounts within each group by name, type, currency, balance ascending, balance descending. The choice persists per browser. | add, C2 | 1 |
| ACC-08 | Each account shows when it was last reconciled and when its last transaction was. | sheet | 4 |

## 3. Transactions (`TRX`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| TRX-01 | Add an expense or an income, with a date. A calendar date only, no time: a date typed as 17.08.2026 reads 17.08.2026 everywhere, never shifted by a time zone. The optional time was dropped on 2026-11-04. | v1, ai, misc | 1 |
| TRX-02 | Currency is required on every transaction, prefilled from the account. The amount booked is always in the account's currency; choosing another currency records it as the original price (CUR-08). | add, C6 | 1 |
| TRX-03 | Balance adjustment: set an account to a known balance; the app records the difference. | v1, ai | 1 |
| TRX-04 | Transfer between two accounts. Optional fee, recorded as an expense on the source account in the category chosen once in settings. Edit and delete act on all legs together, with a confirmation before delete. List shows "Transfert: A → B". | add, C5 | 1 |
| TRX-05 | A transaction can be linked to a merchant. | v1, ai | 1 |
| TRX-06 | Split a transaction across several categories by amount, share or percentage. | v1, ai | 1 |
| TRX-07 | Link an income to an expense as its reimbursement: from the income, to the lines of its source who owe me, which can be an amount not known yet that the reimbursement sets. The income takes the expense's category by default. | v1, ai, author | 2 |
| TRX-08 | Recurring transactions. Changing the amount keeps the old amount and the change date as history. The recurrence can be stopped. | v1, ai | 4 |
| TRX-09 | Status: pending or cleared, so a pending card charge does not count as reconciled. Pending rows stand out in the list (blue, as in the spreadsheet) and can be listed alone. | sheet | 1 |
| TRX-10 | A transaction can carry a free-text note (the memo). | sheet | 1 |
| TRX-11 | A transfer between accounts in different currencies records what left one and what arrived in the other; the gap against that day's market rate shows as the conversion cost, which counts as spending. | net-worth data (CAD to CHF) | 1 |
| TRX-12 | Search transactions by text in anything a row shows: merchant, note, categories, account and institution (both sides of a transfer), ignoring case and accents. | author | 1 |
| TRX-13 | The transactions list shows a chosen period: everything (loaded as you scroll), a year, a month, or custom days from a start to an end. Each day shows its net. Totals by category belong to the dashboard. | author | 1 |
| TRX-14 | Filter the transactions list by accounts, categories (sub-categories included, a split matching on any of its categories) and merchants, several of each at once. | author | 1 |

## 4. Multi-currency (`CUR`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| CUR-01 | Each user has a list of usable currencies. Defaults, sorted alphabetically: CAD, CHF, EUR, GBP, USD. | ai, C3 | 1 |
| CUR-02 | Adding a currency validates it against HexaRate. If the provider is down, adding fails with a retry; existing currencies keep working. | ai, add, C3 | 1 |
| CUR-03 | Currency pickers list the user's currencies by code; they are searchable and show "CODE - Nom" and the symbol. (Favourites were dropped on 2026-11-05: a user keeps a handful of currencies, so pinning saved nothing.) | v1, ai, C3 | 1 |
| CUR-04 | Removing a currency in use asks for confirmation and names how many transactions use it. The default currency and a currency used by an open account cannot be removed. Adding a removed currency back skips the HexaRate check. | C3 | 1 |
| CUR-05 | A default currency, used to prefill forms. | ai | 1 |
| CUR-06 | A display currency switchable from any page (header dropdown, like a language switcher). Every amount re-renders in it. | ai, add, C4 | 1 |
| CUR-07 | Conversion uses the rate on the transaction date, or today's rate when the amount has no date. An amount already in the display currency is never converted. | v1, ai | 1 |
| CUR-08 | A foreign-currency transaction has two editable fields, original price and price paid, and a read-only fee: the gap between what was paid and the market rate that day. The fee counts as spending in the fee category, the purchase's categories keeping its market value. | v1, ai | 1 |
| CUR-09 | It is always clear which amounts were converted. A converted amount shows its original amount and currency under it; the rate used is one hover or tap away. Native amounts show plain. Totals that mix both say so, except a day's net in the transactions list (decided 2026-11-05). | Q1 answer | 1 |

## 5. Categories (`CAT`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| CAT-01 | Categories nest with no depth limit. | v1, ai | 1 |
| CAT-02 | A category has a kind: expense (default), income, or investment. | v1, ai | 1 |
| CAT-03 | Archive a category from a chosen date; reactivate from a chosen date. A past archived period (two dates) can be added afterwards, from the archive action. The full history is viewable as a timeline. Archiving a parent archives its branch; reactivating a sub-category reactivates its archived parents from the same date. | v1, ai, add, C10 | 1 |
| CAT-04 | Archived categories are absent from every picker. Editing an old transaction still shows its archived category with a badge and lets you change it. | add, C8 | 1 |
| CAT-05 | The category page shows active categories first and archived ones in a collapsed section with a count and "archivée depuis [date]", drawn as a tree. | add, C9 | 1 |
| CAT-06 | The picker starts with a "Fréquents" group (first "Fréquentes", then "Fréquemment utilisées", "Fréquents" since 2026-11-05): the most used categories of the transaction's type, worked out from recent transactions and shown as "Parent > Enfant". They also keep their place in the tree below, which lists categories as the category page draws them. Hand-picked favourites were dropped on 2026-11-04. | v1, ai, add, C7, author | 1 (with the transaction form) |
| CAT-07 | A category has a coolicons icon, chosen in a searchable picker of a curated subset of the set (ADR-020). A default is suggested from the name; picking the suggested icon returns to it. Each category has its own colour, chosen freely; a sub-category starts from a variation of its parent's colour. | v1, ai, add, C11 | 1 |
| CAT-08 | A category can be excluded from the emergency-fund calculation. | v1, ai | 4 |
| CAT-09 | The category tree sorts by name or by colour (rainbow order), kept per browser. One button opens or closes every branch, in every tab. A search filters the open tab by name, keeping each match's parents. | author | 1 |
| CAT-10 | An expense category can be marked a need or a want. A sub-category with no mark follows its nearest marked parent and can set its own (Santé a need, Massothérapie a want). A category with no mark anywhere up its branch is unclassified. Income categories have no mark; investment categories count as savings. | author | 1 |

## 6. Merchants (`MER`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| MER-01 | A merchant can have a default category, prefilled on new transactions. | v1, ai | 1 |
| MER-02 | A merchant has aliases, other spellings of its name, so an import finds it by name or alias. A merge (MER-05) and an import merge keep the source's name and aliases as aliases of the target. Built 2026-11-10; the merchant form edits them (2026-11-11). The list does not show them. | v1, ai | 3 |
| MER-07 | ~~A merchant can be a person.~~ Replaced on 2026-11-11 by PPL-09: the seller is a person field on the transaction, and the merchant has no person (ADR-040, which supersedes ADR-038). | author | 3 |
| MER-03 | A merchant has a country of origin. | v1 | later |
| MER-04 | For one merchant, see how the bill has changed over time, in percent. | v1, ai | 4 |
| MER-06 | The merchant list sorts by name (A–Z, Z–A) or by category, kept per browser, and filters by default category (a parent keeps its branch) or none. | author | 1 |
| MER-05 | Merge two merchants: the transactions of one move to the other, which keeps its name and default category; the source's name becomes an alias (MER-02). | author | 1 |

## 7. Tags (`TAG`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| TAG-01 | Create tags; a transaction can have several. Dropped 2026-11-05: events cover it (see improvements.md). | v1, ai | dropped |
| TAG-02 | Automatic linking by date range and categories moved to events (EVT-07) on 2026-11-05. | ai | dropped |
| TAG-03 | Per tag: most and least expensive transactions. | misc ("Tag + expensive, less expensive") | dropped |

## 8. People and groups (`PPL`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| PPL-01 | People have a name and, for now, its first letter as their icon; they can be grouped, and a group shows its members' avatars. | v1, ai, author | 2 |
| PPL-02 | A person or a group can be archived and hidden. | ai | 2 |
| PPL-03 | An expense can be linked to people or groups (a group adds its members), each in a role: invited (I paid for them, the default) or owes (they will pay me back), beside my own part. Their part is set by amount, share or percentage. An income names the one person it came from. | v1, ai, author | 2 |
| PPL-04 | Without naming anyone: tick "I treated someone" with an amount and a head count, or "I expect a reimbursement" with an amount. | v1 | 2 |
| PPL-05 | What each person owes me, at a glance: on their row and in their sheet, and the owed bubble on Transactions. Money I owe others is out of scope. | misc, author | 2 |
| PPL-06 | A person can have aliases, other spellings of their name, so the import finds them by name or alias, ignoring case and accents. A name or an alias points to one person only. | author | 2 |
| PPL-07 | Merge two people: the source's transaction lines, group memberships and event links move to the other, which keeps its name; the source's name and aliases become aliases of it (PPL-06). Refused when both are on one transaction. Built 2026-11-11. | author | 2 |
| PPL-08 | A person can be with me on an expense without sharing its cost: a third role, "With me" (Avec moi), beside invited and owes. It has no part and no amount, never changes the others' parts, shows on the transaction, in the Proches filter and on the person's page. Not on an income, and not on a line without a name. Built 2026-11-11 (ADR-040). | author | 2 |
| PPL-09 | An expense can name who it was bought from, a person field beside the merchant ("Acheté chez"), alone or together with a shop ("Maman, via Amazon"). Expenses only. Searched and filtered like the people on it. The import sets it from a merchant text that is a person's name or alias. Built 2026-11-11 (ADR-040). | author | 2 |

## 9. Events (`EVT`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| EVT-01 | User-defined event types, each with a name and a colour. | ai, author | 2 |
| EVT-02 | An event has a name, optional dates (one day or a range), an optional type and optional people. | v1, ai | 2 |
| EVT-03 | Transactions can be linked to an event, by hand or automatically (EVT-07). The event shows as a tag on the transaction. | v1, ai, author | 2 |
| EVT-04 | Calendar view of events with the total spent on each. | v1, ai | 2 |
| EVT-05 | Compare events of the same type. | ai | 2 |
| EVT-06 | Give an event a budget and follow it live. Moved to phase 4 with the other budgets, built once on the shared `budgets` table (author, 2026-11-08). | ai, author | 4 |
| EVT-07 | In its dates, an event attaches itself to every expense and income (no categories: removed 2026-11-09, the author prefers the tag taken off by hand). With no dates, only by hand. Automatic links are marked as such and can be removed or changed by hand; a removed one stays removed. An event can turn the automatic link off (2026-11-11, ADR-042): it then holds only the transactions linked by hand, and its automatic links are removed. | ai (was TAG-02), author | 2 |

## 10. Dashboard and reports (`DSH`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| DSH-01 | Date range picker: a calendar year, last 12 months, last 6 months, custom. | v1, ai | 4 |
| DSH-02 | Filter by date, category, sub-category and tag. List or chart view of the same data. | v1, ai | 4 |
| DSH-03 | An archived category is hidden from charts when the range does not overlap its active period. | v1, ai | 4 |
| DSH-04 | Per category: count, total, mean and median for the period, and the change versus the previous period in percent. | v1, ai | 4 |
| DSH-05 | Expenses waiting for a reimbursement are highlighted. A reimbursed expense shows its net amount. | v1, ai | 4 |
| DSH-06 | Header tiles: total available, spent this month, invested this month, pending count. | sheet | 4 |
| DSH-07 | Category ranking by spend over the range. | sheet | 4 |
| DSH-08 | Year view and month view. | misc | 4 |
| DSH-09 | Needs, wants and savings over the range: expenses by their need or want mark (CAT-10), unclassified ones apart, and investments as savings, in amounts and as shares of income. | author | 4 |

## 11. Budget (`BUD`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| BUD-01 | Per category and date range: an amount ceiling or target. | v1, ai | 4 |
| BUD-02 | Per category and date range: a transaction-count ceiling or target. | v1, ai | 4 |
| BUD-03 | Expected monthly income. | v1, ai | 4 |
| BUD-04 | Emergency fund: target in months, the account that holds it, the categories it covers. Shows progress, or how many months the account already covers. | v1, ai | 4 |
| BUD-05 | A celebration animation when savings and investment goals are reached. | ai | later |
| BUD-06 | Budget tooltips can be turned off. | v1, ai | 4 |
| BUD-07 | Scenario budgets: compare a monthly budget across places (rent, transport, deductions) against a gross salary, as a share of income. | sheet (Prévision budgétaire), misc ("Projections comme suisse") | later |

## 12. Net worth (`NW`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| NW-01 | Holdings: investment accounts, debts and other assets, each with a type (TFSA/CELI, RRSP/REER, FHSA/CELIAPP, DPSP, 2nd pillar, 3a, life-insurance buyout...) and an institution and country. | v1, ai | 2 |
| NW-02 | Dated value snapshots per holding. Months with no snapshot can be hidden in charts. | v1, ai | 5 |
| NW-03 | Contributions per holding, split between my money (transactions linked to the holding) and employer or other money (entered on the holding). Shows amount placed and profit in amount and percent. | v1, ai, net-worth data | 2, 5 |
| NW-04 | Net worth chart (total, investments, debts) and percent change over any range; default is account start to today. | v1, ai | 5 |
| NW-05 | A holding can be excluded from the net worth total (the life insurance "with/without" line). | net-worth data | 5 |
| NW-06 | Projections at fixed growth rates (5, 7, 10 %) or custom inputs. | v1, ai | later |
| NW-07 | Goal solver: "to reach X in N years at r %, invest Y per year", with r defaulting to my actual return. | v1, ai | later |
| NW-08 | "If this continues, in N years I'll have X." | v1, ai | later |
| NW-09 | Income by job: salary per employer per year, with a total. | misc ("Séparé par emploi..."), net-worth data | 5 |

## 13. Yearly review (`YR`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| YR-01 | Toggle between a money view and a social view. | ai, misc | 6 |
| YR-02 | Layout: a timeline with sticky months on the left, a calendar on the right that scrolls with it. | ai, misc | 6 |
| YR-03 | Top 3 most expensive days. | ai | 6 |
| YR-04 | Who I spent the most with, the least with, and who I shared the most events with. | ai, misc | 6 |
| YR-05 | Who owes me and whom I owe, at a glance. | ai | 6 |
| YR-06 | Share of purchases made at local merchants. | v1 | later |
| YR-07 | Export the review as charts in several formats. | ai | 6 |

## 14. Region packs (`LOC`)

The "Canada" section, generalised because the data already spans Canada and Switzerland.

| ID | Requirement | Source | Phase |
|---|---|---|---|
| LOC-01 | Account-type recommendations by age and country (TFSA/RRSP/FHSA in Canada; pillars 2 and 3a in Switzerland). | v1 | later |
| LOC-02 | Region packs are data (account types, recommendations), not code branches. | inferred | later |

## 15. Import (`IMP`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| IMP-01 | Import from one fixed, documented CSV format: accounts, transactions, splits, and optionally people lines (roles, head counts, reimbursement links) and aliases. The user prepares their data beforehand. See [import.md](../01_building/import.md). | sheet, ADR-010, ADR-033 | 3 |
| IMP-02 | Net-worth history through the same format (optional holdings and snapshots files). | net-worth data | 5 |
| IMP-03 | Import from a source in its own format (a bank CSV), with column mapping and saved source profiles. The author's own import is the fixed format (IMP-01), with the conversion done outside the app; what the "wizard" was meant to add for the first import (alias matching, merges, suggested pairs) is IMP-06 and MER-02, so this is only for other sources. | v1 misc ("Csv importer visual"), author 2026-11-10 | later |
| IMP-04 | Export my data in the import format; export then import reproduces it. This is the export half of SEC-04. | ADR-010, SEC-04 | 3 |
| IMP-05 | Each import is one all-or-nothing batch that can be undone in one action. Re-importing a row with a known `ref` is skipped. | ADR-010 | 3 |
| IMP-06 | Anything an import names that does not exist yet is created: currencies, accounts, institutions, categories, merchants, people and events. Before it commits, each new category, merchant, person and event can be merged into another name, and each new merchant, person and event can be edited (another name, or none, with some of its text sent to the note) or removed. The choices apply to that import only, but a merge of a merchant or person is kept as an alias (MER-02, PPL-06). | author, ADR-033, ADR-037 | 3 |

## 16. Demo and portfolio (`DEM`)

Deferred: the app stays private, and a demo matters only if another user joins.

| ID | Requirement | Source | Phase |
|---|---|---|---|
| DEM-01 | A public demo deployment on its own Supabase project, holding invented data only. MFA is relaxed there and only there, by a separate policy migration, and the demo banner says so. | portfolio | later |
| DEM-02 | A demo-data generator: a fictional person with several years of multi-currency spending (one move between countries), transfers, splits, budgets. Deterministic, so screenshots are reproducible. It writes files in the import format, loaded into a demo account. | portfolio | later |

## 17. Security and accounts (`SEC`)

Not in the notes, required by the brief. Details in [security.md](../01_building/security.md).

| ID | Requirement | Source | Phase |
|---|---|---|---|
| SEC-01 | Multiple users, each seeing only their own data, enforced in the database. | brief | 0 |
| SEC-02 | Sign-up closed while the app is private; accounts by invitation. The invite email leads to a page that sets the password, then to MFA enrolment. A password change sends a notification email. | brief | 0 |
| SEC-03 | TOTP two-factor authentication, required to read financial data. | brief | 0 |
| SEC-04 | Full export of a user's data in an open format (IMP-04, phase 3), and full account deletion (phase 4). | brief | 3, 4 |
| SEC-05 | Password reset by email, through the same landing page as invitations. If the account has TOTP, the code is required before the new password is saved. | brief | 0 |

---

## How the sources were reconciled

- **Display currency vs. base currency.** v1 had one base currency per date range and
  converted everything into it. `ai` and C4 replaced that with a display currency the user
  can switch at any time. Kept: the display currency only (CUR-06), with conversion at the
  transaction date (CUR-07). The v1 base-currency history is dropped (Q1); CUR-09 makes up
  for it by marking which amounts were converted.
- **"Favourite" vs. "default" currencies.** C3 marks the five starting currencies
  `is_default`; `ai` also has favourites. They are two different flags: default means "came
  with the account", favourite means "pin to top". Favourites were dropped on 2026-11-05
  (CUR-03).
- **Transfers.** C5 stores a transfer as two transactions pointing at each other. The schema
  uses a shared `transfer_id` on the legs instead; same behaviour, no circular foreign keys.
  See [database.md](../01_building/database.md).
- **Transfer fee category.** C5 auto-created "Frais bancaires". With categories built by the
  user, the fee category is a setting instead (`profiles.transfer_fee_category_id`).
- **Category icons.** C11 asks for an emoji picker in Google's style. Replaced by coolicons,
  the set the logo comes from, so the interface has one visual language (ADR-020).
- **"Canada"** became region packs (`LOC`), since 2026 data is Swiss.
- **Tags and events.** Both could hold a trip: a tag with a date range and categories, or
  an event. On 2026-11-05 the author kept events, the more defined idea, gave them the
  automatic linking (EVT-07) and shows the event as a tag on the transaction. Tags moved
  to later.
- **v1 "account hidden for future transactions"** was dropped from `ai`, probably by
  accident. Kept as ACC-04; delete it if the drop was deliberate.
- **v1 "anonymous" treat/reimbursement** (PPL-04) was also dropped from `ai`. Kept for the
  same reason.

## Resolved questions

- **Q1. Home currency over time** (2026-10-27): no. The display currency is enough. An
  amount already in the display currency is shown as is, and converted amounts are marked
  (CUR-07, CUR-09).
- **Q2. Rates provider** (2026-10-27): HexaRate validates a currency when it is added;
  Frankfurter (ECB reference rates) provides the historical rates for conversion. See
  ADR-009 for currencies outside the ECB list.
- **Q3. "Projections comme suisse"** (2026-10-27): projections are not v1. NW-06..08 and
  BUD-07 move to improvements.md.
- **Q4. "Stat qui a été plus vue"** (2026-10-27): "who I saw the most", counted from shared
  events (YR-04).
- **Q5. Splits and people together** (2026-10-27): a person's share comes off each split
  proportionally, and the dashboard shows my share by default.
- **Q6. Event budget vs. category budget** (2026-10-27): one `budgets` table whose target is
  a category or an event.

## Open questions

None right now.
