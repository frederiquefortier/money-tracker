import { parseCsv } from '#/lib/shared/csv'
import { IMPORT_FILES } from '#/lib/import/import'
import type {
  ImportErrorCode,
  ImportErrorItem,
  ImportFileName,
  ImportInput,
  ImportRow,
} from '#/lib/import/import'

// What the browser checks of a file before the database checks the rows (import.md):
// the columns, what is required, and the formats of dates and numbers.

type ColumnType = 'text' | 'date' | 'decimal' | 'integer'
type Column = { name: string; required: boolean; type: ColumnType }

const column = (
  name: string,
  required = false,
  type: ColumnType = 'text',
): Column => ({ name, required, type })

export const IMPORT_COLUMNS: Record<ImportFileName, ReadonlyArray<Column>> = {
  accounts: [
    column('name', true),
    column('type', true),
    column('currency', true),
    column('institution'),
    column('institution_url'),
    column('opening_balance', true, 'decimal'),
    column('opened_on', true, 'date'),
    column('closed_on', false, 'date'),
  ],
  transactions: [
    column('ref', true),
    column('date', true, 'date'),
    column('account', true),
    column('institution'),
    column('kind', true),
    column('amount', true, 'decimal'),
    column('currency', true),
    column('original_amount', false, 'decimal'),
    column('original_currency'),
    column('merchant'),
    column('event'),
    column('status'),
    column('transfer_group'),
    column('note'),
  ],
  splits: [
    column('ref', true),
    column('category', true),
    column('amount', true, 'decimal'),
  ],
  people: [
    column('ref', true),
    column('role', true),
    column('person'),
    column('head_count', false, 'integer'),
    column('amount', false, 'decimal'),
    column('reimburses'),
  ],
  aliases: [column('kind', true), column('name', true), column('alias', true)],
  holdings: [
    column('holding', true),
    column('type', true),
    column('institution'),
    column('name'),
    column('country'),
    column('currency', true),
    column('opened_on', false, 'date'),
    column('closed_on', false, 'date'),
  ],
  snapshots: [
    column('holding', true),
    column('date', true, 'date'),
    column('amount', true, 'decimal'),
  ],
  contributions: [
    column('holding', true),
    column('date', true, 'date'),
    column('amount', true, 'decimal'),
    column('label'),
  ],
  holding_transfers: [
    column('from_holding', true),
    column('to_holding', true),
    column('date', true, 'date'),
    column('amount', true, 'decimal'),
  ],
}

/** `transactions` for `transactions.csv`, whatever the case; null for any other name. */
export function importFileName(fileName: string): ImportFileName | null {
  const base = fileName.trim().toLowerCase()
  return IMPORT_FILES.find((name) => `${name}.csv` === base) ?? null
}

export type ImportFileRead = {
  name: ImportFileName
  rows: Array<ImportRow>
  errors: Array<ImportErrorItem>
}

function isIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const [year, month, day] = [
    Number(match[1]),
    Number(match[2]),
    Number(match[3]),
  ]
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

const FORMATS: Record<
  Exclude<ColumnType, 'text'>,
  { test: (value: string) => boolean; code: ImportErrorCode }
> = {
  date: { test: isIsoDate, code: 'date_format' },
  decimal: { test: (v) => /^-?\d+(\.\d+)?$/.test(v), code: 'decimal_format' },
  integer: { test: (v) => /^\d+$/.test(v), code: 'integer_format' },
}

function cellProblem(c: Column, value: string): ImportErrorCode | null {
  if (value === '') return c.required ? 'value_required' : null
  if (c.type === 'text') return null
  const format = FORMATS[c.type]
  return format.test(value) ? null : format.code
}

function headerProblems(
  file: string,
  spec: ReadonlyArray<Column>,
  header: ReadonlyArray<string>,
) {
  const errors: Array<ImportErrorItem> = []
  const known = spec.map((c) => c.name)
  for (const name of header) {
    if (!known.includes(name)) {
      errors.push({ file, line: 1, code: 'column_unknown', detail: name })
    }
  }
  for (const c of spec) {
    if (c.required && !header.includes(c.name)) {
      errors.push({ file, line: 1, code: 'column_missing', detail: c.name })
    }
  }
  return errors
}

/** Reads one file: its rows, and every fault found in its columns and cells. */
export function readImportFile(
  name: ImportFileName,
  text: string,
): ImportFileRead {
  const file = `${name}.csv`
  const spec = IMPORT_COLUMNS[name]
  const { records, unterminated } = parseCsv(text)
  if (records.length === 0) {
    return {
      name,
      rows: [],
      errors: [{ file, line: 1, code: 'file_empty', detail: '' }],
    }
  }
  const header = records[0].cells.map((cell) => cell.trim())
  const body = records.slice(1)
  const errors = headerProblems(file, spec, header)
  if (unterminated) {
    errors.push({ file, line: 1, code: 'csv_unterminated', detail: '' })
  }
  const rows: Array<ImportRow> = []
  for (const record of body) {
    if (record.cells.length > header.length) {
      errors.push({ file, line: record.line, code: 'row_length', detail: '' })
    }
    const row: ImportRow = { line: String(record.line) }
    header.forEach((columnName, i) => {
      row[columnName] = (record.cells[i] ?? '').trim()
    })
    for (const c of spec) {
      // A column the file lacks is reported once, at the header.
      if (!header.includes(c.name)) continue
      const code = cellProblem(c, row[c.name] ?? '')
      if (code) {
        errors.push({
          file,
          line: record.line,
          code,
          detail: (row[c.name] ?? '') === '' ? c.name : (row[c.name] ?? ''),
        })
      }
    }
    rows.push(row)
  }
  return { name, rows, errors }
}

/** The rows of the files read, as `import_batch` takes them. */
export function importInputOf(
  files: ReadonlyArray<ImportFileRead>,
): ImportInput {
  const rowsOf = (name: ImportFileName) =>
    files.find((file) => file.name === name)?.rows ?? []
  return {
    files: files.map((file) => `${file.name}.csv`),
    accounts: rowsOf('accounts'),
    transactions: rowsOf('transactions'),
    splits: rowsOf('splits'),
    people: rowsOf('people'),
    aliases: rowsOf('aliases'),
    counterparties: [],
    holdings: rowsOf('holdings'),
    snapshots: rowsOf('snapshots'),
    contributions: rowsOf('contributions'),
    holding_transfers: rowsOf('holding_transfers'),
  }
}
