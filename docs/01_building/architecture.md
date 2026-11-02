# Architecture

```
  Browser (React, shadcn/ui, TanStack Router)
        │  server functions only (no direct DB access)
        ▼
  TanStack Start server (Node, on Netlify Functions)
        │  supabase-js with the user's session  ──►  RLS applies
        │  supabase-js with the secret key       ──►  rate fetch, scheduled jobs only
        ▼
  Supabase: Postgres (source of truth) + Auth (TOTP MFA)
        ▲
        │  daily rates + 2018 backfill
  Frankfurter (ECB rates, conversion)    HexaRate (validates added currencies)
```

## Stack

| Layer | Choice | Why (ADR) |
|---|---|---|
| Database and auth | Supabase (Postgres + Auth) | ADR-001 |
| Backend | TanStack Start server functions, running on Node in Netlify Functions | ADR-002 |
| UI | React 19, TanStack Router (loaders, no separate query cache), shadcn/ui on Tailwind, Recharts for charts | ADR-003, ADR-011 |
| Forms | Native React 19 form actions; Zod validates every server function input | ADR-003, ADR-011 |
| Money | `numeric` in Postgres, strings over the wire, `BigInt` minor units for the rare TypeScript calculation | ADR-004, ADR-011 |
| Exchange rates | Frankfurter for history and daily rates, HexaRate to validate new currencies | ADR-009 |
| Languages | French and English: react-i18next for messages, `Intl` for formatting | ADR-008 |
| Dependencies | Platform first; the short list of what stays is in ADR-011 | ADR-011 |
| Hosting | Netlify | brief |
| Language | TypeScript everywhere, strict mode | |

## Who writes what

| Writer | Writes | How |
|---|---|---|
| Server functions (user session) | Everything user-owned | supabase-js, RLS enforced. Multi-row writes call `security invoker` SQL functions with `.rpc()` (ADR-012). |
| Rates job (secret key) | `exchange_rates` | Netlify scheduled function, daily |
| Recurring job (secret key) | `transactions` generated from `recurring_rules` | Netlify scheduled function, daily. Sets `user_id` from the rule, never from input. |
| Migrations | Schema, global reference data | `src/supabase/migrations/`, applied by CI on `main` after a backup (ADR-017) |
| Importer | Rows in the fixed CSV format | Server function, then one `import_batch` SQL call ([import.md](import.md)) |

Nothing writes from the browser.

## Derived values

Balances, category totals and net worth are computed, never stored, until a measured
performance problem says otherwise. Then an index or a materialized view, with an ADR.

## Currency conversion

A transaction stores the amount in its account's currency, and the receipt price when it
differs, never a display-currency amount. Conversion joins `exchange_rates` on the
transaction date at read time, and converted amounts come back flagged with their original
amount and rate (CUR-09). See [database.md](database.md#money).

## Environments

| Environment | Supabase project | Netlify |
|---|---|---|
| Local | `money-tracker` (`ca-central-1`, free plan), signed in as the owner (ADR-021) | `vite dev` |
| CI | A throwaway local stack inside GitHub Actions, for lint and pgTAP | |
| Production | `money-tracker`, the owner's account. Migrations applied by CI after a backup (ADR-017) | Main branch; deploy previews off |
