# Export

**Status:** built (ADR-067). Shared rules: [02-screens.md](02-screens.md).

## Requirements

IMP-04, SEC-04. Format: [import.md](../../01_building/import.md).

## Behaviour

- The data page has two tabs, Importer and Exporter, the same tab row as the other settings pages (author, 2026-11-24). Exporter lists the files of the format, each with a box, all ticked at first; each row says how many lines it holds. "Exporter mes données" downloads the ticked ones that have rows as one zip, built on the server with the user's session. No dependency.
- Responses are `no-store` and never cached (security.md).
- Export then import into an empty account reproduces the data: that round trip is the format's test.
