# Export

**Status:** not built (the import is built). Shared rules: [02-screens.md](02-screens.md).

## Requirements

IMP-04, SEC-04. Format: [import.md](../../01_building/import.md).

## Behaviour

- "Exporter mes données" (in Réglages, with Importer) downloads three plain files, `accounts.csv`, `transactions.csv` and `splits.csv`, in the import format, built on the server with the user's session. No archive, no dependency.
- Responses are `no-store` and never cached (security.md).
- Export then import into an empty account reproduces the data: that round trip is the format's test.
