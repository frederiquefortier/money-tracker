# Security

Financial data, multiple users, a public URL. This file is the threat model and the
checklist; [decisions.md](decisions.md) records the choices.

## Is Supabase up to it?

Yes. Postgres, encryption at rest and in transit, SOC 2 Type II, TOTP MFA and row-level
security are built in. The app never stores bank credentials or account numbers.

The real risk is configuration: one table without a correct RLS policy is readable by any
signed-in user, and that is how most Supabase leaks happen. The rules below make that
mistake hard to make and easy to catch.

The free plan has no downloadable backups and pauses an idle project (ADR-016), so our own
encrypted dump is the only backup.

## Threat model

| Threat | Mitigation |
|---|---|
| User A reads or edits user B's rows | RLS on every table, tested in CI; composite foreign keys (ADR-005) |
| Stolen password | TOTP required by policy (`aal2`); sign-up closed |
| Secret key reaches the browser | Used only in scheduled jobs; CI fails if a key or Supabase client is in the client bundle |
| XSS steals the session | React, a nonce-based CSP, httpOnly cookies, no `dangerouslySetInnerHTML` |
| Forged requests from another site | SameSite=lax cookies; cross-site writes refused |
| Deploy preview touches real data | Deploy previews off (ADR-017) |
| Supabase, Netlify or GitHub account takeover | MFA on all three |
| Data loss | Nightly encrypted dump, monthly offline copy, tested restore |
| Vendor disappears | Plain Postgres, migrations in Git |

## Rules

### Database

1. **RLS on every table, in the migration that creates it.** Lookup tables get a read-only
   policy.
2. **Every user-owned table has `user_id uuid not null default auth.uid()`** and the policy
   `user_id = (select auth.uid())` for every command (the `select` form runs once per query).
3. **A restrictive policy requires MFA** on every command:
   `(select auth.jwt()->>'aal') = 'aal2'`.
4. **Foreign keys between user tables include `user_id`** (ADR-005).
5. **Views are `security_invoker = true`, functions `security invoker`** unless a written
   reason says otherwise. A `security definer` function sets `search_path = ''`.
6. **Global tables** (`currencies`, `exchange_rates`) are readable by authenticated users and
   written only by scheduled jobs.
7. **`supabase db lint` and the security advisor run clean.** pgTAP proves, for every table,
   that a second user sees zero rows.
8. **Least-privilege grants.** `anon` has nothing; `authenticated` never holds `TRUNCATE`
   (it skips RLS), `REFERENCES` or `TRIGGER`. A partly writable table grants `update` per
   column (`profiles`: `locale`, `default_currency`, `display_currency`).

### App and server

1. **The browser never talks to the database.** Server functions call Supabase with the
   user's session, so RLS applies (ADR-006).
2. **Every server function validates input with Zod** and takes the user from the session,
   never from the payload.
3. **The secret key** (`SUPABASE_SECRET_KEY`) is only for scheduled jobs (rates, recurring
   transactions), in Netlify variables scoped to Functions. Until real data exists it is also
   in the laptop's local env file for `npm run rates` (ADR-022); no app code reads it, and
   CI fails if it reaches the browser bundle.
4. **Headers from the server entry** (ADR-015): a per-request nonce CSP allowing only our
   origin, HSTS, `frame-ancestors 'none'`, `Referrer-Policy: same-origin`, a locked
   `Permissions-Policy`, and `Cache-Control: private, no-store`. `netlify.toml` covers static
   assets.
5. **Cross-site writes are refused.** A non-GET request marked `Sec-Fetch-Site: cross-site`
   or `same-site` gets a 403. This covers login CSRF, which SameSite=lax does not.
6. **Third-party calls are server-side only.** Fonts and icons are self-hosted (ADR-020).
7. **No financial data in logs or errors**, and no third-party analytics.

### Auth

- Email, password and TOTP. Sign-up closed in `config.toml` (pushed with
  `npx supabase --workdir .. config push`); users are invited from the dashboard.
- **Email links** (invitation, reset) land on `/auth/confirm`, which spends the token only on
  a button's POST: email scanners open links first.
- **Invitation:** the invitee sets a password, then must enrol TOTP before seeing anything.
- **Reset:** the form answers the same for every address; one email per address per minute.
  A reset link opens an `aal1` session, so an account with TOTP needs the code before the new
  password is accepted.
- **Password changes** need `aal2` once a factor exists, and send a notification email.
- Access tokens last 15 minutes with refresh rotation, verified locally (ADR-018), which needs
  an asymmetric JWT signing key on the project.
- **Open before a second user:** a per-IP and per-email sign-in throttle of our own (Supabase
  sees only the server's IP), a custom SMTP sender (the built-in one only reaches the
  organization's members), and self-service MFA recovery. Until then, enrol the TOTP secret
  in two apps; a user who loses both is unlocked from the dashboard after checking out of
  band.

### Backups

Needed from the day the spreadsheet stops being updated. One database holds real data
(ADR-017).

| Copy | What | Where | When | Kept |
|---|---|---|---|---|
| Live | The database | Supabase (`ca-central-1`) | | |
| Cloud | Encrypted dump (roles, schema, data) | GitHub Actions artifact | Nightly and before every migration | 30 days |
| Cold | Latest dump plus the app's CSV export (IMP-04) | Offline drive | Monthly, by hand | Always |

- The dump is encrypted with `age` to a public key. **The private key** lives in the password
  manager and on paper, never in GitHub, the repo or the drive.
- The CSV export restores through the app's own import, without Postgres or the key. It
  holds no auth users: restoring from it means inviting the account again.
- **Monthly:** download the latest dump and an app export to the drive; every third month,
  decrypt one dump to prove the key works.
- **Restore test** before the first real import, then after every major schema change: into
  a scratch Postgres in CI, row counts checked against the export.

### Deliberately not done

- **No column encryption of amounts.** Totals and budgets are SQL aggregations, and the
  server would hold the key anyway.
- **No bank connections.** CSV import only, so no bank credentials to hold.
