# Setup

From an empty Supabase project to a deployed app, in order: tables exist only once CI has
applied the migrations (ADR-017), which needs the repository and its secrets. Commands run
from `src/app` unless stated.

## 0. Prerequisites

- Node 24 through nvm (`nvm use` reads `src/app/.nvmrc`), then `npm ci` in `src/app`.
- `age` and `age-keygen` in `~/.local/bin`.
- A Supabase project, `money-tracker`, region Canada (`ca-central-1`), free plan, JWT
  signing key ECC (Project Settings, JWT Keys).

## 1. Commit

Commit everything on `main`. Nothing is pushed yet.

## 2. GitHub repository, first CI run

1. On github.com, **New repository**: `money-tracker`, **Private**, nothing generated.
2. Connect and push:
   ```
   git remote add origin <the URL GitHub shows>
   git push -u origin main
   ```
3. **Actions** tab: `docs`, `app` and `database` green, `backup` skipped, and `migrate`
   red with "SUPABASE_DB_URL is not set". Expected until step 4.
4. If `database` fails, the "pgTAP" step's log names the test.

## 3. Backup key

In a terminal, from the home folder (not the repo):

```
age-keygen -o money-tracker-backup.key
```

1. Keep the printed `age1…` public key for step 4.
2. Test: `echo ok | age -r age1… | age -d -i money-tracker-backup.key` prints `ok`.
3. Copy the whole file into the password manager, and make a paper copy kept away from the
   backup drive. Then `rm money-tracker-backup.key`.

The private key never goes into GitHub, the repo, or a conversation with the assistant.

## 4. GitHub secrets and variable

In the repository: **Settings → Secrets and variables → Actions**.

**Secrets** tab, **New repository secret**, twice:

| Name | Value | Where to find it |
|---|---|---|
| `BACKUP_AGE_RECIPIENT` | The `age1…` public key | Step 3 |
| `SUPABASE_DB_URL` | The **Session pooler** connection string, with the database password filled in | Supabase dashboard, project page, **Connect** button at the top, **Connection string**, method **Session pooler**. It looks like `postgresql://postgres.<ref>:<password>@aws-…pooler.supabase.com:5432/postgres`. Replace `[YOUR-PASSWORD]` with the database password chosen when the project was created (reset it under Project Settings, Database, if lost). |

Use the Session pooler, not the direct connection: the direct one is IPv6 only on the free
plan, and GitHub's runners have no IPv6.

**The database password must be letters and digits only** (32+ characters from the password
manager). The connection string is a URL, so characters like `@ : / # ? %` in the password
change its meaning and the connection fails as "authentication failed"
([learnings.md](learnings.md)). Test the string locally first, from `src/app`:
`npx supabase --workdir .. migration list --db-url "…"`.

**Variables** tab: `BACKUP_ENABLED` = `true`. Add it last; it lets `backup` run, and
`migrate` applies migrations only after a backup.

## 5. First migration

**Actions → ci → Run workflow → branch `main` → Run workflow.**

Expected, in order: `docs`, `app`, `database` green, then `backup` green, then `migrate`
green.

Check:
- The run's summary page lists an artifact named `money-tracker-<date>.tar.gz.age`.
- Supabase dashboard, **Table Editor**: a `profiles` table exists (empty).

If `backup` fails on the connection, the `SUPABASE_DB_URL` value is the usual cause: special
characters in the password, `[YOUR-PASSWORD]` brackets left in, plain `postgres` instead of
`postgres.<ref>` as the user, or the direct connection string instead of the pooler.

## 6. Link the CLI and push the auth settings

`--workdir ..` points the CLI at `src/supabase`.

```
npx supabase login                       # once per machine, token in the keychain
npx supabase --workdir .. link           # pick money-tracker; the password can stay blank
npx supabase --workdir .. config push    # applies config.toml, shows the diff first
```

`config push` sets sign-up off, the password rule, TOTP, 15-minute tokens, the reset email
limit, the email templates and the site URL.

## 7. Local app

```
cp .env.example .env.local
```
Fill in, from the Supabase dashboard:
- `SUPABASE_URL`: **Connect** dialog, or Project Settings, Data API, the project URL
  (`https://<ref>.supabase.co`).
- `SUPABASE_PUBLISHABLE_KEY`: Project Settings, **API Keys**, the **publishable** key
  (`sb_publishable_…`). Never the secret key.

```
npm run dev
```
The app is at http://localhost:3000 and shows the sign-in page.

## 8. Accounts

**Owner, by invitation.** Dashboard, **Authentication → Users → Add user → Send
invitation**. Open the email's link, **Continuer**, choose a password, then scan the QR code
into two apps (phone and password manager) and enter the code.

**Demo account, without email** (the built-in sender only reaches the organization's
members): **Add user → Create new user** with a `+demo` alias of your own, a password, and
**Auto Confirm User** ticked. Signing in leads to two-factor setup.

## 9. Netlify

1. app.netlify.com, **Add new project → Import an existing project → GitHub**, authorize,
   pick `money-tracker`.
2. **Base directory**: `src/app`. Build command and publish directory come from
   `netlify.toml` (`npm run build`, `dist/client`).
3. **Environment variables**, before the first deploy: `SUPABASE_URL` and
   `SUPABASE_PUBLISHABLE_KEY`, same values as `.env.local`, available to Functions.
4. Deploy. The site gets an address like `https://<name>.netlify.app`.
5. **Deploy previews off** (ADR-017): Project configuration, Build & deploy, Branches and
   deploy contexts, Deploy previews: none.
6. `site_url` in `config.toml` is the Netlify address; `config push` after changing it, so
   email links open the deployed app.
7. Turn off the Netlify toolbar: its injected script has no nonce, so the CSP blocks it.

## 10. After setup

- First weekend of each month: the backup routine in [security.md](security.md#backups).
- Before the spreadsheet is retired: one restore test (roadmap, phase 1 gate).
