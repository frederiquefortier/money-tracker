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

## History
A first prototype was built on Lovable in early 2026 as a proof of concept. Testing it produced the correction list that shaped the requirements (institutions as records, archived categories out of pickers, a history popup that showed nothing). This repo is the rewrite on a stack the owner controls, with security as the first constraint.

## Goals
- Every transaction, in its real currency, converted at that day's rate.
- Budgets and an emergency-fund view that read real averages.
- People, groups and events attached to spending, with a yearly review built from them.
- Net worth with contributions vs. growth (projections come later).
- Import the full spreadsheet history so day one already has eight years of data.

## Who it is for
- **Now:** the owner, retiring a spreadsheet kept since 2018.
- **Later:** a few invited people with their own data, which is why multi-user and the
  import format exist from v1.
- **Also:** readers of the code. The repo is a portfolio piece on AI-assisted development;
  [process.md](../01_building/process.md) records the method.

## v1 is done when
- Eight years of Aspire history are imported and every account balance matches the sheet.
- A month of new transactions is entered in the app and not in the sheet.
- The dashboard and budgets answer what the Aspire dashboard answered.
- A second test user sees none of the owner's data (pgTAP), and MFA is enforced.
- The public demo runs on invented data.

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
- Raw notes, verbatim: [notes/](notes/) (the prototype feedback notes were folded into the requirements and removed)
- How it is built: [architecture.md](../01_building/architecture.md),
  [database.md](../01_building/database.md), [decisions.md](../01_building/decisions.md)
- In what order: [roadmap.md](../03_planning/roadmap.md)
