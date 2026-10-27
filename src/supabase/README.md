# src/supabase

Supabase CLI project: `config.toml`, `migrations/`, `tests/database/` (pgTAP), `seed.sql`
(demo data, not written yet: DEM-02).

The CLI is a dev dependency of `src/app`, and the npm scripts there call it with
`--workdir ..`. There is no local stack on the development machine (ADR-014), and one
project holds real data (ADR-017):

| Task | Where | Command |
|---|---|---|
| Lint and pgTAP | CI, on every push | `supabase db start`, `db lint`, `test db` (ci.yml) |
| Link the project | `src/app` | `npm run db:link` |
| Apply migrations | CI, on `main` only, after the checks and a backup | `supabase db push` (ci.yml, `migrate` job) |
| Push auth settings from `config.toml` | `src/app` | `npm run db:config-push` |
| Regenerate TypeScript types | `src/app` | `npm run db:types` |

`config.toml` is the source of truth for auth settings: sign-up off, passwords of at least
12 characters with letters and digits, TOTP on, the bilingual invite and password-changed
emails in `templates/`. `db:config-push` applies them to the linked
project.

Migrations are additive: add first, remove in a later change once the deployed app no
longer uses the old shape. The app and the database deploy independently.

Every new table follows `migrations/20261027120000_foundation.sql`: RLS in the same
migration, owner-only policies, the restrictive MFA policy, anon revoked. The guard tests in
`tests/database/00_every_table.test.sql` fail CI if a table skips any of it.
