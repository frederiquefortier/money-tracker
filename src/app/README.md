# src/app

The TanStack Start app: React UI, shadcn/ui components, and the server functions that are
the backend. Every command runs from this folder. Netlify's base directory points here.

## Setup

First-time setup of the whole project (GitHub, secrets, Supabase, Netlify) is in
[setup.md](../../docs/01_building/setup.md). Day to day:

1. Node 24: `nvm use` reads `.nvmrc`.
2. `npm ci`
3. Copy `.env.example` to `.env.local` and fill in the project's URL and publishable key.
   There is one project (ADR-017): sign in with the demo account to try unfinished work.
4. `npm run dev` and open http://localhost:3000.

## Scripts

| Script                      | What it does                                             |
| --------------------------- | -------------------------------------------------------- |
| `dev`, `build`, `preview`   | Vite dev server, production build, run the build locally |
| `typecheck`, `lint`, `test` | `tsc`, ESLint (i18n and size rules), Vitest              |
| `check`, `format`           | Prettier check; Prettier then ESLint fixes               |
| `verify`                    | Everything CI checks on the app, before a commit         |

The Supabase CLI has no script: `npx supabase --workdir .. <command>` (see
[src/supabase/README.md](../supabase/README.md)). Migrations are applied by CI, not from
here (ADR-017).

## Layout

| Path                             | Holds                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/routes/`                    | File routes. `_authed.tsx` guards everything behind sign-in and MFA.                                                           |
| `src/server/`                    | Server functions (`createServerFn`), one file per feature. The only code that talks to Supabase.                               |
| `src/server.ts`                  | Server entry: per-request CSP nonce and security headers (ADR-015).                                                            |
| `src/components/ui/`             | shadcn components. After `npx shadcn add`, change `from "cn"` to `from '#/lib/utils'` and `npm uninstall cn` (ADR-011).        |
| `src/components/<role>/`         | Shared pieces: `layout`, `forms`, `sheet`, `combobox`, `lists`, `feedback`, `display`. `styles.ts` holds shared class strings. |
| `src/components/<feature>/`      | One feature's screens and pickers, with `list/` and `form/` in the large ones.                                                 |
| `src/hooks/`                     | Every hook: `app/`, `forms/`, then one folder per feature.                                                                     |
| `src/lib/shared/`                | Money, format, color, collections, search, validation, result.                                                                 |
| `src/lib/<feature>/`             | `<entity>.ts` model, `<entity>-draft.ts` form state, `<entity>-list.ts` list logic.                                            |
| `src/lib/server/`                | Server-only modules (`*.server.ts`, marked with `@tanstack/react-start/server-only`).                                          |
| `src/lib/db/`, `auth/`, `forms/` | Database types, auth schemas, form state.                                                                                      |
| `src/i18n/fr/`, `en/`            | The same files in both languages; French is the source (ADR-008).                                                              |
| `src/icons/`                     | `ui-icons.json`, `categories/keywords.json`, `categories/glyphs.json`; see its README.                                         |
