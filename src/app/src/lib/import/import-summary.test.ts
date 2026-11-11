import { describe, expect, it } from 'vitest'
import { summariseRows } from './import-summary'

describe('summariseRows', () => {
  it('counts by kind and gives the dates', () => {
    expect(
      summariseRows([
        { kind: 'expense', date: '2026-02-03' },
        { kind: 'expense', date: '2026-02-05' },
        { kind: 'income', date: '2026-01-10' },
        { kind: 'adjustment', date: '2026-02-20' },
      ]),
    ).toEqual({
      expenses: 2,
      incomes: 1,
      adjustments: 1,
      transfers: 0,
      from: '2026-01-10',
      to: '2026-02-20',
    })
  })

  it('counts a transfer as its legs and its fee, so the kinds add up to the rows', () => {
    const summary = summariseRows([
      { kind: 'transfer', date: '2026-02-16', transfer_group: 'tr-1' },
      { kind: 'transfer', date: '2026-02-16', transfer_group: 'tr-1' },
      { kind: 'expense', date: '2026-02-16', transfer_group: 'tr-1' },
      { kind: 'expense', date: '2026-02-17' },
    ])
    expect(summary.transfers).toBe(3)
    expect(summary.expenses).toBe(1)
  })

  it('has no dates for no rows', () => {
    expect(summariseRows([])).toMatchObject({ from: null, to: null })
  })
})
