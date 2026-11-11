import type { ImportRow } from '#/lib/import/import'

/** What the rows hold, to open the summary with. */
export type RowsSummary = {
  expenses: number
  incomes: number
  adjustments: number
  transfers: number
  from: string | null
  to: string | null
}

/**
 * The rows by kind and their dates, so that the four counts add up to the rows: a transfer
 * is its two legs and its fee.
 */
export function summariseRows(
  transactions: ReadonlyArray<ImportRow>,
): RowsSummary {
  const summary: RowsSummary = {
    expenses: 0,
    incomes: 0,
    adjustments: 0,
    transfers: 0,
    from: null,
    to: null,
  }
  for (const row of transactions) {
    const date = row.date ?? ''
    if (date !== '') {
      if (summary.from === null || date < summary.from) summary.from = date
      if (summary.to === null || date > summary.to) summary.to = date
    }
    if (
      row.kind === 'transfer' ||
      (row.kind === 'expense' && row.transfer_group)
    ) {
      summary.transfers++
    } else if (row.kind === 'expense') summary.expenses++
    else if (row.kind === 'income') summary.incomes++
    else if (row.kind === 'adjustment') summary.adjustments++
  }
  return summary
}
