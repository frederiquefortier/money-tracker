# Money Tracker

[![Netlify Status](https://api.netlify.com/api/v1/badges/aa42b944-4059-4292-b1cb-7d800a522410/deploy-status)](https://app.netlify.com/projects/ff-money-tracker/deploys)

A private money tracker that keeps every transaction in its own currency, along
with who it was with and what it was for. It turns eight years of spreadsheet history into an interactive
dashboard to answer the questions a spreadsheet never could: what a trip really cost me,
who still owes me and where the money went after moving countries.

<!--
Hero media, to add. Capture from invented data only (the /design gallery or the e2e
account), never from the owner's account.
  docs/assets/dashboard.png      the dashboard, a year of invented spending
  docs/assets/transaction.gif    adding a shared dinner abroad on a phone
-->

## Highlights

- 💱 **Pay in one currency, see it in another.** Every transaction keeps its real currency
  and converts at that day's central-bank rate, so switching the display
  currency rewrites nothing.
- 🤝 **Who it was with, and who owes what.** People, groups and events attach to a
  transaction. A shared bill counts only my share, and a repayment settles what is owed.
- 🗂️ **Categories that carry meaning.** Nested to any depth, each marked as a need or a want
  (a subcategory follows its parent), and archived from a date so past transactions keep
  theirs. Choosing a merchant prefills its usual category.
- 🔐 **Private by design.** Row-level security on every table with a test proving another
  user sees nothing, MFA required, no database client in the browser, and a privacy mode
  that masks every figure on screen.
- 📥 **Eight years of history from day one.** One CSV format brings in every transaction and
  the net worth history as a single batch I can undo, and exports back out the same way.

## Overview

How it works:

1. An account books in its own currency. A purchase abroad also keeps the receipt price.
2. A transaction carries a merchant, a category (prefilled from the merchant), the people
   involved and an event such as a trip. Any transaction can be linked to any event by hand,
   and an event with dates can also pick up the transactions inside them automatically.
3. Splits and each person's part decide my share: what I really paid once others pay me back.
4. The dashboard and the net worth read that share, converted into the display currency at
   each day's rate. Nothing converted is ever stored.

A person on a transaction has a role, and the role decides what the money means:

| Role | Meaning | Counts in my share |
|---|---|---|
| Me | My own part | Yes |
| Invited | Someone I paid for | Yes |
| Owes | Someone who owes me their part | No, and the row stays flagged until they repay |
| From | Who paid me, on an income | Settles what they owed, the rest stays income |
| With | Was there, paid their own | Carries no money |

## Problem

A budgeting spreadsheet grows one patch at a time. This one started in 2018, was rebuilt in
2023 on Aspire Budgeting (an envelope-budgeting template, used here without the envelopes),
and kept gaining pieces: investment categories handled their own way, new dashboards and new
ways to present the data, then multi-currency support after a move from Canada to
Switzerland. Each change was layered on the last until the sheet was too messy to extend.

A spreadsheet also has nowhere to record the merchant, who a dinner was with or which trip a
purchase belonged to, other than a memo column. The questions that matter most, like the real
cost of a trip or who still owes what, can't be asked of it.

The features were first written as user stories, then tried in a prototype on Lovable. This
repo is the rewrite, on a stack I control. My role was product owner, and I was after
development speed for an internal tool I use every month.

## Goals

- Every transaction in its real currency, at that day's rate.
- My real share of every shared bill, and who still owes what.
- Every expense reviewed and categorised by hand, as a need or a want.
- Net worth with contributions separated from growth.
- The full spreadsheet history imported before the app replaces it.

## Architecture

One TanStack Start app is both the interface and the backend, and Postgres holds the money
rules. The browser only calls server functions. They validate the input with Zod, then call
Supabase with the user's own session, so row-level security applies to every query. A write
that touches several rows (a split, a transfer, an import) is a single SQL function, so it
either lands whole or not at all. The secret key is used only by the scheduled rates job.

```
  Browser (React 19, shadcn/ui, TanStack Router)
        │  server functions only, no Supabase client in the bundle
        ▼
  TanStack Start server (Node, on Netlify Functions)
        │  user's session  ──►  RLS applies          (every request)
        │  secret key      ──►  exchange rates only  (scheduled job)
        ▼
  Supabase: Postgres + Auth (TOTP MFA)
        ▲
        │  daily rates, history back to 2018
  Frankfurter (central-bank rates)
```

```
docs/                dev journal: briefing, building, fixing, planning
src/app/             TanStack Start app; every command runs here
  src/routes/        file routes
  src/server/        server functions only, one file per feature
  src/lib/<feature>/ model, form draft and list logic
  src/components/    shared pieces by role, then one folder per feature
src/supabase/        migrations and pgTAP tests
src/data/reference/  lookup data, in Git
src/data/local/      real data, never in Git
```

Stack: React 19 · TanStack Start and Router · shadcn/ui on Tailwind · Recharts · Zod ·
react-i18next and `Intl` · Supabase (Postgres, Auth) · Netlify · Vitest, pgTAP, Playwright.

So adding a feature means a migration with its security test, a server file and a feature
folder. The shared sheets, pickers and lists stay untouched.

To run it, from `src/app/`: `npm install`, then `npm run dev`. `npm run verify` runs what CI
runs. Setup from an empty Supabase project is in [setup.md](docs/01_building/setup.md).

## Challenges

- **Shared money that adds up.** A dinner where one friend owes me, another was my guest and
  a third paid their own has to count only my share, and a roommate paying two months at
  once must not count twice. Settling these rules ([domain-rules.md](docs/01_building/domain-rules.md))
  took more thought than writing them.
- **Eight years of messy data.** Merchants left in notes, foreign amounts typed into memos,
  catch-all categories and trip costs dated outside the trip. Cleaning it all into the
  import format was a project of its own, and the format grew until it could carry
  everything a transaction can.
- **A design that holds together, on a phone first.** A warm visual direction picked from two
  reference images, then screen-by-screen reviews to keep every sheet, picker and list the
  same. The iPhone keyboard, Safari's zoom and bottom sheets caused a long tail of bugs,
  found by testing by hand.
- **Currencies that don't line up.** A card in one currency paying in another, transfers
  with a fee between currencies, and some currencies with no rate history. A missing rate
  shows as an error so a total is never quietly wrong.
- **Steering an assistant that forgets.** Claude wrote most of the code and starts every
  session blank. The rules live in [CLAUDE.md](CLAUDE.md), hooks and the dev journal, and
  every change starts with options and an explicit decision before any code
  ([process.md](docs/01_building/process.md)).

Most of the decisions below come straight out of these.

## Key Decisions

The full reasoning is in the ADRs at [decisions.md](docs/01_building/decisions.md). The ones
that matter most:

- **Every transaction entered and reviewed by hand, with no bank connection.** Going through
  each one is how a mistake or a suspicious charge gets noticed, and it keeps every expense a
  choice to own and look back on. The CSV import (ADR-010) is there for history; new
  transactions are entered one at a time.
- **Convert when reading, never when saving** (ADR-004). A stored converted amount goes wrong
  as soon as the display currency changes or a rate is corrected.
- **My share is computed once, in SQL** (ADR-063). One function turns each line into what I
  really paid, and every chart and total reads it. Computed per report, a shared bill and its
  repayment could both have counted somewhere.
- **The browser never touches the database** (ADR-006). Supabase's default is a browser
  client guarded only by row-level security. Here a server function stands in front of it,
  so a table that slips through is still out of reach.

## Future Work

Things I haven't built yet, tracked in [improvements.md](docs/03_planning/improvements.md):

- **Comparing across a move.** A dated place of residence, marked on the charts, so spending
  before and after a move compares as a share of income instead of raw amounts.
- **Importing a bank's own CSV.** Map its columns and categories once, and the next import
  asks nothing (IMP-03).
- **Recurring transactions.** Rent and subscriptions entered once, with their price changes
  over time.
- **Net worth projections.** Growth rates, a goal solver and an "if this continues" line.
- **Ready for a second user.** Custom email sending and a sign-in throttle per IP and per
  email, both needed before anyone else gets an account.
