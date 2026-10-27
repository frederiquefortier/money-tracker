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

- **The free plan is not enough for real money data.** Free projects pause after a week of
  inactivity and have no backups you control. Use the Pro plan (daily backups, no pausing),
  and keep our own encrypted dump as well (see Backups).
- **Pick the region at creation; it cannot be changed later.** Choose the one closest to
  where the data's owner lives (Central EU / Zurich if offered, otherwise Frankfurt).

## Threat model

| Threat | Likelihood | Mitigation |
|---|---|---|
| User A reads or edits user B's rows | The classic Supabase leak | RLS on every table, policies tested in CI (pgTAP), composite foreign keys so a row cannot point at another user's category or account |
| Stolen password | Medium | TOTP MFA required by policy (`aal2`), not just offered; sign-up closed |
| Secret key leaks to the browser | Medium (one wrong `import`) | Secret key used only in server modules; build check that no `sb_secret_` string ends up in the client bundle |
| XSS steals the session | Low with React, higher with emoji/HTML inputs | Strict Content-Security-Policy in `netlify.toml`, no `dangerouslySetInnerHTML`, emoji validated as emoji |
| Deploy preview hits production data | High by default on Netlify | Previews point at a separate Supabase project with demo data (on a free organization: a second project in the Pro organization costs extra), or previews are off |
| Supabase account takeover | Low | MFA on the Supabase and Netlify accounts themselves, GitHub too |
| Data loss | Medium over years | Pro-plan backups plus a nightly encrypted dump kept elsewhere |
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
4. **Security headers** in `netlify.toml`: CSP, HSTS, `frame-ancestors 'none'`,
   `Referrer-Policy: same-origin`, `Permissions-Policy` locking off camera, mic, geolocation.
5. **Third-party calls** (the rates API) happen server-side only. Fonts, emoji included,
   are served from our own origin (ADR-013). The browser's CSP allows
   only our own origin and Supabase.
6. **No financial data in logs or error messages**, and none in analytics. No third-party
   analytics at all while the app is private.

### Auth

- Email and password plus TOTP. Sign-up disabled in the Supabase dashboard; new users by
  invitation from the dashboard.
- A custom SMTP sender for auth email (the built-in one is rate-limited and meant for
  development).
- Short-lived access tokens (default one hour) with refresh rotation, which is Supabase's
  default.
- **No recovery codes**: Supabase TOTP has none. Enrol two authenticators (phone and a
  password manager) at setup. A user who loses both is unlocked by removing the factor in
  the Supabase dashboard, after verifying them out of band. A self-service recovery flow is
  needed before anyone but the owner uses the app.

### Backups

- Supabase Pro daily backups.
- A nightly scheduled GitHub Action runs `pg_dump` (Netlify Functions cannot), encrypts it
  with `age` to a public key, and stores it outside Supabase. The database connection string
  lives in GitHub encrypted secrets, scoped to that one workflow; the `age` private key lives
  offline, never in GitHub. That is the 3-2-1 copy that survives losing the
  Supabase account.
- A restore is tested once, then after every major schema change.

### What is deliberately not done

- **No column-level encryption of amounts.** Every useful feature here (totals, medians,
  budgets) is an aggregation in SQL; encrypting amounts would move all of that into the app
  and the server would still hold the key. Encryption at rest plus RLS plus MFA is the
  protection. Free-text notes could get app-level encryption later if that ever feels
  necessary (logged in improvements).
- **No bank connections** (Plaid and the like). CSV import only. This keeps the app out of
  the business of holding bank credentials.
