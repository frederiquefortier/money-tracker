# Security

Financial data, multiple users, a public URL. This file is the threat model and the
checklist; [decisions.md](decisions.md) records the choices.

## Is Supabase up to it?

Yes, for this app. The platform side is solid: Postgres, encryption at rest and TLS in
transit, SOC 2 Type II, a choice of region, TOTP multi-factor auth built in, row-level
security as a first-class feature. Banks are not in the picture: the app never stores bank
credentials or account numbers, only what the user types or imports from a CSV.

The real risk is **configuration**. Supabase's own default architecture lets the browser
talk to the database through an auto-generated API, so a single table without a correct
row-level security (RLS) policy is readable by any signed-in user. Most Supabase data leaks
in the wild are exactly that. Everything below is about making that mistake hard to make and
easy to catch.

Two plan-level caveats:

- **The free plan has no backups you can download** and pauses a project after a week of
  inactivity. The project stays on it anyway (ADR-016), which makes our own encrypted dump
  the only backup (see Backups).
- **Pick the region at creation; it cannot be changed later.** Choose the one closest to
  where the data's owner lives (Central EU / Zurich if offered, otherwise Frankfurt).

## Threat model

| Threat | Likelihood | Mitigation |
|---|---|---|
| User A reads or edits user B's rows | The classic Supabase leak | RLS on every table, policies tested in CI (pgTAP), composite foreign keys so a row cannot point at another user's category or account |
| Stolen password | Medium | TOTP MFA required by policy (`aal2`), not just offered; sign-up closed |
| Secret key leaks to the browser | Medium (one wrong `import`) | Secret key used only in server modules; build check that no `sb_secret_` string ends up in the client bundle |
| XSS steals the session | Low with React, higher with emoji/HTML inputs | Strict Content-Security-Policy in `netlify.toml`, no `dangerouslySetInnerHTML`, emoji validated as emoji |
| Deploy preview hits production data | High by default on Netlify | Deploy previews are off: there is one database, holding real data (ADR-017) |
| Supabase account takeover | Low | MFA on the Supabase and Netlify accounts themselves, GitHub too |
| Data loss | Medium over years | Nightly encrypted dump in GitHub (30 days), monthly dump and CSV export on an offline drive; restore tested before real data arrives (Backups) |
| Vendor disappears or changes pricing | Low, long horizon | Plain Postgres with SQL migrations in Git; a dump restores anywhere |

## Rules

### Database

1. **RLS enabled on every table, in the same migration that creates it.** No exceptions,
   including lookup tables (those get a read-only policy).
2. **Every user-owned table has `user_id uuid not null default auth.uid()`** and the policy
   `user_id = (select auth.uid())` for select, insert, update and delete. The `select`
   wrapper is Supabase's recommended form; it is evaluated once per query instead of per row.
3. **A restrictive policy requires MFA**: `(select auth.jwt()->>'aal') = 'aal2'`. A session
   that has not passed the second factor sees nothing.
4. **Foreign keys between user tables include `user_id`** (`(user_id, category_id)
   references categories (user_id, id)`). A plain `category_id` FK only checks that the
   category exists, not that it belongs to the same user. See ADR-005.
5. **Views are `security_invoker = true`** and functions are `security invoker` unless
   there is a written reason. A `security definer` function sets `search_path = ''`.
6. **Global tables** (`currencies`, `exchange_rates`, region data) are readable by
   authenticated users and writable only by the server with the secret key.
7. **`supabase db lint` and the Supabase security advisor run clean** before a migration
   ships. pgTAP tests (`supabase test db`) assert, for every table, that a second user
   sees zero rows.

### App and server

1. **The browser never talks to the database directly.** All reads and writes go through
   TanStack Start server functions, which call Supabase with the signed-in user's session so
   RLS still applies. RLS is the guarantee; the server layer is the second wall and the place
   for validation.
2. **Every server function validates its input with Zod** and derives the user from the
   session, never from the payload.
3. **The secret key** (`SUPABASE_SECRET_KEY`) is only for jobs that are not acting for a
   user: fetching exchange rates, the scheduled recurring-transaction run. It lives in Netlify
   environment variables scoped to Functions.
4. **Security headers** set by the server entry on every page (ADR-015): a CSP with a
   per-request nonce and `'strict-dynamic'`, HSTS, `frame-ancestors 'none'`,
   `Referrer-Policy: same-origin`, `Permissions-Policy` locking off camera, mic, geolocation.
   `netlify.toml` sets the same headers on static assets.
