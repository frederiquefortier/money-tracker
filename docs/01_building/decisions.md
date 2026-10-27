# Architectural Decision Records

Document architectural choices with context, alternatives considered, and trade-offs. Check this file before proposing changes that might conflict with past decisions.

<!-- Newest first: a new ADR goes directly below this line. Template at the bottom. -->

### ADR-011: The platform first, a dependency only when it earns its place (2026-10-27)

**Context:**
- The stack had grown a library per concern (forms, i18n, decimals, data cache, dates,
  spreadsheets). Each one is code to update, audit and trust with financial data.
- React 19, TanStack Start, Postgres and modern browsers now cover much of that natively.

**Decision:**
- Reach for, in order: the browser or Node platform, React 19, TanStack Start, Postgres.
  Add a dependency only when the native version would be a real chunk of code to own, and
  then pick the mainstream, maintained option.
- What that gives, concern by concern:

  | Concern | Native answer | Instead of |
  |---|---|---|
  | Forms | `<form action>` with React 19 actions (`useActionState`, `useFormStatus`), HTML validation attributes, `FormData` | react-hook-form |
  | Optimistic updates | React 19 `useOptimistic` | TanStack Query mutations |
  | Data loading and cache | TanStack Router loaders, `router.invalidate()` after a write | TanStack Query (added later only if a screen needs it) |
  | Global display currency | Profile in router context plus a cookie | Zustand |
  | Number, currency, date, relative-time formatting | `Intl` | date-fns, numeral |
  | Money arithmetic | In Postgres (`numeric`); in TypeScript, integer minor units with `BigInt` | decimal.js |
  | Dates | ISO `YYYY-MM-DD` strings, `<input type="date">`, preset buttons for ranges | a date-picker library |
  | Collapsible groups | `<details>` / `<summary>` | an accordion component |
  | UI preferences (sort order) | `localStorage` | a state library |
  | CSV import | `File.text()` and a small RFC 4180 parser | Papa Parse, SheetJS |

- Dependencies that stay, because the native version is not realistic:

  | Dependency | Why |
  |---|---|
  | `@supabase/supabase-js`, `@supabase/ssr` | Auth sessions, MFA, and the database client |
  | Zod | Server input validation and the shared schema (ADR-003); hand-written validators for every server function would be the larger, riskier code |
  | shadcn/ui (Radix underneath) and Tailwind | Accessible combobox, dialog, popover, menu: focus management and keyboard handling that are hard to get right by hand. Components are added one at a time, only when a screen uses them. |
  | i18next, react-i18next | Plurals, interpolation and server-rendered language switching for FR and EN (ADR-008) |
  | Recharts (through shadcn charts) | Line, bar, area and donut charts with tooltips and responsive sizing |
  | emoji-picker-react | Asked for by name (CAT-07), lazy-loaded |

**Alternatives Considered:**
- The full set from the correction prompts (TanStack Query, Zustand, react-hook-form,
  a decimal library) -> Each is reasonable alone; together they are a lot of
  surface for an app this size.
- No UI kit, native `<dialog>` and the Popover API -> Good primitives, but the searchable
  grouped combobox (CAT-06, CUR-03) still needs custom keyboard and ARIA work.

**Consequences:**
- About nine runtime dependencies instead of fifteen.
- A new dependency needs a line in this ADR's tables or its own ADR.
- Trade-off: some things the libraries gave for free (form dirty state, query
  deduplication) are written by hand when needed.

### ADR-010: A fixed CSV format for import, no user seed (2026-10-27)

**Context:**
- The real history (Aspire 2018 to now, the net-worth tracker) already exists. A generic
  starter seed would be thrown away on day one.
- The category tree is being redesigned in the app, so every historical transaction needs
  re-categorising on the way in.
- The app is multi-user: whatever brings this history in should work for the next user's
  history too, not only this spreadsheet.
- v1 should get real data in quickly, without a large import UI.

