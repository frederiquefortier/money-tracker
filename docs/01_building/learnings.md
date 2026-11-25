# Learnings

Document new concepts, techniques, and knowledge gained. Reference this file to build on past learning and find resources for deeper understanding.

<!-- Newest first: a new entry goes directly below this line. Template at the bottom. -->

### 2026-11-25 - How Frankfurter v2 answers

**What Was New:**
- Frankfurter's v2 API, probed to give CLP and GTQ a history (ADR-069).

**Key Points:**
- `/v2/rates?base=EUR&from=…&to=…&quotes=…` returns a flat list of `{date, base, quote, rate}`. Like v1, it starts on the last day before `from`.
- A year of every currency is about 68,000 rows, 4.3 MB and 25 s, crypto included; `quotes` keeps it small.
- An unknown code in `quotes` fails the whole query with a 422; `/v2/currencies` lists the codes, typed `currency`, `crypto` or `metal`.
- A start date in the future answers an empty list, not v1's 404.
- Some central banks publish on weekends, so a day can hold a few currencies only.

**Sources:**
- api.frankfurter.dev, `/v2/currencies`, `/v2/providers`, `/v2/rates`

**Where to Learn More:**
- `/v2/providers` lists each central bank, its rate type and its currencies.

**Applied In:**
- `src/app/src/lib/currencies/rate-sources.ts`, `src/app/netlify/functions/rates.ts`.

### 2026-11-18 - Return without deposits (modified Dietz)

**What Was New:**
- A change in value counts deposits as growth. The return is the change less the net money put in, over the start value plus each flow weighted by the share of the period it was invested (modified Dietz).
- A time-weighted return chains sub-period returns and needs a value at every flow; with values entered months apart it misreads each deposit as a loss until the next value.

**Applied In:**
- ADR-062, `returnOver` in `net-worth-range.ts`.

### 2026-11-13 - Planning, transitions and hydration

**What Was New:**
- A `language sql` function with a `set` clause is never inlined and is planned with unknown arguments; plpgsql with `plan_cache_mode = force_custom_plan` plans each call with real ones.
- TanStack Router navigates in a React transition: a pending component shows only in a new Suspense boundary.
- Hydration does not rerun `beforeLoad`: what the first render needs must be loaded in the client entry.
- A router hook without `select` re-renders on every navigation.
- Each Supabase request costs about 200 ms here, however small.

**Applied In:**
- ADR-053, ADR-054.

### 2026-11-12 - pg_safeupdate and execute rights on what a trigger calls

**What Was New:**
- Supabase's API role has pg_safeupdate loaded: an UPDATE or DELETE without a WHERE clause fails with error 21000, whatever the table, a temporary one included. `where true` satisfies it. A SQL console run as the owner does not show it, so a function only tried there can still fail from the app.
- A trigger function needs no execute right to be fired, but a function it calls runs with the caller's rights, so that one needs the right (or the trigger function must be security definer).

**Applied In:**
- `import_holdings` (ADR-050) and `check_transaction_holding`, see bugs.md.

### 2026-11-09 - A bottom calendar inside a Radix sheet with react-aria

**What Was New:**
- react-aria's `ModalOverlay` and `Modal` portal to the page by default. To cover only the
  sheet a field is in, the field wraps its picker in `UNSAFE_PortalProvider` with the
  sheet's own element (`useSheetContainer`), and the overlay is `absolute` instead of
  `fixed`. Inside Radix's dialog this also keeps focus and taps inside its content.
- The same container idea works for a Radix dialog: the content hands its element down
  (`OverlayContainerProvider`), the overlay is `absolute` inside it, and the dialog's Escape
  is ignored when it comes from inside a react-aria overlay (`inAriaOverlay`).
- A range band with no gap: the cell fills its column (`table-fixed`, no border spacing), the
  band is a gradient from the middle of the first day to the middle of the last, and the
  round ends are an inner circle.
- Inside a `DateRangePicker`, every `Button` inherits the trigger's props. A ✕ or a close
  button must opt out with `slot={null}`.
- A Gmail-style tag from any hex: keep the hue in OKLCH, a pale tint with dark text for
  light mode, a deep tint with pale text for dark (`tagColors`).

**Where to Go Deeper:**
- `components/forms/date-range-field.tsx`, ADR-027, `lib/shared/color.ts`.

### 2026-11-09 - Passing a typed link to a shared component

**What Was New:**
- `ListRow` takes the link its row opens. The people row picks one of two routes, and
  that union did not type-check against the generic `ValidateLinkOptions`.