5. **Third-party calls** (the rates API) happen server-side only. Fonts, emoji included,
   are served from our own origin (ADR-013). The browser's CSP allows
   only our own origin and Supabase.
6. **No financial data in logs or error messages**, and none in analytics. No third-party
   analytics at all while the app is private.

### Auth

- Email and password plus TOTP. Sign-up disabled (`config.toml`, applied with
  `npx supabase --workdir .. config push`); new users by invitation from the dashboard.
- **Invitation flow:** the email links to `/auth/confirm`, which only shows a button. The
  one-time token is spent by that button's POST, never by the GET, because email security
  scanners open links before the person does. The invitee then sets a password (same rule as
  `config.toml`, checked in the form and by Supabase) and must enrol TOTP before seeing
  anything. Changing a password later requires `aal2`, and sends a notification email.
- **Password reset** uses the same landing page and button. The forgot-password form gives
  the same answer whether or not the address has an account, and Supabase sends at most one
  reset email per address per minute. A reset link opens an `aal1` session only: if the
  account has TOTP, the code is required before the new password is accepted, so a stolen
  inbox alone cannot take the account.
- **Brute force (open):** Supabase rate-limits sign-in and code attempts per IP, but every
  auth call now comes from the server, so Supabase sees the server's IP. A per-IP and
  per-email throttle of our own is needed before anyone but the owner uses the app.
- A custom SMTP sender for auth email. Supabase's built-in sender is rate-limited and only
  delivers to members of the Supabase organization, so it can invite the owner but nobody
  else.
- Access tokens last 15 minutes, with refresh rotation. The page-level session check
  verifies them locally (ADR-018), which requires an asymmetric JWT signing key on the
  project.
- **No recovery codes yet.** supabase-js has MFA recovery codes behind an experimental
  flag; not used until they are stable. Instead, scan the enrolment QR code into two apps
  (phone and password manager) at setup: one secret, two devices. A user who loses both is unlocked by removing the factor in
  the Supabase dashboard, after verifying them out of band. A self-service recovery flow is
  needed before anyone but the owner uses the app.

### Backups

Needed from the day the app becomes the record, which is the day the spreadsheet stops
being updated. Until then the spreadsheet is the backup. The free plan has no Supabase
backups (ADR-016), and one database holds real data (ADR-017).

Three copies, two kinds:

| Copy | What | Where | How often | Kept |
|---|---|---|---|---|
| Live | The database | Supabase (`ca-central-1`) | | |
| Cloud | Encrypted `pg_dump` (roles, schema, data) | GitHub Actions artifact, private repo | Nightly, and before every migration | 30 days |
| Cold | The latest encrypted dump, plus the app's CSV export (IMP-04) | External drive, kept offline | Monthly, by hand | Indefinitely |

- **The dump** is full fidelity: everything Postgres holds, including auth users. It is
  encrypted with `age` to a public key (`BACKUP_AGE_RECIPIENT`); the database connection
  string is a GitHub secret.
- **The CSV export** is the second kind on purpose. It is readable in any spreadsheet and
  restores through the app's own import, so it does not depend on Postgres, Supabase or the
  `age` key. It does not hold auth users or MFA factors: restoring from it means inviting
  the account again.
- **The private key** is the single point of failure for every dump. It lives in the
  password manager, plus a paper copy stored apart from the drive. Never in GitHub, never in
  the repo, never on the drive next to the dumps.

**Monthly routine** (first weekend of the month, about five minutes):
1. Download the latest `backup` artifact from GitHub Actions to the drive.
2. Export from the app (IMP-04) to the same drive, in a folder named for the month.
3. Every third month, open one dump with the private key to prove the key still works.

**Restore tests:** once before the first real import (the gate in roadmap phase 1), then
after every major schema change. A test restores the dump into a scratch Postgres in CI
(Docker is available there) and checks row counts against the app's export.

**Upgrade path:** if the monthly download becomes a chore, the nightly job uploads to
S3-compatible storage with long retention (Cloudflare R2 or Backblaze B2), as a new ADR.

### What is deliberately not done

- **No column-level encryption of amounts.** Every useful feature here (totals, medians,
  budgets) is an aggregation in SQL; encrypting amounts would move all of that into the app
  and the server would still hold the key. Encryption at rest plus RLS plus MFA is the
  protection. Free-text notes could get app-level encryption later if that ever feels
  necessary (logged in improvements).
- **No bank connections** (Plaid and the like). CSV import only. This keeps the app out of
  the business of holding bank credentials.
