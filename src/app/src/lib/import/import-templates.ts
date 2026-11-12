import aliases from '../../../../data/reference/import-templates/aliases.csv?raw'
import accounts from '../../../../data/reference/import-templates/accounts.csv?raw'
import people from '../../../../data/reference/import-templates/people.csv?raw'
import splits from '../../../../data/reference/import-templates/splits.csv?raw'
import transactions from '../../../../data/reference/import-templates/transactions.csv?raw'
import holdings from '../../../../data/reference/import-templates/holdings.csv?raw'
import snapshots from '../../../../data/reference/import-templates/snapshots.csv?raw'
import contributions from '../../../../data/reference/import-templates/contributions.csv?raw'
import holdingTransfers from '../../../../data/reference/import-templates/holding_transfers.csv?raw'
import type { ImportFileName } from '#/lib/import/import'

// The example files of import.md, offered for download. Invented rows only.
export const IMPORT_TEMPLATES: Record<ImportFileName, string> = {
  accounts,
  transactions,
  splits,
  people,
  aliases,
  holdings,
  snapshots,
  contributions,
  holding_transfers: holdingTransfers,
}

/** A download link for a template, with no file to keep or release. */
export function templateHref(name: ImportFileName) {
  return `data:text/csv;charset=utf-8,${encodeURIComponent(IMPORT_TEMPLATES[name])}`
}