**Decision:**
- No seed of user data. `src/data/reference/` keeps only lookup data every user needs
  (currencies, account and holding types) and the import templates.
- v1 imports one fixed, documented CSV format ([import.md](import.md)). The user prepares
  their data in it beforehand, categories already organised. The app validates, summarises
  what it will create, and commits all or nothing as one undoable batch.
- Files are parsed in the browser and never stored; the server validates every row again.
- Converting a specific source (the Aspire sheet) into the format happens outside the app.

**Alternatives Considered:**
- An import wizard with source profiles and mapping screens -> The right feature for
  other users eventually, and a lot of UI to build before the first real data is in. Logged
  in improvements.md (IMP-03).
- A one-off script that writes straight to the database -> Useless to anyone else, and
  skips the app's validation.
- Import as-is and re-categorise in the app -> Thousands of edits by hand.

**Consequences:**
- Any user can import, provided they shape their data first. The format is the contract,
  and the wizard later becomes a front end that produces it.
- The same format is the export format, so the round trip is the test.
- Local and preview environments still need invented demo data (`src/supabase/seed.sql`)
  so they never touch real figures. That is test data, not a seed.

### ADR-009: HexaRate validates, Frankfurter converts (2026-10-27)

**Context:**
- CUR-02 asks that every added currency be validated against HexaRate.
- CUR-07 converts at the rate on the transaction date, and the import starts in 2018, so
  the app needs daily historical rates.

**Decision:**
- HexaRate is called once, server-side, when a user adds a currency (CUR-02).
- Frankfurter (ECB reference rates, daily from 1999, no key) fills `exchange_rates`:
  a backfill to 2018, then a daily scheduled job. Weekends and holidays use the last
  published rate.
- A currency HexaRate accepts but the ECB does not publish gets its rates from HexaRate's
  daily rate, starting the day it is added. Before that date it has no rate.
- `exchange_rates.source` records which provider each rate came from.

**Alternatives Considered:**
- HexaRate for everything -> Its historical coverage is unconfirmed, and conversion
  correctness depends on history.
- A paid provider (Open Exchange Rates, Fixer) -> Broader coverage, but a key, a bill, and a
  third party seeing which currencies we ask for. Not needed for the currencies in use.

**Consequences:**
- CAD, CHF, EUR, GBP and USD are covered for the whole history.
- A missing rate is shown as an error on the amount (ADR-004), never as zero. For a card
  payment where both the original and paid amounts are known, their ratio is a usable
  fallback rate between those two currencies.

### ADR-008: French and English from the first screen (2026-10-27)

**Context:**
- The interface must ship in both languages (SET-04..06). Retrofitting i18n means finding
  every hard-coded string later.
- The app is private and behind a login, so there is no SEO reason for `/fr/` and `/en/`
  URLs.
- Two languages, one team: no translators, no translation platform.

**Decision:**
- react-i18next (i18next) for UI messages: the mainstream React i18n library, actively
  maintained. Interpolation, plurals (backed by `Intl.PluralRules`), context and
  formatting come built in, and it grows to more languages or translators without a rewrite.
- `fr` is the source language. Keys are typed through i18next's `CustomTypeOptions` from the
  French resources, so an unknown key fails type-checking, and the English resources are
  declared `satisfies` the same type, so a missing translation fails it too.
- Both languages are bundled (two small files); no lazy-loading backend.
- The locale lives on the profile (`profiles.locale`, BCP 47 such as `fr-CA`, `fr-CH`,
  `en-CA`), mirrored in a cookie so the server renders the right language before the
  session loads. No locale in the URL.
- All number, currency and date formatting goes through `Intl` with the full locale, not
  just the language, since `fr-CA` writes `1 234,50 $` and `fr-CH` writes `1’234.50`.
- Reference labels carry `_fr` and `_en` columns. User-typed content is stored as typed.

**Alternatives Considered:**
- Hand-written typed dictionaries with a small `t()` -> No dependency, but plurals,
  interpolation and SSR language handling become our code to maintain.
