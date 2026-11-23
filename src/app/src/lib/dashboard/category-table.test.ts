import { describe, expect, it } from 'vitest'
import {
  categoryTable,
  isAboveAverage,
  shownRows,
  sortTable,
  tableColumns,
} from '#/lib/dashboard/category-table'
import { changeSpans } from '#/lib/dashboard/category-change'
import { at, categories } from '#/lib/dashboard/dashboard-fixtures.test-utils'

const today = '2026-11-19'
const months = [
  at('2026-11', 'rent', '-1000.0000'),
  at('2026-05', 'rent', '-1000.0000'),
  at('2026-04', 'rent', '-1000.0000'),
  at('2025-11', 'fun', '-120.0000'),
  at('2025-10', 'fun', '-999.0000'),
]

describe('category table on a year', () => {
  const columns = tableColumns(
    { unit: 'year', year: '2026' },
    { today, firstYear: 2025 },
  )
  const rows = categoryTable(months, categories, {
    kind: 'expense',
    columns,
    locale: 'fr',
  })
  const of = (id: string) => rows.find((r) => r.category.id === id)?.figures

  it('gives this month, the year so far and its monthly average, in November over 11', () => {
    expect(of('rent')).toEqual({
      thisMonth: '1000.0000',
      thisYear: '3000.0000',
      averageMonth: '272.7273',
    })
    // Last year's spending stays out of this year's figures, and so does its category.
    expect(of('fun')).toBeUndefined()
  })

  it('averages from the first month of a history that starts within the year', () => {
    const late = tableColumns(
      { unit: 'year', year: '2026' },
      { today, firstYear: 2026, firstMonth: '2026-04' },
    )
    expect(late.find((c) => c.kind === 'averageMonth')).toMatchObject({
      from: '2026-04',
      divisor: 8,
    })
  })

  it('puts a group over its categories, with their figures added', () => {
    expect(rows.map((r) => [r.category.id, r.depth])).toEqual([
      ['home', 0],
      ['rent', 1],
    ])
    expect(of('home')?.thisYear).toBe('3000.0000')
  })

  it('sorts siblings, a group always over its categories', () => {
    const all = categoryTable(
      [...months, at('2026-03', 'fun', '-5000.0000')],
      categories,
      { kind: 'expense', columns, locale: 'fr' },
    )
    const ids = (sort: Parameters<typeof sortTable>[1]) =>
      sortTable(all, sort, 'fr').map((r) => r.category.id)
    expect(ids('amountDesc')).toEqual(['fun', 'home', 'rent'])
    expect(ids('amountAsc')).toEqual(['home', 'rent', 'fun'])
    expect(ids('nameDesc')).toEqual(['home', 'rent', 'fun'])
  })

  it("draws each row over the year's months to this one", () => {
    const trend = rows.find((r) => r.category.id === 'rent')?.trend
    expect(trend).toHaveLength(11)
    expect(trend?.[0]).toBe('0.0000')
    expect(trend?.[3]).toBe('1000.0000')
    expect(trend?.[10]).toBe('1000.0000')
  })
})

describe('category table on a past year', () => {
  it("counts back from that year's December, not from today", () => {
    const columns = tableColumns(
      { unit: 'year', year: '2025' },
      { today, firstYear: 2025 },
    )
    expect(columns[0]).toMatchObject({ from: '2025-12', to: '2025-12' })
    const rows = categoryTable(months, categories, {
      kind: 'expense',
      columns,
      locale: 'fr',
    })
    expect(rows.find((r) => r.category.id === 'fun')?.figures).toMatchObject({
      thisMonth: '0.0000',
      thisYear: '1119.0000',
    })
  })
})

