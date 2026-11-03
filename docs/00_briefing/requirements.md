# Requirements

The organized feature list. It merges four sources and removes the duplicates between them:

| Tag | Source |
|---|---|
| `v1` | [01-app-v1.md](notes/01-app-v1.md), the first full list, plus the loose MISC notes |
| `ai` | [02-app-v-ai.md](notes/02-app-v-ai.md), the revised list. **Baseline when the two disagree.** |
| `add` | [03-a-ajouter-2026-02.md](notes/03-a-ajouter-2026-02.md), feedback from testing the prototype |
| `C1`..`C11` | [04-prompts-de-correction.md](notes/04-prompts-de-correction.md), detailed acceptance criteria |
| `sheet` | Something the current spreadsheets do that the notes never mention ([reference-sheets.md](reference-sheets.md)) |

Each requirement has a stable ID (`ACC-03`) so ADRs, issues and commits can point at it.
**Phase** refers to [roadmap.md](../03_planning/roadmap.md). **v1 is phases 0 to 2**: the
point where the spreadsheet can be retired. Phases 3 and 4 are v2, phase 5 is v3, and
`later` is tracked in [improvements.md](../03_planning/improvements.md). The UI ships in French and
English; this file is in English like every other meta-doc.

---

## 1. Onboarding and settings (`SET`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| SET-01 | A new user is walked through choosing a language and a default currency (both required), then creating their first accounts and categories (each can wait). No starter category set in v1. | v1 | 1 |
| SET-02 | Birth date (drives the age-based account recommendations in `LOC`). | v1 | 5 |
| SET-03 | Home country, used for "local purchase" stats and for which region pack applies. | v1, inferred | 5 |
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
| ACC-08 | Each account shows when it was last reconciled and when its last transaction was. | sheet | 2 |

## 3. Transactions (`TRX`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| TRX-01 | Add an expense or an income, with a date and an optional time. | v1, ai, misc | 1 |
| TRX-02 | Currency is required on every transaction, prefilled from the account. The amount booked is always in the account's currency; choosing another currency records it as the original price (CUR-08). | add, C6 | 1 |
| TRX-03 | Balance adjustment: set an account to a known balance; the app records the difference. | v1, ai | 1 |
| TRX-04 | Transfer between two accounts. Optional fee, recorded as an expense on the source account in the category chosen once in settings. Edit and delete act on all legs together, with a confirmation before delete. List shows "Transfert : A → B". | add, C5 | 1 |
| TRX-05 | A transaction can be linked to a merchant. | v1, ai | 1 |
| TRX-06 | Split a transaction across several categories by amount, share or percentage. | v1, ai | 1 |
| TRX-07 | Link an income to an expense as its reimbursement. | v1, ai | 3 |
| TRX-08 | Recurring transactions. Changing the amount keeps the old amount and the change date as history. The recurrence can be stopped. | v1, ai | 2 |
| TRX-09 | Status: pending or cleared, so a pending card charge does not count as reconciled. | sheet | 1 |
| TRX-10 | A transaction can carry a free-text note (the memo). | sheet | 1 |
| TRX-11 | A transfer between accounts in different currencies records what left one and what arrived in the other; the gap against that day's market rate shows as the conversion cost. | net-worth data (CAD to CHF) | 1 |
| TRX-12 | Search transactions by text: merchant and note. | author | 2 |

## 4. Multi-currency (`CUR`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| CUR-01 | Each user has a list of usable currencies. Defaults, sorted alphabetically: CAD, CHF, EUR, GBP, USD. | ai, C3 | 1 |
| CUR-02 | Adding a currency validates it against HexaRate. If the provider is down, adding fails with a retry; existing currencies keep working. | ai, add, C3 | 1 |
| CUR-03 | Currencies can be marked favourite; favourites come first in every currency picker. Pickers are searchable and show "CODE - Nom" and the symbol. | v1, ai, C3 | 1 |
| CUR-04 | Removing a currency in use asks for confirmation and names how many transactions use it. The default currency and a currency used by an open account cannot be removed. Adding a removed currency back skips the HexaRate check. | C3 | 1 |
| CUR-05 | A default currency, used to prefill forms. | ai | 1 |
| CUR-06 | A display currency switchable from any page (header dropdown, like a language switcher). Every amount re-renders in it. | ai, add, C4 | 1 |
| CUR-07 | Conversion uses the rate on the transaction date, or today's rate when the amount has no date. An amount already in the display currency is never converted. | v1, ai | 1 |
| CUR-08 | A foreign-currency transaction has two editable fields, original price and price paid, and a read-only fee: the gap between what was paid and the market rate that day. | v1, ai | 1 |
| CUR-09 | It is always clear which amounts were converted. A converted amount carries a visible marker; its original amount, currency and the rate used are one hover or tap away. Native amounts show plain. Totals that mix both say so. | Q1 answer | 1 |