- react-intl (FormatJS) -> Also mature, ICU syntax built in; smaller ecosystem of
  examples with TanStack.
- Paraglide JS -> Compiled and typed, but younger and less widely used.
- French only, English later -> Every string would have to be found again.

**Consequences:**
- No string literal in a component: every visible text goes through `t()`, enforced in
  review and by `eslint-plugin-i18next`.
- Every feature is written twice (FR and EN). Small cost, paid as it goes.

### ADR-007: Repository layout mirrors Lifebook (2026-10-27)

**Context:**
- The repo starts from Lifebook's structure: a short root, `docs/` as a dev journal, one
  folder per sub-project under `src/`.
- There is one language here (TypeScript) but two tools that each want a folder of their
  own: the TanStack Start app and the Supabase CLI.

**Decision:**
```
repo/  README.md  CLAUDE.md  .gitignore  .github/  .claude/  docs/
       src/app/        TanStack Start app: package.json, routes, server functions, tests
       src/supabase/   Supabase CLI project: config.toml, migrations/, tests/ (pgTAP), seed.sql (demo data)
       src/data/       reference/ (Git: lookup CSVs) + local/ (gitignored: real data)
```
- **npm commands run from `src/app/`. Supabase CLI commands run from `src/`** (the CLI
  looks for a `supabase/` folder in the working directory).

**Alternatives Considered:**
- `supabase/` at the repo root -> The CLI default, but it puts a sub-project at the root,
  which is what Lifebook's ADR-029 moved away from.
- A monorepo with workspaces (`packages/db`, `packages/ui`) -> Machinery for a second app
  that does not exist.

**Consequences:**
- Netlify's base directory is `src/app`.
- Forgetting where to run a command gives "no package.json" or "no supabase project"
  rather than anything subtle.

### ADR-006: The browser never queries the database (2026-10-27)

**Context:**
- Supabase's default is a browser client talking straight to the auto-generated API, with
  RLS as the only guard.
- This app holds financial data, and a project requirement was a Node backend.

**Decision:**
- All data access goes through TanStack Start server functions. They call Supabase with the
  user's session, so RLS still applies.
- The publishable key is used only by the auth flow in the browser. No data query exists in
  client code.

**Alternatives Considered:**
- Browser to Supabase directly -> Less code, but every validation rule must also live in
  SQL, and any table that slips through RLS is exposed to every signed-in user.
- Server connects to Postgres directly (Drizzle + a pooled connection) -> Type-safe SQL,
  but RLS only applies if every query sets the role and JWT claims by hand; easy to forget
  once.

**Consequences:**
- Two walls: Zod validation in the server function, RLS in the database.
- Every query costs one extra hop through a Netlify Function. Fine at this scale.
- Realtime subscriptions are off the table without opening a browser channel. Not needed.

### ADR-005: Composite foreign keys carry `user_id` (2026-10-27)

**Context:**
- RLS checks the row being written, not the rows it points at. A user who guesses another
  user's category UUID can attach their own transaction to it, and joins would then leak
  that category's name.

**Decision:**
- Every user table has `unique (user_id, id)`. Every FK between user tables is composite:
  `(user_id, category_id) references categories (user_id, id)`.

**Alternatives Considered:**
- Check ownership in a trigger -> Works, but is one more thing to remember per table.
- Rely on UUIDs being unguessable -> They are, until one appears in a URL or a log.

**Consequences:**
- Cross-user references are impossible at the database level, not merely unlikely.
- Slightly wider indexes and FK declarations.

### ADR-004: Money as `numeric`, conversion at read time (2026-10-27)

**Context:**
- Amounts appear in at least CAD, CHF, EUR. The spreadsheet history stores converted
  amounts as floats with six decimals.
- The display currency can change at any moment (CUR-06), and conversion must use the rate
  on the transaction date (CUR-07).