**Key Points:**
- `LinkOptions` from `@tanstack/react-router`, used as a plain prop type, still checks
  `to` against the registered routes and rejects a param key the route does not have.
  It does not insist on every required param, which the route's own `Link` would.
- `ValidateLinkOptions` with a type parameter checks everything, but only for one
  literal at a time; a conditional between two routes fails.

**Sources:**
- TanStack Router docs, "Type utilities" (`ValidateLinkOptions`, `linkOptions`).

**Where to Learn More:**
- TanStack Router docs, "Link options".

**Applied In:**
- `src/app/src/components/lists/list-row.tsx`.

### 2026-11-05 - Text fields match :focus-visible on a click

**What Was New:**
- With the outline fixed, it showed on every click into a field, the receipt's amount
  included, though buttons kept it for the keyboard.

**Key Points:**
- Browsers decide `:focus-visible` per element: a button clicked does not match, a text
  input does (it expects typing, so the browser shows where the caret is).
- To show outlines on keyboard navigation only, `useKeyboardFocus` sets
  `<html data-keyboard>` on a Tab and removes it on the next pointer press, and a base
  rule turns the outline off without it. Listening in the capture phase catches the
  keys before a field or a dialog stops them.

**Sources:**
- MDN, `:focus-visible` (the heuristics each browser applies).

**Where to Learn More:**
- WCAG 2.4.7 Focus Visible: the keyboard must always see focus; mouse users need not.

**Applied In:**
- `src/app/src/lib/use-keyboard-focus.ts`, `styles.css` (base layer).

### 2026-11-05 - Tailwind 4 outlines take their style from a variable

**What Was New:**
- Every focus outline in the app was invisible (bugs.md, same day).

**Key Points:**
- In Tailwind 4, `outline-none` sets `--tw-outline-style: none` as well as
  `outline-style: none`, and the width utilities (`outline-2`) set
  `outline-style: var(--tw-outline-style)`. On the same element, the width alone never
  brings the outline back: add `outline-solid` in the same variant.
- An element without `outline-none` gets `solid`, the variable's initial value, which is
  why the colour swatch's wrapper (`has-[:focus-visible]:outline-2`) showed its outline.

**Sources:**
- The CSS `tailwindcss` compiles for `outline-none` and `focus-visible:outline-2`,
  checked with its `compile` API.

**Where to Learn More:**
- Tailwind CSS docs, "outline-style" and "outline-width".

**Applied In:**
- `focusRing` in `src/app/src/lib/utils.ts`, the button in `components/ui/button.tsx`.

### 2026-11-04 - Deferred constraint triggers, and testing them

**What Was New:**
- A transaction and its splits must sum to the same amount, but they are written by
  separate statements. A constraint trigger declared `deferrable initially deferred`
  waits until the commit to check, so the rows can arrive in any order.

**Key Points:**
- Only constraint triggers (`create constraint trigger ... after ... for each row`) can be
  deferred; plain triggers fire at the end of each statement, even inside a function.
- The trigger re-reads the current rows rather than trusting `new`, so it does not matter
  which of several queued events fires last.
- A pgTAP file rolls back, so deferred checks never run on their own in a test.
  `set constraints all immediate` runs every queued check at once; switching back to
  `deferred` right after keeps the next statements behaving as in a real request. The
  tests wrap both in a temporary `pg_temp.check_now()`.
- Unnamed check constraints on `transactions` are named `transactions_check`,
  `transactions_check1`, and so on, and a trigger cannot reuse that name.
- `results_eq` takes a single query; `throws_ok` and `lives_ok` accept several statements.

**Sources:**
- PostgreSQL documentation, CREATE TRIGGER (constraint triggers) and SET CONSTRAINTS

**Where to Learn More:**
- pgTAP documentation, throws_ok and results_eq

**Applied In:**
- `src/supabase/migrations/20261104150000_transactions.sql` and
  `src/supabase/tests/database/07_transactions.test.sql`.

### 2026-11-04 - Accent-insensitive unique names in Postgres

**What Was New:**
- Merchant names are unique ignoring case and accents, so "Café Olimpico" and "cafe
  olimpico" are one merchant, checked by the database itself.

**Key Points:**
- `unaccent()` is only `stable` (its dictionary is looked up by name at run time), so an
  index expression cannot use it directly.
- The usual fix is an `immutable` SQL wrapper that names the dictionary explicitly,
  `unaccent('extensions.unaccent'::regdictionary, …)`, with an empty search path. The
  index is then on `(user_id, fold_name(name))`.