## 5. Categories (`CAT`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| CAT-01 | Categories nest with no depth limit. | v1, ai | 1 |
| CAT-02 | A category has a kind: expense (default), income, or investment. | v1, ai | 1 |
| CAT-03 | Archive a category from a chosen date; reactivate from a chosen date. The full history is viewable as a timeline. Archiving a parent archives its branch; a sub-category cannot be reactivated under an archived parent. | v1, ai, add, C10 | 1 |
| CAT-04 | Archived categories are absent from every picker. Editing an old transaction still shows its archived category with a badge and lets you change it. | add, C8 | 1 |
| CAT-05 | The category page shows active categories first and archived ones in a collapsed section with a count and "archivée depuis [date]". | add, C9 | 1 |
| CAT-06 | Favourite categories sit in a "Favoris" group at the top of the picker, shown as "Parent > Enfant", toggled with a star inside the picker. They are not repeated below. | v1, ai, add, C7 | 1 |
| CAT-07 | A category has a coolicons icon, chosen in a searchable picker of a curated subset of the set (ADR-020). A default is suggested from the name; "Réinitialiser" returns to it. Each category has its own colour, chosen freely; a sub-category starts from a variation of its parent's colour. | v1, ai, add, C11 | 1 |
| CAT-08 | A category can be excluded from the emergency-fund calculation. | v1, ai | 2 |

## 6. Merchants (`MER`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| MER-01 | A merchant can have a default category, prefilled on new transactions. | v1, ai | 1 |
| MER-02 | A merchant has aliases, used to match bank-CSV descriptions on import. | v1, ai | later (with IMP-03) |
| MER-03 | A merchant has a country of origin. | v1 | 5 |
| MER-04 | For one merchant, see how the bill has changed over time, in percent. | v1, ai | 2 |
| MER-05 | Merge two merchants: the transactions of one move to the other, which keeps its name and default category. | author | 1 |

## 7. Tags (`TAG`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| TAG-01 | Create tags; a transaction can have several. | v1, ai | 2 |
| TAG-02 | A tag can carry a date range and categories. In that range, it attaches itself to every transaction in at least one of those categories. Automatic tags are marked as such and can be removed by hand. | ai | 2 |
| TAG-03 | Per tag: most and least expensive transactions. | misc ("Tag + expensive, less expensive") | 2 |

## 8. People and groups (`PPL`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| PPL-01 | People have a name and a custom icon; they can be grouped. | v1, ai | 3 |
| PPL-02 | A person or a group can be archived and hidden. | ai | 3 |
| PPL-03 | A transaction can be linked to people or groups, each in a role: invited (I paid for them) or owes (they will pay me back). Their part is set by amount, share or percentage. | v1, ai | 3 |
| PPL-04 | Without naming anyone: tick "I treated someone" with an amount and a head count, or "I expect a reimbursement" with an amount. | v1 | 3 |
| PPL-05 | Reminders for money owed in both directions. | misc | 3 |

## 9. Events (`EVT`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| EVT-01 | User-defined event types. | ai | 3 |
| EVT-02 | An event has a name, a date (or range), a type and optional people. | v1, ai | 3 |
| EVT-03 | Transactions can be linked to an event. | v1, ai | 3 |
| EVT-04 | Calendar view of events with the total spent on each. | v1, ai | 3 |
| EVT-05 | Compare events of the same type. | ai | 3 |
| EVT-06 | Give an event a budget and follow it live. | ai | 3 |

## 10. Dashboard and reports (`DSH`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| DSH-01 | Date range picker: a calendar year, last 12 months, last 6 months, custom. | v1, ai | 2 |
| DSH-02 | Filter by date, category, sub-category and tag. List or chart view of the same data. | v1, ai | 2 |
| DSH-03 | An archived category is hidden from charts when the range does not overlap its active period. | v1, ai | 2 |
| DSH-04 | Per category: count, total, mean and median for the period, and the change versus the previous period in percent. | v1, ai | 2 |
| DSH-05 | Expenses waiting for a reimbursement are highlighted. A reimbursed expense shows its net amount. | v1, ai | 3 |
| DSH-06 | Header tiles: total available, spent this month, invested this month, pending count. | sheet | 2 |
| DSH-07 | Category ranking by spend over the range. | sheet | 2 |
| DSH-08 | Year view and month view. | misc | 2 |