**Decision:**
- `numeric(19,4)` for amounts, `numeric(24,12)` for rates, ISO 4217 codes for currencies.
- A transaction stores what was paid and, when different, the receipt price. Display amounts
  are computed by joining `exchange_rates` on the transaction date. Nothing stores a
  display-currency amount.
- Arithmetic happens in Postgres. The little done in TypeScript (form previews of a split
  or a fee) uses integer minor units with `BigInt`, never JS floats (ADR-011).

**Alternatives Considered:**
- Integer minor units (cents) -> Simple and exact, but rates and splits by percent produce
  fractions of a cent that need a rounding policy at every step.
- Store the converted amount at write time -> Fast reads, but wrong as soon as the display
  currency changes, and stale if a rate is corrected.

**Consequences:**
- Reports need the rates table to be complete for every date that has a transaction. The
  rates job backfills, and a missing rate is an error shown to the user, not a silent zero.

### ADR-003: shadcn/ui as the component base (2026-10-27)

**Context:**
- The interface needs comboboxes with grouped options (favourites first), dialogs, popovers,
  data tables, date-range pickers, and charts.

**Decision:**
- shadcn/ui (Radix primitives, Tailwind), components copied into `src/app` and owned there.
  Charts through shadcn's chart wrapper around Recharts. Forms are native React 19 form
  actions (ADR-011), with shadcn's form field styling and Zod on the server.
- Zod is the one validation layer: TypeScript types disappear at runtime, so anything
  arriving at a server function is checked by a Zod schema. The same schema validates the
  form in the browser and gives the TypeScript type, so the three never drift.

**Alternatives Considered:**
- MUI or Mantine -> Faster start, but styled through the library's theme system; deep
  customisation fights it.

**Consequences:**
- Accessible primitives by default (keyboard, ARIA), which the correction prompts ask for
  repeatedly.
- Component updates are manual: shadcn copies code in rather than versioning it.

### ADR-002: TanStack Start server functions are the Node backend, on Netlify (2026-10-27)

**Context:**
- The brief asks for a Node backend, a React UI (TanStack Start), and Netlify hosting.
- Netlify runs functions, not long-lived servers.

**Decision:**
- One TanStack Start app. Its server functions are the backend: they run on Node inside
  Netlify Functions. Scheduled work (exchange rates, recurring transactions) uses Netlify
  scheduled functions.

**Alternatives Considered:**
- A separate Express/Fastify API -> A second deployable, a second host (Netlify cannot
  keep it running), and a CORS and auth story between them. Only worth it if a second client
  (a mobile app) appears.
- Supabase Edge Functions as the backend -> Deno rather than Node, and logic split
  between two platforms.

**Consequences:**
- Frontend and backend share types and Zod schemas with no build step between them.
- If a native app arrives later, the server functions become the seed of a real API, which
  is an ADR then.

### ADR-001: Supabase Postgres is the source of truth (2026-10-27)

**Context:**
- Multiple users from day one, financial data, a hosted web app.
- Lifebook chose a single SQLite file, which fits one person on one machine and does not fit
  here.

**Decision:**
- Supabase (Postgres, Auth with TOTP MFA) on the Pro plan, in a European region.
- All schema changes are SQL migrations in Git, so the database can be rebuilt on any
  Postgres.

**Alternatives Considered:**
- Neon or self-hosted Postgres plus a separate auth service -> More pieces to secure
  ourselves.
- Firebase -> Document model is a poor fit for splits, budgets and aggregations.

**Consequences:**
- RLS discipline is mandatory (security.md, ADR-005, ADR-006).
- A recurring cost (about US$25 a month for Pro) in exchange for backups and no pausing.
- Lock-in is limited to Auth; the data is plain Postgres and dumps restore anywhere.

---

## Format

### ADR-XXX: Decision Title (YYYY-MM-DD)

**Context:**
- Why this decision was needed
- What problem it solves

**Decision:**
- What was chosen

**Alternatives Considered:**
- Option 1 -> Why rejected
- Option 2 -> Why rejected

**Consequences:**
- Benefits
- Trade-offs
