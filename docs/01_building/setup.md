# Setup

From an empty Supabase project to a deployed app. Done once; kept so it can be redone
(new machine, new project) and so a reader can see what the infrastructure is. Every
terminal command runs from `src/app` unless it says otherwise.

The order matters: the database tables exist only once CI has applied the migrations
(ADR-017), and CI can only apply them once the repository and its secrets exist.

## 0. Prerequisites

- Node 24 through nvm (`nvm use` reads `src/app/.nvmrc`), then `npm ci` in `src/app`.
- `age` and `age-keygen` in `~/.local/bin`.
- A Supabase project, `money-tracker`, region Canada (`ca-central-1`), free plan, JWT
  signing key ECC (Project Settings, JWT Keys).

## 1. Commit

Commit everything on `main`. Nothing is pushed yet.

## 2. GitHub repository, first CI run

1. On github.com, **New repository**: name `money-tracker`, **Private**, no README, no
   `.gitignore`, no licence (the repo already has them).
2. Connect and push, the same way as other repositories on this machine:
   ```
   git remote add origin <the URL GitHub shows>
   git push -u origin main
   ```
3. Open the **Actions** tab. The `ci` run starts on its own. Expected: `docs`, `app` and
   `database` green; `backup` and `migrate` **skipped** (no secrets yet, by design).
4. `database` is the first real run of the pgTAP tests. If it fails, the log of the
   "pgTAP" step says which test.

Nothing touches the Supabase project in this step.

## 3. Backup key

In a terminal, from the home folder (not the repo):

```
age-keygen -o money-tracker-backup.key
```

1. It prints `Public key: age1…`. Keep that value for step 4.
2. Test the pair: `echo ok | age -r age1… | age -d -i money-tracker-backup.key` prints `ok`.
3. Copy the whole file (three lines, the last starting `AGE-SECRET-KEY-1`) into the password
   manager, and write a paper copy kept away from the backup drive.
4. `rm money-tracker-backup.key`

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

**Variables** tab, **New repository variable**: `BACKUP_ENABLED` = `true`. Add it last; it
is the switch that lets `backup` and `migrate` run.

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

The Supabase CLI is a dev dependency of `src/app`, run with `npx`. `--workdir ..` tells it
the project folder is `src/supabase`.

```
npx supabase login
```
Opens the browser to create a personal access token for the CLI, and stores it in the
macOS keychain. Once per machine.

```
npx supabase --workdir .. link
```
Choose `money-tracker` from the list (or add `--project-ref <ref>`; the ref is the id in
the dashboard URL, `supabase.com/dashboard/project/<ref>`). When it asks for the
database password, it may be left blank: the commands used from the laptop go through the
management API, not the database.

```
npx supabase --workdir .. config push
```
Applies `src/supabase/config.toml` to the project: sign-up off, passwords of 12+ characters
with letters and digits, TOTP on, 15-minute tokens, one reset email per address per minute,
the bilingual invite, recovery and password-changed templates, and the site URL. It shows
the differences and asks for confirmation.

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

**Owner, by invitation.** Supabase dashboard, **Authentication → Users → Add user → Send
invitation**, with the owner's email.
1. Open the email, click the link: the app's "Bienvenue" page. Click **Continuer**.
2. Choose a password (12+ characters, a letter and a digit).
3. Two-factor setup: **Commencer**, then scan the QR code into two apps (phone and password
   manager), then enter the six-digit code.
4. The "Bonjour" page. Done.

**Demo account, without email.** Supabase's built-in email sender only delivers to members
of the Supabase organization, so an invitation to a made-up address never arrives. Instead:
**Authentication → Users → Add user → Create new user**, with an address on a domain you
control or a `+demo` alias of your own, a password, and **Auto Confirm User** ticked. Then
sign in with it in the app, which leads straight to two-factor setup.

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
6. Point the auth emails at the live app: `site_url` in `src/supabase/config.toml` is the
   Netlify address (`https://ff-money-tracker.netlify.app`); run
   `npx supabase --workdir .. config push` after changing it. Invitation and reset links
   then open the deployed app, not localhost.
7. Turn off the Netlify toolbar for the project (project configuration, under the
   collaboration or toolbar settings). Netlify injects its script into every page after the
   server renders it, so it has no CSP nonce: the browser blocks it and logs a CSP error.

## 10. After setup

- First weekend of each month: the backup routine in [security.md](security.md#backups).
- Before the spreadsheet is retired: one restore test (roadmap, phase 1 gate).