- `on delete set null (default_category_id)` (Postgres 15+) clears one column of a
  composite foreign key; plain `set null` would also null `user_id`.

**Sources:**
- PostgreSQL documentation, F.48 unaccent; CREATE TABLE, referential actions

**Where to Learn More:**
- PostgreSQL documentation, Function Volatility Categories

**Applied In:**
- `src/supabase/migrations/20261104120000_merchants.sql` and its pgTAP test.

### 2026-11-03 - OKLCH for colour variations, WCAG contrast for icons

**What Was New:**
- Category colours are stored as hex but varied in OKLCH (lightness, chroma, hue). A
  sub-category's automatic colour keeps its parent's hue and steps the lightness.
- Whether the icon is white or dark is computed from contrast, not chosen by hand.

**Key Points:**
- OKLCH is perceptually even: the same lightness step looks like the same change on red
  and on blue, which HSL does not give.
- Not every OKLCH colour exists in sRGB. Lowering the chroma until it fits keeps the
  lightness and hue.
- WCAG 1.4.11 asks 3:1 for non-text content. Contrast is
  `(L1 + 0.05) / (L2 + 0.05)` on relative luminance, from linearised sRGB.

**Sources:**
- Björn Ottosson, "A perceptual color space for image processing" (the OKLab matrices)
- WCAG 2.2, Understanding 1.4.11 Non-text Contrast

**Where to Learn More:**
- CSS Color 4, gamut mapping in `oklch()`

**Applied In:**
- `src/app/src/lib/color.ts` and its tests; the quick picks in `lib/categories/category.ts`.

### 2026-11-03 - Sheet animations and TanStack Router loading

**What Was New:**
- Why the sheet slid in diagonally and closed without animating, and why each click felt
  slow.

**Key Points:**
- tw-animate's `slide-in-from-bottom` and `md:slide-in-from-right` each set their own
  translate variable; the `md` one does not cancel the other, so from `md` up the panel
  moved on both axes. Plain keyframes picked by a media query avoid it.
- Radix plays an exit animation only while the content stays mounted. Navigating away on
  close unmounted it at once. Closing the sheet first and navigating in
  `onCloseAutoFocus`, which fires after the animation, keeps it.
- `beforeLoad` runs in series down the route tree, before any loader. A data fetch there
  delays every page below it. A loader runs beside the child's loader and can be cached
  with `staleTime`.
- `defaultPreloadStaleTime: 0` treats data preloaded on hover as stale at once, so the
  click loads it again.

**Sources:**
- TanStack Router guide, "Data Loading" (beforeLoad, staleTime, preloading)
- Radix Dialog documentation, `onCloseAutoFocus` and animation

**Where to Learn More:**
- React documentation, `useActionState` and transitions

**Applied In:**
- `src/components/route-sheet.tsx`, `src/styles.css` (`.sheet-panel`), `src/routes/_authed.tsx`.

### 2026-11-03 - Numeric over PostgREST, and pgTAP without Docker

**What Was New:**
- Two things met while building the accounts screens and testing them on the dev database.

**Key Points:**
- PostgREST sends `numeric` columns as JSON numbers, which JavaScript parses into floats.
  Selecting `balance::text` returns the exact decimal string instead (ADR-004).
- `supabase db query --linked` goes through the Management API and returns only the last
  statement that produces rows, even when a `rollback` follows. A pgTAP file can still run
  there: collect each TAP line into a temporary table and select it just before the
  file's own `rollback`. `npm run db:test` does this.
- The same command reads a leading `--` comment in an SQL argument as a flag; passing the
  SQL as a file (`-f`) avoids it.
- Tests that share the dev database must not assume a table is empty: delete what they
  depend on inside their transaction (the rates tables in `02` and `03`).

**Sources:**
- PostgREST documentation, "Casting columns"
- `supabase db query --help`

**Where to Learn More:**
- pgTAP documentation, "Using pgTAP" (plans, `finish`)

**Applied In:**
- `src/app/src/server/accounts.ts`, `src/app/scripts/db-test.ts`.

### 2026-11-03 - How Frankfurter and HexaRate answer

**What Was New:**
- The two rate providers behind ADR-009, probed while writing the rates job.

**Key Points:**
- Frankfurter (`api.frankfurter.dev/v1`) returns daily EUR rates for any range in one
  call: 2018 to today is about 2,260 days and 1.1 MB, not thinned out to weeks.
- A range answer starts on the last business day before the start date (`2018-01-01..`
  begins on 2017-12-29), so the job drops days before the date it asked for.
