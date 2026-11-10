# Architectural Decision Records

Document architectural choices with context, alternatives considered, and trade-offs. Check this file before proposing changes that might conflict with past decisions.

<!-- Newest first: a new ADR goes directly below this line. Template at the bottom. -->

### ADR-030: The period joins the filters' sheet; sheets slide from the right (2026-11-10)

**Context:**
- After trying ADR-029, the author asked for four changes: chips that stay individual
  whatever their number, a filter bubble that always keeps its name, every sheet on a
  phone opening from the right (the menu apart), and the period inside the Filtres button
  on a phone, in the same drill-in as the filters, "maybe even on desktop".

**Decision:**
- Chips are always one per value. This replaces ADR-029's single "Catégories · 5" chip.
- A filter bubble always reads its name, with the number after it once something is
  ticked ("Catégories · 2"). It never swaps its name for the one ticked, since the chips
  now say what is ticked. This replaces the single name on the bubble (spec 14).
- Every sheet slides in from the right at every width; only the menu (`side="left"`)
  comes from the left. The bottom animation is gone.
- The period is a screen of the filters' sheet, `FilterScreen = FilterTab | 'period'`. On a
  phone the bar has no period bubble: Filtres lists Période first (its value on the
  right), then the five filters, and Période opens the same tabs, grids and calendar. From
  `md` up the period bubble keeps its ‹ › and opens the sheet on that screen alone, in
  place of the popover. A pick applies, then returns to the list when the sheet came from
  it, or closes when a bubble opened it.

**Alternatives Considered:**
- Keep the period bubble and its popover on phones -> The author wants one place for
  everything that narrows the list.
- Keep the popover on desktop -> Two patterns for one job, which the author did not want.

**Consequences:**
- On a phone, stepping a month with ‹ › now takes the drill-in: Filtres, Période, Mois.
- The merchants page's category bubble loses the single name too (same bubble), and has
  no chips to replace it.

### ADR-029: Transactions filters: one filter per screen, chips for the choices (2026-11-10)

**Context:**
- The Transactions period and filters had three problems, reported by the author: the
  custom period opened its calendar in a second overlay (ADR-027), unlike the month and
  year grids; the chosen filters showed nowhere but as a count; and every filter opened
  the same sheet with five wrapping tabs, which did not work on a phone.

**Decision:**
- The custom period shows its range calendar inline in the period panel, under the typed
  dates, as the year and month grids do. Picking the second day applies the range and
  closes the panel. This supersedes ADR-027 and ADR-028 for the Transactions period only;
  every other date field keeps the calendar rising from the bottom.
- The filter sheet has no tab row. From `md` up, each filter's bubble opens the sheet on
  that filter alone. On a phone, one Filtres button opens a list of the five filters, each
  with a summary of what is ticked; a row opens that filter in the same sheet, with a back
  arrow. Two levels, no sideways scroll.
- What is chosen shows as chips under the bubbles: one per value (the category with its
  icon), a ✕ to remove it, and "Tout effacer" at the end. A filter with more than two
  values becomes one chip, "Catégories · 5".

