import { describe, expect, it } from 'vitest'
import {
  groupByDay,
  monthOf,
  monthSchema,
  lastThirtyDays,
  periodRange,
  shiftMonth,
  monthsStart,
  presetChoice,
  presetOf,
} from '#/lib/transactions/transaction-list'
import type {
  ListedTransaction,
  PageRow,
} from '#/lib/transactions/transaction-list'

describe('months', () => {
  it('steps across years', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2025-12', 1)).toBe('2026-01')
    expect(shiftMonth('2026-11', 14)).toBe('2028-01')
  })

  it('takes the month of a date', () => {
    expect(monthOf('2026-11-05')).toBe('2026-11')
  })

  it('accepts only a real month', () => {
    expect(monthSchema.safeParse('2026-11').success).toBe(true)
    expect(monthSchema.safeParse('2026-13').success).toBe(false)
    expect(monthSchema.safeParse('2026-1').success).toBe(false)
  })
})

describe('periodRange', () => {
  const at = {
    month: '2024-02',
    year: '2025',
    start: '2026-01-05',
    end: '2026-03-10',
  }

  it('covers a whole month, leap day included', () => {
    expect(periodRange('month', at)).toEqual({
      from: '2024-02-01',
      to: '2024-02-29',
    })
  })

  it('covers a whole year', () => {
    expect(periodRange('year', at)).toEqual({
      from: '2025-01-01',
      to: '2025-12-31',
    })
  })

  it('runs a custom period between its days, and all without bounds', () => {
    expect(periodRange('custom', at)).toEqual({
      from: '2026-01-05',
      to: '2026-03-10',
    })
    expect(periodRange('all', at)).toEqual({ from: null, to: null })
  })

  it('starts a custom period on the last 30 days', () => {
    expect(lastThirtyDays('2026-03-10')).toEqual({
      start: '2026-02-09',
      end: '2026-03-10',
    })
  })
})

const row = (id: string, occurredOn: string): ListedTransaction => ({
  id,
  transferId: null,
  kind: 'expense',
  occurredOn,
  pending: false,
  merchant: null,
  note: null,
  account: { name: 'Chèque', institution: null },
  transfer: null,
  categories: [],
  people: [],
  reimburses: [],
  event: null,
  holding: null,
  amount: '-1.0000',
  currency: 'CAD',
  displayAmount: '-1.00',
  rate: '1',
  fee: null,
  arrival: null,
  conversionCost: null,
})

const pageRow = (r: ListedTransaction, dayNet: string): PageRow => ({
  row: r,
  dayNet,
})

describe('groupByDay', () => {
  const rows = [
    pageRow(row('a', '2026-11-03'), '-2.00'),
    pageRow(row('b', '2026-11-03'), '-2.00'),
    pageRow(row('c', '2026-11-01'), '-1.00'),
  ]

  it('cuts sorted rows into days, keeping their order and nets', () => {
    expect(
      groupByDay(rows, false).days.map((d) => [
        d.date,
        d.net,
        d.rows.map((r) => r.id),
      ]),
    ).toEqual([
      ['2026-11-03', '-2.00', ['a', 'b']],
      ['2026-11-01', '-1.00', ['c']],
    ])
  })

  it('points the next page before its last day, or nowhere at the end', () => {
    expect(groupByDay(rows, true).cursor).toBe('2026-11-01')
    expect(groupByDay(rows, false).cursor).toBeNull()
    expect(groupByDay([], false)).toEqual({ days: [], cursor: null })
  })
})

describe('period presets', () => {
  const base = {
    period: 'all' as const,
    month: '2026-11',
    year: '2026',
    start: '2026-10-19',
    end: '2026-11-17',
  }

  it('starts the last N months the day after the same date N months back', () => {
    expect(monthsStart('2026-11-17', 1)).toBe('2026-10-18')
    expect(monthsStart('2026-11-17', 12)).toBe('2025-11-18')
    expect(monthsStart('2026-01-10', 3)).toBe('2025-10-11')
    // A short month takes its last day: 31 March, one month back, is 29 February.
    expect(monthsStart('2024-03-31', 1)).toBe('2024-03-01')
  })

  it('gives each tab its range, which reads back as the same tab', () => {
    const today = '2026-11-17'
    for (const preset of ['m1', 'm3', 'm6', 'm12', 'all'] as const)
      expect(presetOf(presetChoice(preset, base, today), today)).toBe(preset)
    expect(presetChoice('m3', base, today)).toMatchObject({
      period: 'custom',
      start: '2026-08-18',
      end: today,
    })
  })

  it('names no tab for a month, a year, or a range that no longer ends today', () => {
    const today = '2026-11-18'
    expect(presetOf({ ...base, period: 'month' }, today)).toBeNull()
    expect(presetOf({ ...base, period: 'year' }, today)).toBeNull()
    expect(
      presetOf(
        { ...base, period: 'custom', start: '2026-10-18', end: '2026-11-17' },
        today,
      ),
    ).toBeNull()
  })
})
