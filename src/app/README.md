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

| Script                      | What it does                                              |
| --------------------------- | --------------------------------------------------------- |
| `dev`, `build`, `preview`   | Vite dev server, production build, run the build locally  |
| `typecheck`, `lint`, `test` | `tsc`, ESLint (with the i18n literal-string rule), Vitest |
| `format`                    | Prettier, then ESLint fixes                               |

The Supabase CLI has no script: `npx supabase --workdir .. <command>` (see
[src/supabase/README.md](../supabase/README.md)). Migrations are applied by CI, not from
here (ADR-017).

## Layout

| Path                  | Holds                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `src/routes/`         | File routes. `_authed.tsx` guards everything behind sign-in and MFA.                                                    |
| `src/server/`         | Server functions (`createServerFn`). The only code that talks to Supabase.                                              |
| `src/lib/*.server.ts` | Server-only modules (marked with `@tanstack/react-start/server-only`).                                                  |
| `src/server.ts`       | Server entry: per-request CSP nonce and security headers (ADR-015).                                                     |
| `src/i18n/`           | Locales, FR and EN resources (FR is the source), i18next setup (ADR-008).                                               |
| `src/components/ui/`  | shadcn components. After `npx shadcn add`, change `from "cn"` to `from '#/lib/utils'` and `npm uninstall cn` (ADR-011). |
