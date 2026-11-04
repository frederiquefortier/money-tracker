# Learnings

Document new concepts, techniques, and knowledge gained. Reference this file to build on past learning and find resources for deeper understanding.

<!-- Newest first: a new entry goes directly below this line. Template at the bottom. -->

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
- `src/app/src/lib/color.ts` and its tests; the twenty quick picks in spec 12.

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