**Alternatives Considered:**
- Tabs kept, in a scrolling row -> Rejected by the author: sideways scroll hides tabs.
- One bubble per filter in a scrolling row on phones (the assistant's first choice) ->
  Rejected by the author, who preferred the two-level list.
- A popover per filter on desktop -> The sheet already holds the search, the grouped
  lists and the result count; a popover would rebuild them. Left as an improvement.

**Consequences:**
- `FilterSheet` takes a `tab` that may be null (the list of filters) and shows the back
  arrow only when more than one tab is available. The settings merchants filter, which
  passes one tab, is unchanged.
- The period panel on a phone stays a popover; the inline calendar fits its width.

### ADR-028: Every date field uses the shared calendar (2026-11-09)

**Context:**
- ADR-027 kept single dates native and put only ranges on react-aria's calendar. The
  author, seeing the range field, asked that all date fields use "our calendar".

**Decision:**
- One calendar for every date: `DatePickerField` (one date) and `DateRangeField` (a range),
  both on `calendar-sheet.tsx`: typed segments, and a calendar rising from the bottom of
  the sheet or dialog the field is in (the page outside both), with a dim backdrop. No
  `<input type="date">` remains. This supersedes ADR-024 and the single-date exception of
  ADR-027.
- Typed dates read day, month, year with slashes in both languages (jj/mm/aaaa,
  dd/mm/yyyy), through `DATE_FIELD_LOCALE`; the rest of the app keeps ADR-019's Canadian
  formats. A range's band has no gap between its days.
- Sheets and dialogs both hand their panel to the calendar (`OverlayContainerProvider`),
  and ignore the Escape that closes it, so it stays inside Radix's focus and pointer scope.

**Alternatives Considered:**
- Native for one date, the calendar for ranges (ADR-027) -> Two looks for the same job.

**Consequences:**
- Forms that read their fields from `FormData` keep working: the field has a hidden input
  with the ISO date. A field no longer revalidates on blur; it validates on submit.
- In the small confirmation dialogs the calendar rises above the dialog, at the height
  the month needs.

### ADR-027: Date ranges use react-aria's range picker (2026-11-09)

**Context:**
- ADR-024 put dates back to `<input type="date">` after a shadcn calendar could not jump
  to a month or a year, and said a later date picker needs a direct month and year choice
  to be worth it.
- The event form needs optional dates as one range (EVT-02), and the author asked for a
  calendar that rises from the bottom of the sheet, half its height, over a dim backdrop,
  as in TravelSpend. The Transactions list's custom period is a range too.

**Decision:**
- A range is one shared field, `DateRangeField`, built on react-aria-components'
  `DateRangePicker`: typed month, day and year segments (the direct choice ADR-024 asked
  for) plus a `RangeCalendar` in a bottom panel. A range closes it; one day is the same
  day twice. The tooltip beside its label is react-aria's too.
- Single dates stay native, as ADR-024 says. Only ranges use the library.
- Dependencies, each with a line in ADR-011: `react-aria-components`, `react-aria`
  (for `UNSAFE_PortalProvider`, which puts the calendar inside the sheet it opens from)
  and `@internationalized/date` (the date values it takes), all pinned.

**Alternatives Considered:**
- react-day-picker, shadcn's Calendar -> What ADR-024 tried: no typed segments, so the
  month and year problem returns; locales through date-fns, against ADR-008's use of `Intl`.
- Two native date fields (ADR-024) -> No range at a glance, and no calendar the author wants.

**Consequences:**
- A new dependency family, about the size of a small design system, for one field.
- The calendar is portalled into the open sheet, or to the page outside one. In the period
  popover of the Transactions list that is outside Radix's popover, so the popover ignores
  taps and Escape inside react-aria's overlays.

### ADR-026: The code is grouped by role and by feature, with one naming rule per layer (2026-11-08)

**Context:**
- `components/` had 45 loose files, `lib/` 58, and hooks lived in five places. Nine file
  names existed in both `lib/` and `server/`. Shared types were exported from
  `server/*.ts`, so 35 files imported types from the server layer. `utils.ts`,
  `schemas.ts` and `form.ts` each held three unrelated things, and two unrelated types
  were both called `Period`. The three icon files did not say which held drawings and
  which held search words.

**Decision:**
- `components/`: no file at the root. `ui/` is shadcn. Shared pieces are grouped by role
  in `layout/`, `forms/`, `sheet/`, `combobox/`, `lists/`, `feedback/` and `display/`.
  `styles.ts` holds the class strings several components share. A feature gets its own
  folder, split into `list/`, `form/` and similar once it passes about eight files.
- `hooks/`: every hook, with the shared ones in `app/`, `forms/` and per-feature folders.
  A context lives in the file of its hook.
- `lib/`: `shared/` (money, format, color, collections, search, validation), then one
  folder per feature, plus `auth/`, `forms/`, `db/` and `server/` (the `*.server.ts`
  files keep that suffix). In a feature folder, `<entity>.ts` is the model (types,
  constants, zod schemas), `<entity>-draft.ts` the form state and `<entity>-list.ts` the
  list logic. `lib/utils.ts` keeps only `cn`, which shadcn expects there.
- `server/<feature>.ts` holds server functions only. Types and constants a component
  needs are imported from `lib/`, never from `server/`.
- `i18n/fr/` and `i18n/en/`: the same files in each, one per area. French is the source;
  the English files are typed against it.
- `icons/`: `ui-icons.json` (drawings), `categories/keywords.json` (search words) and
  `categories/glyphs.json` (drawings).
- An export is named for what it is (`TransactionDetails`, not `Details`), and no name is
  exported by two files.

**Alternatives Considered:**
- Group `lib/` by layer only (`domain/`, `server/`, `db/`) -> a feature's files would
  still sit in one flat list, and `components/` is already grouped by feature.
- Keep feature hooks next to their components -> the author asked for every hook in one
  place.
- A barrel `index.ts` per folder -> hides where code lives and slows the dev server.

**Consequences:**
- Imports are longer (`#/lib/transactions/transaction-draft`) and every path in the
  journal before this date points to the old layout. Old entries are left as written.
- A new file has one obvious home, and a new name can be checked against the rules above.
- No import cycle exists between modules (checked with a script, types included).

### ADR-025: Each repeated form, picker and server pattern lives in one place (2026-11-05)

**Context:**
- A review found the same code written three to six times: the submit of every sheet
  form, "Créer « … »" in three pickers, and in the server functions the error mapping,
  the insert-or-update and the load errors. The copies had drifted: four forms crashed
  on a network error where the transaction form did not, and one picker skipped the
  toast on a lost connection.

**Decision:**
- `useSheetForm` (components) runs every RouteSheet form: validate, save, toast, close,
  keep the values on failure, focus the first error. A form gives its schema, initial
  values, `save` and `savedText`, and spreads `form.field(name)` on each `FormField`.
- `useInlineCreate` (components) runs "Créer « … »" in a picker.
- `lib/db.server.ts`: `loaded` (rows or a thrown load error), `saveRow`
  (insert or update by id) and `updateProfile`. `failureFor(scope, known)` in
  `lib/result.ts` maps SQLSTATEs and raised messages to the screen's error ids.
- Money helpers (`parseAmount`, `compareDecimal`, `amountForInput`) live in
  `lib/money.ts`; `amountForInput` takes the decimal separator from Intl.
- `lib/` never imports from `components/`.

**Alternatives Considered:**
- A form library (React Hook Form, TanStack Form) -> React 19's `useActionState` and
  zod already do the work (ADR-011); the repetition was wiring, not missing features.
- A generic data layer over supabase-js -> More than three helpers would hide the
  queries; `saveRow` narrows the builder with one cast, documented where it is.

**Consequences:**
- A new form or picker gets network errors, toasts and focus right without thinking
  about them, and a fix to that behaviour is made once.
- Forms take `savedText` instead of `onSaved`; the transaction form keeps an optional
  `onSaved` for the last account used.

### ADR-024: Dates stay native, after a calendar was tried (2026-11-05)

**Context:**
- The author found the native date popup "not cute" on desktop and asked whether shadcn
  had one that fits. A shared `DateField` was built the same day: a typed input with
  shadcn's Calendar (react-day-picker 10) in the field's popover, on phones too.
- Trying it, the author found the month and the year could not be chosen directly. The
  options were month and year views inside the popover (more custom code) or
  react-day-picker's month and year dropdowns (native selects again).

**Decision:**
- Back to `<input type="date">` everywhere, as ADR-011 says. The calendar, the shared
  field and react-day-picker were removed before being committed.

**Alternatives Considered:**
- shadcn's Calendar in a shared field -> No direct jump to a month or a year; fixing that
  meant either custom month and year views or native dropdowns inside a custom picker.
- shadcn's Date Picker as is (a button opening the calendar) -> No typing, and the same
  month and year problem.

**Consequences:**
- No date dependency; the OS picker on phones, the browser's on desktop, unthemed.
- A later proposal for a custom date picker should start from this ADR: it needs a
  direct month and year choice to be worth it.

### ADR-023: Generated database types, amounts kept as text (2026-11-03)

**Context:**
- Server functions read Supabase rows untyped and cast them (`as string`,
  `as unknown as CurrencyRow`). A renamed column compiled fine and failed at runtime.
- `supabase gen types` types every `numeric` column as `number`, which would invite a float
  into money code (ADR-004).

**Decision:**
- `npm run db:types` (from `src/app`) writes `src/lib/database.gen.ts` from the linked
  project. It is committed, and regenerated with every migration.
- `src/lib/database.ts` wraps it and turns the amount columns that are written
  (`accounts.opening_balance`) into strings. `getSupabase()` is typed with that wrapper.
- Reads keep casting amounts to text in the select (`balance::text`), which the client
  types as `string`.

**Alternatives Considered:**
- Hand-written row types -> Drift from the schema with no warning.
- `MergeDeep` from type-fest, as the Supabase docs suggest -> A dependency for one
  override (ADR-011).

**Consequences:**
- Column names, nullability and joins are checked by `tsc`; the casts are gone.
- A new numeric column that the app writes needs a line in `database.ts`.
- Forgetting `db:types` after a migration leaves the types one migration behind.

### ADR-022: Until real data exists, the project is the dev database (2026-11-03)

**Context:**
- ADR-017 made CI on `main` the only way to migrate, after a backup, because the project
  would hold real data. It holds none yet: the import is still ahead (phase 1).
- Local dev points at that project, so a new screen could not run locally until its
  migration reached `main`, which meant pushing untested work to `main`.

**Decision:**
- Until the first real import, the Supabase project is the development database.
  `npm run db:push` (from `src/app`) applies pending migrations from the laptop, with no
  backup step: there is nothing to back up.
- Work is tried in local dev before it reaches `main`. CI still runs the checks and
  pgTAP, and its migrate job finds laptop-pushed migrations up to date.
- Before the first real import, this is revisited: a separate dev project, or the backup
  gate back in front of every push.

**Alternatives Considered:**
- CI as the only path (ADR-017) -> Nothing can be tried locally before `main`.
- Laptop push gated on the GitHub backup workflow -> Ceremony for an empty database, and
  it needed the GitHub CLI.
- A second free project now -> The right shape once data exists; until then it is a
  second sign-in and TOTP setup for no gain.

**Consequences:**
- Supersedes "migrations only from CI" in ADR-017 until real data exists.
- A migration can be pushed, tried, and fixed with a follow-up migration the same day.
- The import milestone gains a step: decide the dev setup before importing.

### ADR-021: One account; unfinished work is tried in it (2026-11-02)

**Context:**
- ADR-017 planned a demo account with generated data (DEM-02) for trying features. The
  account was never created, and the demo work is deferred: the app stays private.

**Decision:**
- The owner's account is the only one. Unfinished screens are tried there.
- Migrations still run only from CI, after a backup (ADR-017).

**Alternatives Considered:**
- A demo account typed in by hand -> A second sign-in and second MFA setup to maintain
  for no gain while the owner is the only user.

**Consequences:**
- Supersedes the demo account in ADR-017; the rest of ADR-017 stands.
- Test entries land among real data. Delete them after trying a feature, or undo the
  import batch (IMP-05).
- The other-user isolation is proven by pgTAP only, not by a second live account.

### ADR-020: coolicons for every icon, categories included; no emoji (2026-11-02)

**Context:**
- The logo is coolicons' `pig-fill`. The author wants every icon from the same set, and
  category icons too, instead of emoji (CAT-07, ADR-013).
- coolicons now holds 18,870 icons (MIT). Its npm data package appeared three days ago, and
  the all-sets package `@iconify/json` is 640 MB.
- The CSP allows no third-party requests, and security.md forbids
  `dangerouslySetInnerHTML`.

**Decision:**
- `@iconify/react` (Iconify's own React component, about 630,000 downloads a week), used
  through its **offline** build: no fetching code, icons come only from data we register.
- The data is vendored: `src/app/src/icons/coolicons.json` holds only the icons the app
  uses, generated by one request to the Iconify API (command in that folder's README). The
  `IconName` type is derived from the file, so an unknown name fails type-checking.
- `lucide-react` (shadcn's default icon set) is removed. A shadcn component that imports it
  gets its icon swapped for a coolicons one.
- **Categories store a coolicons icon name**, not an emoji. The picker (CAT-07, phase 1)
  offers a curated subset of the set, vendored the same way and loaded only by the picker.
- `emoji-picker-react` and the Noto Color Emoji font (ADR-013) are dropped.

**Alternatives Considered:**
- `unplugin-icons` -> Compiles icons at build time, but for React it also needs `@svgr/core`
  and `@svgr/plugin-jsx`: three build dependencies for eight icons.
- `@iconify-json/coolicons` or `@iconify/json` -> Three days old, or 640 MB.
- Copying SVG paths into components by hand -> Works for one logo, does not scale to a
  category picker.
- Keep emoji for categories -> Two visual languages in one interface, plus a picker library
  and a font to carry.

**Consequences:**
- Supersedes ADR-013.
- One runtime dependency (`@iconify/react`) replaces three planned ones (emoji picker, emoji
  font, lucide).
- Adding an icon means re-running the curl command; forgetting it is a type error.

### ADR-019: French and English, without regional variants (2026-11-02)

**Context:**
- ADR-008 offered six locales (`fr-CA`, `fr-CH`, `fr-FR`, `en-CA`, `en-US`, `en-GB`) so
  numbers could follow each region. The author wants a choice of two languages.

**Decision:**
- `profiles.locale` is `fr` or `en`; the switcher is a FR / EN toggle.
- Formatting still needs a region: `fr` formats as `fr-CA`, `en` as `en-CA`, matching the
  home currency (`FORMAT_LOCALE` in `src/app/src/i18n/locales.ts`). A per-user format region
  can come later as a separate setting if it is ever wanted.
- The database change follows ADR-017's expand and contract: migration
  `20261102120000_locale_language_only` accepts both the new and the old values and
  normalises existing rows; a later migration drops the old values. The app reads old
  regional values (`toLocale`) in the meantime.

**Alternatives Considered:**
- Keep six locales -> Choices nobody asked for, mostly differing in thousands separators.
- Format with bare `fr` / `en` -> ICU then picks France and the United States: euro-style
  spacing and US dates for a Canadian-dollar ledger.

**Consequences:**
- Supersedes the locale list in ADR-008; its i18n library and approach stand.
- Swiss formatting (`1'234.50`) is gone, by choice.

### ADR-018: The session check verifies the token locally (2026-10-27)

**Context:**
- Every navigation runs `getSession` (root route). It called `getUser`, the MFA level and
  `listFactors`: two to three Auth requests per page, from the Ohio functions region.
- supabase-js `getClaims()` verifies the access token against the project's public
  signing key (JWKS, cached) with no Auth request, when the project signs with an
  asymmetric key. With the legacy shared secret it silently falls back to a request.

**Decision:**
- `getSession` and `setLocale` use `getClaims()`. An `aal2` token proves a verified factor
  (TOTP is the only factor enabled), so only an `aal1` session, on the MFA and set-password
  pages, still asks Auth for its factors.
- Password change and TOTP enrolment keep `getUser()`: rare, sensitive, worth the request.
- Access tokens last 15 minutes instead of 60 (`jwt_expiry = 900`).
- The project must sign with an asymmetric key (Dashboard, JWT Keys). If it still uses the
  legacy secret, rotate to an ECC key before relying on this.

**Alternatives Considered:**
- Keep `getUser()` on every page -> Notices a revoked session at once, at the cost of an
  Auth round trip on every navigation.
- Cache the session check in the app -> Our own invalidation logic for something Supabase
  already signs.

**Consequences:**
- A signed-in page load makes no Auth request; the JWKS is fetched once per function
  instance.
- A session revoked elsewhere (signed out on another device, user deleted) keeps passing
  the page check until its token expires, at most 15 minutes. RLS trusts the same token
  the same way, so the data is guarded exactly as before.
- Tokens refresh four times as often while the app is open; each refresh is one request.

### ADR-017: One Supabase project for development and real use (2026-10-27)

*The demo account is superseded by ADR-021 (one account); migrations only from CI by ADR-022.*

**Context:**
- The owner is the only user, the project is in Canada (`ca-central-1`, close to the Ohio
  functions region Netlify's free plan uses), and the free plan allows two projects.
- ADR-014 and ADR-016 planned a demo-only dev project plus a production project. For one
  person whose main goal is retiring a spreadsheet, that is a second database to keep in
  step for no user benefit.
- Without Docker on the laptop, migrations could not be tested locally anyway; CI already
  runs them on a fresh database.

**Decision:**
- One project, `money-tracker`, holds real data.
- **Two accounts in it:** the owner's, and a demo account with invented data (DEM-02) for
  developing and trying features. RLS keeps them apart; this is the multi-user isolation
  the app needs anyway, used every day.
- **Migrations are applied only by CI**, on `main`, after docs, app and database checks
  pass, and right after an encrypted backup (`ci.yml`: `backup` then `migrate`). There is
  no `db:push` from the laptop.
- **Migrations are additive** (expand, then contract in a later change): Netlify deploys
  the app and CI migrates the database independently, so either may land first.
- **Netlify deploy previews are off.** A preview runs unreviewed code against real data.
- The second free slot stays empty, for the public demo (DEM-01), which relaxes MFA and so
  must never share a database with real data.

**Alternatives Considered:**
- Separate dev and production projects (ADR-014, ADR-016) -> Safer for experiments, but
  a second schema to keep in step, and it uses the slot the public demo needs.
- Push migrations from the laptop -> Needs Docker for the dump that should precede it, and
  skips the CI checks.

**Consequences:**
- Supersedes the dev project in ADR-014 and the two-project layout in ADR-016.
- `.env.local` on the laptop points at the real project. The publishable key grants nothing
  without a session, and a session sees nothing without MFA.
- A bad migration reaches real data directly; the defences are pgTAP on a fresh database,
  the additive rule, and the backup taken minutes before.
- Work in progress is tried in the demo account, never in the owner's.

### ADR-016: Free plans until a real limit is hit (2026-10-27)

*The two-project layout is superseded by ADR-017 (one project).*

**Context:**
- ADR-001 assumed Supabase Pro (about US$25 a month) for backups and no pausing. The owner
  will stay on free plans, Supabase and Netlify, until something concrete forces a change.
- What the free Supabase plan does not give: backups you can download, and protection from
  pausing (a project with a week of inactivity is paused until restored by hand in the
  dashboard). It allows two active projects.
- What the free Netlify plan does not give: choosing the functions region. Functions run in
  US East (Ohio).

**Decision:**
- Two free Supabase projects: dev (demo data, ADR-014) and production. That uses both
  free slots.
- **Our nightly encrypted dump is the only backup**, so it is a blocker: the backup
  workflow is enabled and one restore is tested before any real data enters production
  (before the Aspire import, IMP-01).
- A pause is accepted as an annoyance: restore it from the dashboard. Nothing is built to
  keep the project awake artificially.
- Upgrade triggers, each one a new ADR when it happens: the database nears 500 MB, pauses
  become a real problem, page latency from the Ohio functions region is noticeable in use,
  or invitations need more email than the built-in sender allows (that last one is solved
  with a free custom SMTP sender, not a plan change).

**Alternatives Considered:**
- Supabase Pro from the start -> Daily backups and no pausing, for a cost the project does
  not need to carry yet.
- Production on dev's project -> One slot freed, but demo data and real data would share a
  database and keys.

**Consequences:**
- Supersedes the plan choice in ADR-001 and the Pro production project in ADR-014.
- The backup workflow moves from "nice to have in phase 0" to a gate on the first import.
- Data loss risk rests on one GitHub Action and one offline key. The restore test is what
  makes it real.

### ADR-015: A per-request CSP nonce, set by the server entry (2026-10-27)

**Context:**
- TanStack Start renders inline hydration scripts. A CSP of `script-src 'self'` blocks
  them; `'unsafe-inline'` would let any injected script run, which is the case a CSP exists
  to stop.
- Netlify's `netlify.toml` headers apply to static files, not to responses from the
  server function that renders every page, and they cannot vary per request anyway.
- The router accepts `ssr.nonce` and stamps it on every script and preload it renders.

**Decision:**
- A custom server entry (`src/app/src/server.ts`) generates 16 random bytes per request,
  passes them to the Start handler as request context, and sets the CSP header on the HTML
  response: `script-src 'nonce-…' 'strict-dynamic'`, `connect-src 'self'`,
  `frame-ancestors 'none'`, `object-src 'none'`, `base-uri 'none'`.
- The router reads the nonce with `getGlobalStartContext()`.
- The same entry sets HSTS, nosniff, referrer and permissions policies on every response.
  `netlify.toml` repeats them for static assets.
- In the Vite dev server the CSP is off, since Vite injects un-nonced scripts there.

**Alternatives Considered:**
- `'unsafe-inline'` for scripts -> Defeats the CSP's main purpose.
- Hashes of the inline scripts -> The hydration payload changes per page and per user.
- Carrying the nonce as a request header -> Rebuilding the runtime's `Request` fails on
  its private fields; the request context is the supported channel.

**Consequences:**
- Verified on a production build: every script and modulepreload carries that request's
  nonce, and a new nonce is generated per request.
- `style-src` keeps `'unsafe-inline'` for the inline `style` attributes Radix sets.
- A third-party script would need an explicit CSP change, which is the point.

### ADR-014: Develop against a hosted dev project; database tests run in CI (2026-10-27)

*Production on the Pro plan is superseded by ADR-016; the separate dev project by ADR-017.*

**Context:**
- The development machine runs macOS 12 on Intel. Current Docker Desktop no longer supports
  it, and the local Supabase stack (`supabase start`, `supabase test db`) needs Docker.
- Installing an unsupported Docker build on a machine that will hold financial exports is
  the wrong trade.

**Decision:**
- One hosted Supabase project, **dev**, on a free organization, holding demo data only. It
  serves local development and Netlify deploy previews. Migrations reach it with
  `supabase db push` from `src/`.
- GitHub Actions runs the database checks on every push: `supabase db start` (Docker is
  available there), `supabase db lint`, `supabase test db`.
- **production** is a separate project on the Pro plan. Nothing but `main` deploys to it,
  and no migration is pushed there before CI is green.

**Alternatives Considered:**
- An older Docker Desktop or Colima on macOS 12 -> Unsupported software, and a local
  database stack competing for an older machine's memory.
- Separate dev and preview projects -> A free organization allows two projects; one demo
  project covers both while there is one developer.

**Consequences:**
- pgTAP results come back from CI, not instantly. A migration is written, pushed to a branch,
  and checked there before `db push` to dev.
- The dev project's keys are low-stakes (demo data), which makes it safe to use from
  `.env.local` and from previews.
- If the machine changes, `supabase start` works again and this ADR is superseded.

### ADR-013: Google-style emoji from a self-hosted font (2026-10-27)

*Superseded by ADR-020 (coolicons instead of emoji).*

**Context:**
- CAT-07 asks for emoji-picker-react in the Google style. In that mode the library loads
  every emoji as an image from the jsDelivr CDN, which the Content-Security-Policy blocks
  (security.md), and which tells a third party when the app is in use.
- The emoji is stored as text, so outside the picker it renders in the device's own style
  anyway: Google look in the picker, Apple or Microsoft look everywhere else.

**Decision:**
- Keep emoji-picker-react (asked for by name, maintained), with `emojiStyle="native"`: it
  draws characters, not images.
- Serve Google's emoji font, Noto Color Emoji, from our own origin through
  `@fontsource/noto-color-emoji`, and put it first in the emoji font stack. Fontsource ships
  it split by `unicode-range`, so the browser downloads only the slices that are used.
- The picker and every place an icon is shown use that stack, so the Google style is the
  same everywhere, on every device.

**Alternatives Considered:**
- Picker in Google image mode with `getEmojiUrl` pointing at self-hosted images -> Works
  inside the picker only, and means hosting thousands of PNGs.
- Allow jsDelivr in the CSP -> A third-party request on a financial app, for decoration.
- emoji-mart -> Popular, but releases have been sparse; no advantage here.

**Consequences:**
- CSP stays `self` plus Supabase.
- Windows, which renders flags as letters, shows real flags.
- One more small dependency (the font package), listed in ADR-011.

### ADR-012: Writes that touch several rows are Postgres functions (2026-10-27)

**Context:**
- supabase-js talks to PostgREST, one HTTP request per call, with no transaction spanning
  calls.
- Several writes must be atomic: a transfer (two legs and a fee), a transaction with its
  splits (the sum check is a deferred constraint, so both must land in one transaction), an
  import batch, an undo.
- Netlify Functions time out after about 10 seconds by default and accept request bodies up
  to about 6 MB.

**Decision:**
- Any write touching more than one row is a PL/pgSQL function called with `.rpc()`:
  `save_transaction`, `save_transfer`, `delete_transfer`, `import_batch`, `undo_import_batch`.
- These functions are `security invoker`, so RLS applies exactly as for a direct query, and
  set `search_path = ''`.
- The server function still validates input with Zod first (ADR-006); the SQL function
  re-checks the invariants it owns (sums, transfer shape, currencies).
- The import sends all rows in one request (about 10,000 rows is 1 to 2 MB of JSON) to one
  `import_batch(jsonb)` call, which commits or rolls back as a whole inside Postgres.

**Alternatives Considered:**
- A direct Postgres connection from the server with real transactions -> RLS would only
  apply if every query set the role and JWT claims by hand (ADR-006).
- Several calls and a compensating delete on failure -> Not atomic; a crash between calls
  leaves half a transfer.
- Chunked upload into a staging table -> Needed only past the body limit, far beyond one
  person's history.

**Consequences:**
- Business rules for money movement live in SQL, versioned in migrations and tested with
  pgTAP.
- Single-row reads and writes stay plain supabase-js calls.
- A history larger than the body limit would need staging; not expected.

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
  | class-variance-authority, clsx, tailwind-merge, tw-animate-css | What shadcn components are written with: variants, class merging (`cn` in `src/lib/utils.ts`), enter and exit animations |
  | TanStack devtools (dev only) | Router inspector in `npm run dev`; the devtools Vite plugin strips it from the build |
  | i18next, react-i18next | Plurals, interpolation and server-rendered language switching for FR and EN (ADR-008) |
  | Recharts (through shadcn charts) | Line, bar, area and donut charts with tooltips and responsive sizing |
  | react-aria-components, react-aria, @internationalized/date | The date range field (ADR-027): typed segments, a range calendar, tooltips; ranges only, single dates stay native |
  | @iconify/react (offline build) | coolicons for every icon, from a vendored file (ADR-020) |
  | @fontsource-variable/nunito | Nunito, self-hosted: no request to Google Fonts, no CSP change |
  | @fontsource-variable/inconsolata | Inconsolata, the accent font, self-hosted the same way |

**Alternatives Considered:**
- The full set from the correction prompts (TanStack Query, Zustand, react-hook-form,
  a decimal library) -> Each is reasonable alone; together they are a lot of
  surface for an app this size.
- No UI kit, native `<dialog>` and the Popover API -> Good primitives, but the searchable
  grouped combobox (CAT-06, CUR-03) still needs custom keyboard and ARIA work.

**Consequences:**
- About nine runtime dependencies instead of fifteen.
- shadcn 4 imports `cn` from its own new package (`cn`, 0.x). Not adopted: the components
  use `src/lib/utils.ts` (clsx + tailwind-merge), and a lint rule rejects `import ... from
  'cn'`. After each `shadcn add`, point the import back and uninstall `cn`.
- shadcn components depend on `radix-ui`, the single Radix package.
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

*The six regional locales are superseded by ADR-019 (FR and EN only).*

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
- **Every command runs from `src/app/`.** The Supabase CLI is a dev dependency there, and
  it runs as `npx supabase --workdir .. <command>` so it finds `src/supabase/`.

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
- Sign-in, MFA enrolment and the MFA challenge are server functions too. The browser bundle
  contains no Supabase client and no key at all; CI fails if one appears in `dist/client`.
- With no client-side reader, the session cookies are `httpOnly`, `secure` and
  `SameSite=Lax`.

**Alternatives Considered:**
- Browser to Supabase directly -> Less code, but every validation rule must also live in
  SQL, and any table that slips through RLS is exposed to every signed-in user.
- Server connects to Postgres directly (Drizzle + a pooled connection) -> Type-safe SQL,
  but RLS only applies if every query sets the role and JWT claims by hand; easy to forget
  once.

**Consequences:**
- Two walls: Zod validation in the server function, RLS in the database. Multi-row writes
  go through `security invoker` SQL functions, which keep RLS in force (ADR-012).
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

*The Pro plan is superseded by ADR-016 (free plans).*

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
