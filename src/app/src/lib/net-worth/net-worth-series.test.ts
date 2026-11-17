import { describe, expect, it } from 'vitest'
import {
  axisTicks,
  chartRows,
  itemPoints,
  hasFigures,
  seriesPoints,
} from '#/lib/net-worth/net-worth-series'
import type { ItemGroup, SeriesRow } from '#/lib/net-worth/net-worth-series'

const rows: Array<SeriesRow> = [
  {
    onDate: '2025-01-31',
    kind: 'investment',
    itemId: 'reer',
    displayValue: '1000.0000',
  },
  {
    onDate: '2025-01-31',
    kind: 'debt',
    itemId: 'loan',
    displayValue: '-300.0000',
  },
  {
    onDate: '2025-02-28',
    kind: 'account',
    itemId: 'chq',
    displayValue: '150.0000',
  },
  {
    onDate: '2025-02-28',
    kind: 'account',
    itemId: 'visa',
    displayValue: '-40.0000',
  },
  {
    onDate: '2025-02-28',
    kind: 'investment',
    itemId: 'reer',
    displayValue: '1200.0000',
  },
  { onDate: '2025-02-28', kind: 'asset', itemId: 'life', displayValue: null },
  {
    onDate: '2025-02-28',
    kind: 'debt',
    itemId: 'loan',
    displayValue: '-250.0000',
  },
]
const groups = new Map<string, ItemGroup>([
  ['chq', 'accounts'],
  ['visa', 'debts'],
  ['reer', 'investments'],
  ['life', 'assets'],
  ['loan', 'debts'],
])

describe('seriesPoints', () => {
  it('counts accounts as assets and credit cards as debts, owed as a positive amount', () => {
    expect(seriesPoints(rows, new Set(['life']), groups)[1]).toEqual({
      date: '2025-02-28',
      values: {
        assets: '1350.0000',
        debts: '290.0000',
        total: '1060.0000',
        'stack:accounts': '150.0000',
        'stack:investments': '1200.0000',
        'stack:debts': '-290.0000',
      },
    })
  })

  it('empties a line and the total when a rate is missing, never a partial sum', () => {
    const feb = seriesPoints(rows, new Set(), groups)[1]
    expect(feb.values.assets).toBeNull()
    expect(feb.values.total).toBeNull()
    expect(feb.values.debts).toBe('290.0000')
  })

  it('leaves out the chosen items', () => {
    const feb = seriesPoints(rows, new Set(['life', 'chq', 'visa']), groups)[1]
    expect(feb.values.total).toBe('950.0000')
  })
})

describe('itemPoints', () => {
  it('gives each counted item its own figure, rising from 0 the point before it starts', () => {
    const points = itemPoints(rows, new Set(['loan', 'life']), groups)
    expect(points[0].values).toEqual({
      reer: '1000.0000',
      chq: '0.0000',
      visa: '0.0000',
    })
    expect(points[1].values.chq).toBe('150.0000')
    expect(points[1].values.visa).toBe('40.0000')
  })
})

describe('hasFigures', () => {
  it('is false for a line never there or zero everywhere', () => {
    const points = seriesPoints(rows, new Set(['loan', 'visa']), groups)
    expect(hasFigures(points, 'stack:investments')).toBe(true)
    expect(hasFigures(points, 'stack:debts')).toBe(false)
  })
})

describe('axisTicks', () => {
  it('takes the smallest round step giving at most six lines, without forcing 0', () => {
    expect(axisTicks(150_000, 370_000)).toEqual([
      150_000, 200_000, 250_000, 300_000, 350_000, 400_000,
    ])
    expect(axisTicks(-80_000, 160_000)).toEqual([
      -100_000, 0, 100_000, 200_000,
    ])
  })

  it('works for small and flat figures', () => {
    expect(axisTicks(0, 36_000)).toEqual([0, 10_000, 20_000, 30_000, 40_000])
    expect(axisTicks(500, 500)).toEqual([450, 475, 500, 525, 550])
  })
})

describe('chartRows', () => {
  it('gives numbers for the drawing and null where a line has no figure', () => {
    const points = seriesPoints(rows, new Set(['life']), groups)
    expect(chartRows(points, ['total', 'stack:assets'])[0]).toEqual({
      date: '2025-01-31',
      total: 700,
      'stack:assets': null,
    })
  })
})
