# src/data/reference

Lookup data the app needs to work for any user, committed. Loaded into the global
reference tables by a migration. No user data lives here: your own categories, accounts and
history come in through the in-app import ([import.md](../../../docs/01_building/import.md)).

| File | Loaded into | Used for |
|---|---|---|
| `currencies-default.csv` | Nothing; the sign-up trigger lists the same five codes | The five starting currencies (CUR-01). Keep in step with `handle_new_user`. |
| `account-types.csv` | `account_types` | ACC-01 |
| `holding-types.csv` | `holding_types` | NW-01 and the region packs (LOC-02). `country` empty means any. |
| `import-templates/` | Offered for download in the app | The v1 import format with invented rows (IMP-01) |

Every label has a French and an English column (ADR-008). The full ISO 4217 list for
`currencies` is loaded by a migration, not kept here.