- A start date after the last published day answers 404 `{"message":"not found"}`. For a
  daily job that is the normal "nothing new yet", not an error.
- Frankfurter now covers more than the ECB's list in older years (ARS, DZD, MAD in 2018);
  the set on the latest day is what is still published.
- HexaRate (`/api/rates/latest/EUR?target=XOF`) answers `mid`, `unit` and a `timestamp`;
  an unknown code is a 422 with `INVALID_CURRENCY`. That 422 is how CUR-02 tells "not a
  currency" from "provider down".
- Node's `Intl.supportedValuesOf('currency')` gives 162 codes in current use, and
  `Intl.DisplayNames` names them in French and English: enough to build the `currencies`
  table without a third-party list.

**Sources:**
- frankfurter.dev documentation
- hexarate.paikama.co
- MDN, "Intl.supportedValuesOf()" and "Intl.DisplayNames"

**Where to Learn More:**
- ECB, "Euro foreign exchange reference rates" (publication time and holidays)

**Applied In:**
- `src/app/src/lib/rates.ts`, `src/app/netlify/functions/rates.ts`, the currencies migration.

### 2026-11-02 - Sec-Fetch-Site, and what SameSite=lax leaves open

**What Was New:**
- SameSite=lax cookies stop another site from sending a write with the user's session. They
  do not stop login CSRF: a forged sign-in needs no cookie, it sets one (the attacker's).

**Key Points:**
- Browsers send `Sec-Fetch-Site` on every request: `same-origin`, `same-site`, `cross-site`
  or `none` (typed URL, bookmark). Pages cannot set or forge it.
- Refusing writes (anything but GET and HEAD) marked `cross-site` or `same-site` closes login
  CSRF and every other forged write in a few lines. GET stays open, so links from emails
  still land.
- `netlify.app` is on the public suffix list, so another Netlify site is `cross-site`, not
  `same-site`; refusing `same-site` too costs nothing here.
- A request without the header (old browsers, curl) is let through: it is not a browser
  carrying someone else's cookies.

**Sources:**
- MDN, "Sec-Fetch-Site"
- OWASP Cheat Sheet, "Cross-Site Request Forgery Prevention" (Fetch Metadata headers)

**Where to Learn More:**
- web.dev, "Protect your resources from web attacks with Fetch Metadata"

**Applied In:**
- `src/app/src/server.ts`, security.md (App and server, rule 7).

### 2026-11-02 - A password inside a connection string is part of a URL

**What Was New:**
- The nightly backup failed to authenticate with a correct database password. The password
  contained special characters, and it sat inside `SUPABASE_DB_URL`
  (`postgresql://user:password@host:port/db`).

**Key Points:**
- A connection string is a URL. In the password, `@ : / ? # [ ] %` (and often `&`, `+`,
  spaces) are URL syntax: `@` ends the credentials, `:` starts a port, `#` starts a fragment,
  `%` starts an escape. The parser does not fail loudly; it reads a different user, host or
  password, and the server answers "authentication failed", which points at the password
  and hides the real cause.
- Two fixes: percent-encode the password
  (`node -e 'console.log(encodeURIComponent(process.argv[1]))' 'the-password'`), or use a
  long password of letters and digits only, which never needs encoding. Chosen: the second,
  32+ characters from the password manager. Length gives the strength the symbols would
  have.
- Test a connection string locally before putting it in a CI secret:
  `npx supabase --workdir .. migration list --db-url "…"` reads only, needs no Docker, and
  its error says which part is wrong.
- The database password is separate from the app's keys: resetting it affects only what
  connects to Postgres directly (here, the backup and migrate jobs).

**Sources:**
- RFC 3986, section 3.2.1 (user information) and 2.1 (percent-encoding)
- PostgreSQL docs, "Connection URIs" (libpq connection strings)

**Where to Learn More:**
- The same trap exists in every URL-shaped secret: Redis, MongoDB, SMTP and AMQP URLs.

**Applied In:**
- `SUPABASE_DB_URL` (GitHub secret) used by `backup.yml` and the `migrate` job in `ci.yml`;
  the warning added to [setup.md](setup.md), step 4.

---

## Format

### YYYY-MM-DD - Learning Title

**What Was New:**
- Core concept or technique learned
- Context of when it came up

**Key Points:**
- Important details to remember
- How it works or why it matters

**Sources:**
- Documentation links
- Articles or tutorials referenced
- Code examples or repositories

**Where to Learn More:**
- Advanced resources
- Related topics to explore
- Practice exercises or projects

**Applied In:**
- Where/how this was used in practice (optional)
