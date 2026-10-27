# Project Brief: Money Tracker (working title)

## One-liner
A private web app that replaces an eight-year budgeting spreadsheet: transactions in any
currency, budgets, the people and events money was spent on, and net worth over time.

## The problem
The current system is an Aspire Budgeting Google Sheet (2018 to now) plus a separate
net-worth tracker and a city-by-city forecast sheet ([reference-sheets.md](reference-sheets.md)).
It works, but it cannot answer the questions that matter now:

- Life moved from Canada to Switzerland, so money now lives in CAD and CHF at once, and the
  sheet converts with a single stored float.
- Spending is social (who was invited, who owes what, which trip or birthday it was for)
  and the sheet only has a memo column for that.
- Net worth, investment contributions and salary history live in a separate document.

## Goals
- Every transaction, in its real currency, converted at that day's rate.
- Budgets and an emergency-fund view that read real averages.
- People, groups and events attached to spending, with a yearly review built from them.
- Net worth with contributions vs. growth, and projections.
- Import the full spreadsheet history so day one already has eight years of data.

## Non-goals (for now)
- Bank connections. CSV import only.
- Public sign-up or a business around it. Multi-user is built in from the start, but the
  app is private and invite-only.
- Native mobile app. The web app must work well on a phone.

## Constraints
- **Security first** ([security.md](../01_building/security.md)): MFA, RLS on every table,
  no data in Git.
- **Interface in French and English**, switchable per user. Documentation in English.
- Stack: TanStack Start (React) with shadcn/ui, server functions as the Node backend,
  Supabase, Netlify ([architecture.md](../01_building/architecture.md)).

## Where things are
- What it must do: [requirements.md](requirements.md)
- Raw notes, verbatim: [notes/](notes/)
- How it is built: [architecture.md](../01_building/architecture.md),
  [database.md](../01_building/database.md), [decisions.md](../01_building/decisions.md)
- In what order: [roadmap.md](../03_planning/roadmap.md)
