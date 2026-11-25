# Setup

From an empty Supabase project to a deployed app, in order: tables exist only once CI has
applied the migrations (ADR-017), which needs the repository and its secrets. Commands run
from `src/app` unless stated.

## 1. Prerequisites

- Node 24 through nvm (`nvm use` reads `src/app/.nvmrc`), then `npm ci` in `src/app`.
- `age` and `age-keygen` in `~/.local/bin`.
- A Supabase project, `money-tracker`, region Canada (`ca-central-1`), free plan, JWT
  signing key ECC (Project Settings, JWT Keys).

## 2. GitHub repository

A private repository, nothing generated; push `main`. The first CI run has `migrate` red
("SUPABASE_DB_URL is not set") until step 4. If `database` fails, the "pgTAP" step's log
names the test.

## 3. Backup key

From the home folder (not the repo):

```
age-keygen -o money-tracker-backup.key
```

1. Keep the printed `age1…` public key for step 4.
2. Test: `echo ok | age -r age1… | age -d -i money-tracker-backup.key` prints `ok`.
3. Copy the whole file into the password manager, and make a paper copy kept away from the
   backup drive. Then `rm money-tracker-backup.key`.

The private key never goes into GitHub, the repo, or a conversation with the assistant.

## 4. GitHub secrets and variable

**Settings → Secrets and variables → Actions.**

| Secret | Value |
|---|---|
| `BACKUP_AGE_RECIPIENT` | The `age1…` public key from step 3 |
| `SUPABASE_DB_URL` | The **Session pooler** connection string (Supabase, **Connect**, Connection string, Session pooler), with the database password in place of `[YOUR-PASSWORD]` |

Use the Session pooler: the direct connection is IPv6 only on the free plan, and GitHub's
runners have no IPv6. **The database password must be letters and digits only**: characters
like `@ : / # ? %` change the URL's meaning and fail as "authentication failed"
([learnings.md](learnings.md)). Test the string first:
`npx supabase --workdir .. migration list --db-url "…"`.

**Variable** `BACKUP_ENABLED` = `true`, added last: it lets `backup` run, and `migrate`
applies migrations only after a backup.

## 5. First migration

**Actions → ci → Run workflow** on `main`. `backup` then `migrate` go green, the run lists a
`money-tracker-<date>.tar.gz.age` artifact, and the Table Editor shows an empty `profiles`.
A `backup` failing on the connection is almost always the `SUPABASE_DB_URL` value (special
characters, brackets left in, `postgres` instead of `postgres.<ref>`, or the direct string).

## 6. Link the CLI and push the auth settings

```
npx supabase login                       # once per machine, token in the keychain
npx supabase --workdir .. link           # pick money-tracker; the password can stay blank
npx supabase --workdir .. config push    # applies config.toml, shows the diff first
```

`config push` sets sign-up off, the password rule, TOTP, 15-minute tokens, the reset email
limit, the email templates and the site URL.

## 7. Local app

`cp .env.example .env.local`, then fill in from the Supabase dashboard (Project Settings):

- `SUPABASE_URL`: Data API, the project URL (`https://<ref>.supabase.co`).
- `SUPABASE_PUBLISHABLE_KEY`: API Keys, the **publishable** key (`sb_publishable_…`).
- `SUPABASE_DB_PASSWORD`: the database password. Only `npm run db:push` reads it (ADR-022).
- `SUPABASE_SECRET_KEY`: API Keys, a **secret** key (`sb_secret_…`). Only `npm run rates`
  reads it.

`npm run dev` serves http://localhost:3000. After a migration, `npm run db:types`
regenerates `src/lib/database.gen.ts` from the linked project (ADR-023).

## 8. Accounts

Dashboard, **Authentication → Users → Add user → Send invitation**. Open the email's link,
**Continuer**, choose a password, then scan the QR code into two apps (phone and password
manager) and enter the code.

## 9. Netlify

1. **Add new project → Import an existing project → GitHub**, pick `money-tracker`.
   **Base directory** `src/app`; the rest comes from `netlify.toml`.
2. **Environment variables**, before the first deploy: `SUPABASE_URL` and
   `SUPABASE_PUBLISHABLE_KEY` as in `.env.local`, available to Functions; `SUPABASE_SECRET_KEY`
   scoped to **Functions only** (the rates job reads it, the app never does).
3. Deploy. **Deploy previews off** (ADR-017): Build & deploy, Branches and deploy contexts.
4. Set `site_url` in `config.toml` to the Netlify address and `config push`, so email links
   open the deployed app.
5. Turn off the Netlify toolbar: its injected script has no nonce, so the CSP blocks it.
6. **Rates backfill.** The `rates` scheduled function runs daily at 17:00 UTC from the last
   stored day, so its first run loads everything since 2018. Run it once by hand (Logs,
   Functions, `rates`, **Run now**); if it times out, run it again, it resumes.

## 10. After setup

- First weekend of each month: the backup routine in [security.md](security.md#backups).
