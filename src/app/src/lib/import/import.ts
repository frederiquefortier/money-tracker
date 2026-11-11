import { z } from 'zod'

// Shared by the Importer screen and the server functions (spec 18, import.md, ADR-036).

export const IMPORT_FILES = [
  'accounts',
  'transactions',
  'splits',
  'people',
  'aliases',
] as const
export type ImportFileName = (typeof IMPORT_FILES)[number]

/**
 * One row of a CSV file, every value a string (amounts too, ADR-004) and its `line`. A
 * column the file does not have is absent.
 */
export type ImportRow = Partial<Record<string, string>>

const rowSchema = z.partialRecord(z.string(), z.string().max(2000))

/** What `import_batch` takes: the rows of each file, as read in the browser. */
export const importInputSchema = z.object({
  files: z.array(z.string().max(100)).max(8),
  accounts: z.array(rowSchema).max(1000),
  transactions: z.array(rowSchema).max(20000),
  splits: z.array(rowSchema).max(60000),
  people: z.array(rowSchema).max(60000),
  aliases: z.array(rowSchema).max(2000),
  counterparties: z.array(rowSchema).max(2000),
})
export type ImportInput = {
  files: Array<string>
  accounts: Array<ImportRow>
  transactions: Array<ImportRow>
  splits: Array<ImportRow>
  people: Array<ImportRow>
  aliases: Array<ImportRow>
  /** Merchant texts the author marked as a person: `name` (ADR-038). */
  counterparties: Array<ImportRow>
}

/** What the author can merge a new item into (IMP-06); the others are created as written. */
export const MERGE_KINDS = [
  'categories',
  'merchants',
  'people',
  'events',
] as const
export type MergeKind = (typeof MERGE_KINDS)[number]

// The faults a screen can name: what the browser finds in a file, then what the database
// finds in the rows. Each has its message under `import.errors`.
export const IMPORT_ERROR_CODES = [
  'file_empty',
  'csv_unterminated',
  'column_unknown',
  'column_missing',
  'row_length',
  'value_required',
  'date_format',
  'decimal_format',
  'integer_format',
  'account_type_unknown',
  'currency_unknown',
  'date_required',
  'account_dates',
  'url_invalid',
  'account_duplicate',
  'account_currency_differs',
  'ref_required',
  'ref_duplicate',
  'kind_invalid',
  'account_unknown',
  'account_ambiguous',
  'currency_mismatch',
  'amount_sign',
  'amount_precision',
  'before_account_opened',
  'status_invalid',
  'original_incomplete',
  'original_kind',
  'original_same_currency',
  'original_sign',
  'merchant_kind',
  'event_kind',
  'event_ambiguous',
  'transfer_group_missing',
  'transfer_group_kind',
  'transfer_incomplete',
  'transfer_same_account',
  'transfer_amounts_differ',
  'transfer_fee_account',
  'fee_category_missing',
  'split_ref_unknown',
  'split_kind',
  'category_required',
  'category_archived',
  'category_missing',
  'split_sign',
  'split_sum_mismatch',
  'split_duplicate_category',
  'people_ref_unknown',
  'people_kind',
  'role_invalid',
  'role_kind',
  'with_needs_person',
  'people_me_twice',
  'people_income_one',
  'person_twice',
  'head_count_invalid',
  'people_amount_unsupported',
  'people_sum_mismatch',
  'reimburses_role',
  'reimburses_unknown',
  'alias_kind_invalid',
  'alias_same',
  'alias_duplicate',
  'alias_target_unknown',
  'alias_taken',
] as const
export type ImportErrorCode = (typeof IMPORT_ERROR_CODES)[number]

export function knownErrorCode(code: string): ImportErrorCode | null {
  return IMPORT_ERROR_CODES.find((known) => known === code) ?? null
}

export type ImportErrorItem = {
  /** The file name, `transactions.csv`. */
  file: string
  line: number
  code: string
  detail: string
}

export type ImportCounts = {
  transactions: number
  skipped: number
  splits: number
  peopleLines: number
  transfers: number
  reimbursements: number
  aliases: number
}

export type ImportWillCreate = {
  currencies: Array<string>
  institutions: Array<string>
  accounts: Array<{ name: string; institution: string | null }>
  /** Accounts with no transactions that take the file's opening balance and date. */
  accountChanges: Array<{ name: string; institution: string | null }>
  categories: Array<string>
  merchants: Array<string>
  /** People a merchant text names: the merchant is theirs ("bought from Maman"). */
  counterparties: Array<string>
  people: Array<string>
  events: Array<string>
}

export const EMPTY_WILL_CREATE: ImportWillCreate = {
  currencies: [],
  institutions: [],
  accounts: [],
  accountChanges: [],
  categories: [],
  merchants: [],
  counterparties: [],
  people: [],
  events: [],
}

export type ImportCheck =
  | {
      ok: true
      /** Every row is already in: nothing would be written. */
      nothingToImport: boolean
      willCreate: ImportWillCreate
      counts: ImportCounts
    }
  | { ok: false; errors: Array<ImportErrorItem>; errorCount: number }

export type ImportDone = {
  ok: true
  batchId: string
  created: Record<string, number>
  counts: ImportCounts
}

export type ImportError = 'failed' | 'timeout' | 'notFound'

/** One import already made, as the Imports card lists it (IMP-05). */
export type ImportBatch = {
  id: string
  /** ISO timestamps, shown in the author's own time zone. */
  committedAt: string
  undoneAt: string | null
  transactions: number
  created: Partial<Record<string, number>>
  /** Its transactions changed since, which an undo would remove too. */
  edited: number
}

/** The names a new item can be merged into, existing ones first (IMP-06). */
export type ImportTargets = Record<MergeKind, Array<string>>