## 11. Budget (`BUD`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| BUD-01 | Per category and date range: an amount ceiling or target. | v1, ai | 2 |
| BUD-02 | Per category and date range: a transaction-count ceiling or target. | v1, ai | 2 |
| BUD-03 | Expected monthly income. | v1, ai | 2 |
| BUD-04 | Emergency fund: target in months, the account that holds it, the categories it covers. Shows progress, or how many months the account already covers. | v1, ai | 2 |
| BUD-05 | A celebration animation when savings and investment goals are reached. | ai | 5 |
| BUD-06 | Budget tooltips can be turned off. | v1, ai | 2 |
| BUD-07 | Scenario budgets: compare a monthly budget across places (rent, transport, deductions) against a gross salary, as a share of income. | sheet (Prévision budgétaire), misc ("Projections comme suisse") | later |

## 12. Net worth (`NW`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| NW-01 | Holdings: investment accounts, debts and other assets, each with a type (TFSA/CELI, RRSP/REER, FHSA/CELIAPP, DPSP, 2nd pillar, 3a, life-insurance buyout...) and an institution and country. | v1, ai | 4 |
| NW-02 | Dated value snapshots per holding. Months with no snapshot can be hidden in charts. | v1, ai | 4 |
| NW-03 | Contributions per holding, split between my money (transactions linked to the holding) and employer or other money (entered on the holding). Shows amount placed and profit in amount and percent. | v1, ai, net-worth data | 4 |
| NW-04 | Net worth chart (total, investments, debts) and percent change over any range; default is account start to today. | v1, ai | 4 |
| NW-05 | A holding can be excluded from the net worth total (the life insurance "with/without" line). | net-worth data | 4 |
| NW-06 | Projections at fixed growth rates (5, 7, 10 %) or custom inputs. | v1, ai | later |
| NW-07 | Goal solver: "to reach X in N years at r %, invest Y per year", with r defaulting to my actual return. | v1, ai | later |
| NW-08 | "If this continues, in N years I'll have X." | v1, ai | later |
| NW-09 | Income by job: salary per employer per year, with a total. | misc ("Séparé par emploi..."), net-worth data | 4 |

## 13. Yearly review (`YR`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| YR-01 | Toggle between a money view and a social view. | ai, misc | 5 |
| YR-02 | Layout: a timeline with sticky months on the left, a calendar on the right that scrolls with it. | ai, misc | 5 |
| YR-03 | Top 3 most expensive days. | ai | 5 |
| YR-04 | Who I spent the most with, the least with, and who I shared the most events with. | ai, misc | 5 |
| YR-05 | Who owes me and whom I owe, at a glance. | ai | 5 |
| YR-06 | Share of purchases made at local merchants. | v1 | 5 |
| YR-07 | Export the review as charts in several formats. | ai | 5 |

## 14. Region packs (`LOC`)

The "Canada" section, generalised because the data already spans Canada and Switzerland.

| ID | Requirement | Source | Phase |
|---|---|---|---|
| LOC-01 | Account-type recommendations by age and country (TFSA/RRSP/FHSA in Canada; pillars 2 and 3a in Switzerland). | v1 | 5 |
| LOC-02 | Region packs are data (account types, recommendations), not code branches. | inferred | 5 |

## 15. Import (`IMP`)

| ID | Requirement | Source | Phase |
|---|---|---|---|
| IMP-01 | Import from one fixed, documented CSV format (accounts, transactions, optional splits). The user prepares their data beforehand. Missing categories, accounts and merchants are created and listed before commit. Files are read in the browser and never stored. See [import.md](../01_building/import.md). | sheet, ADR-010 | 1 |
| IMP-02 | Net-worth history through the same format (optional holdings and snapshots files). | net-worth data | 4 |
| IMP-03 | Import wizard: source profiles, column and category mapping, merchant-alias matching, suggested transfer pairs and reimbursements. | v1 misc ("Csv importer visual"), MER-02 | later |
| IMP-04 | Export my data in the import format; export then import reproduces it. This is the export half of SEC-04. | ADR-010, SEC-04 | 1 |
| IMP-05 | Each import is one all-or-nothing batch that can be undone in one action. Re-importing a row with a known `ref` is skipped. | ADR-010 | 1 |
| IMP-06 | Before an import commits, each category it would create is decided: created as written, or merged into another category (existing, from the same import, or new under another name). The choices apply to that import only. | author | 1 |

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
| SEC-04 | Full export of a user's data in an open format (IMP-04, phase 1), and full account deletion (phase 2). | brief | 1, 2 |
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
  with the account", favourite means "pin to top".
- **Transfers.** C5 stores a transfer as two transactions pointing at each other. The schema
  uses a shared `transfer_id` on the legs instead; same behaviour, no circular foreign keys.
  See [database.md](../01_building/database.md).
- **Transfer fee category.** C5 auto-created "Frais bancaires". With categories built by the
  user, the fee category is a setting instead (`profiles.transfer_fee_category_id`).
- **Category icons.** C11 asks for an emoji picker in Google's style. Replaced by coolicons,
  the set the logo comes from, so the interface has one visual language (ADR-020).
- **"Canada"** became region packs (`LOC`), since 2026 data is Swiss.
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