describe('category table on everything', () => {
  const columns = tableColumns(
    { unit: 'all', year: '2026' },
    { today, firstYear: 2025 },
  )
  const rows = categoryTable(months, categories, {
    kind: 'expense',
    columns,
    locale: 'fr',
  })
  const of = (id: string) => rows.find((r) => r.category.id === id)?.figures

  it('gives a total per year and the yearly average', () => {
    expect(columns.map((c) => c.key)).toEqual(['2025', '2026', 'averageYear'])
    expect(of('fun')).toEqual({
      2025: '1119.0000',
      2026: '0.0000',
      averageYear: '559.5000',
    })
    expect(of('rent')).toEqual({
      2025: '0.0000',
      2026: '3000.0000',
      averageYear: '1500.0000',
    })
  })
})

describe('change against a year earlier', () => {
  const history = [
    at('2026-02', 'fun', '-150.0000'),
    at('2026-11', 'fun', '-60.0000'),
    at('2025-02', 'fun', '-100.0000'),
    at('2025-11', 'fun', '-80.0000'),
    // After November: outside the same months a year earlier.
    at('2025-12', 'fun', '-900.0000'),
    at('2026-03', 'misc', '-40.0000'),
    at('2024-05', 'rent', '-500.0000'),
    at('2025-05', 'rent', '-600.0000'),
  ]
  const rowsOf = (period: { unit: 'year' | 'all'; year: string }) =>
    categoryTable(history, categories, {
      kind: 'expense',
      columns: tableColumns(period, { today, firstYear: 2024 }),
      locale: 'fr',
    })
  const row = (rows: ReturnType<typeof rowsOf>, id: string) =>
    rows.find((r) => r.category.id === id)

  it('compares the year so far with the same months a year earlier', () => {
    const rows = rowsOf({ unit: 'year', year: '2026' })
    expect(row(rows, 'fun')?.change).toEqual({
      amount: '30.0000',
      percent: '16.667',
    })
  })

  it('shows no change without spending a year earlier', () => {
    expect(row(rowsOf({ unit: 'year', year: '2026' }), 'misc')?.change).toBe(
      null,
    )
  })

  it('draws last year under the same months, on a year only', () => {
    const fun = row(rowsOf({ unit: 'year', year: '2026' }), 'fun')
    expect(fun?.lastYearTrend).toHaveLength(11)
    expect(fun?.lastYearTrend?.[1]).toBe('100.0000')
    expect(fun?.lastYearTrend?.[10]).toBe('80.0000')
    expect(
      row(rowsOf({ unit: 'all', year: '2026' }), 'fun')?.lastYearTrend,
    ).toBe(null)
  })

  it('compares nothing on everything', () => {
    const rows = rowsOf({ unit: 'all', year: '2026' })
    expect(row(rows, 'rent')?.change).toBeNull()
    const columns = tableColumns(
      { unit: 'all', year: '2026' },
      { today, firstYear: 2024 },
    )
    expect(changeSpans(columns)).toBeNull()
  })
})

describe('above the average', () => {
  it('marks a month more than 10 % over its monthly average', () => {
    expect(isAboveAverage({ thisMonth: '111', averageMonth: '100' })).toBe(true)
    expect(isAboveAverage({ thisMonth: '110', averageMonth: '100' })).toBe(
      false,
    )
    expect(isAboveAverage({ thisMonth: '5', averageMonth: '0' })).toBe(false)
    expect(isAboveAverage({ 2025: '5' })).toBe(false)
  })
})

describe('folded groups', () => {
  const columns = tableColumns(
    { unit: 'year', year: '2026' },
    { today, firstYear: 2025 },
  )
  const rows = categoryTable(
    [...months, at('2026-02', 'fun', '-10.0000')],
    categories,
    {
      kind: 'expense',
      columns,
      locale: 'fr',
    },
  )
  const ids = (open: Set<string>) =>
    shownRows(rows, open).map(({ row, folds }) => [row.category.id, folds])

  it('shows only the groups while they are closed', () => {
    expect(ids(new Set())).toEqual([
      ['fun', false],
      ['home', true],
    ])
  })

  it("shows an open group's categories under it", () => {
    expect(ids(new Set(['home'])).map(([id]) => id)).toEqual([
      'fun',
      'home',
      'rent',
    ])
  })
})
