import { describe, expect, it } from 'vitest'
import { tableColumns } from '#/lib/dashboard/category-table'
import { merchantBills, sortBills } from '#/lib/dashboard/merchant-bills'
import type { MerchantMonth } from '#/lib/dashboard/merchant-bills'

const today = '2026-11-19'
const merchants = [
  { id: 'grocer', name: 'Épicerie Test' },
  { id: 'cafe', name: 'Café Test' },
  { id: 'gone', name: 'Fermé Test' },
]

const bill = (
  month: string,
  merchantId: string,
  [visits, total, min = total, max = total]: [
    number,
    string | null,
    (string | null)?,
    (string | null)?,
  ],
): MerchantMonth => ({ month, merchantId, visits, total, min, max })

const months = [
  bill('2026-02', 'grocer', [2, '200.0000', '80.0000', '120.0000']),
  bill('2026-11', 'grocer', [1, '130.0000']),
  bill('2025-02', 'grocer', [3, '240.0000', '60.0000', '100.0000']),
  bill('2026-05', 'cafe', [4, '20.0000', '4.0000', '6.0000']),
  bill('2024-06', 'gone', [1, '50.0000']),
]

const onYear = tableColumns(
  { unit: 'year', year: '2026' },
  { today, firstYear: 2024 },
)

describe('merchant bills on a year', () => {
  const rows = merchantBills(months, merchants, onYear)
  const row = (id: string) => rows.find((r) => r.merchant.id === id)

  it('gives visits, total, average, smallest and largest bill over the year so far', () => {
    expect(row('grocer')?.figures).toEqual({
      visits: 3,
      total: '330.0000',
      average: '110.0000',
      min: '80.0000',
      max: '130.0000',
    })
  })

  it("gives the category table's columns: this month, the year so far, its monthly average", () => {
    expect(row('grocer')?.columns).toEqual({
      thisMonth: '130.0000',
      thisYear: '330.0000',
      averageMonth: '30.0000',
    })
    expect(row('cafe')?.columns.thisMonth).toBe('0.0000')
  })

  it('lists only merchants with a bill in the period', () => {
    expect(rows.map((r) => r.merchant.id)).toEqual(['grocer', 'cafe'])
  })

  it('sorts by name, average bill or number of transactions', () => {
    const ids = (sort: Parameters<typeof sortBills>[1]) =>
      sortBills(rows, sort, 'fr').map((r) => r.merchant.id)
    expect(ids('nameAsc')).toEqual(['cafe', 'grocer'])
    expect(ids('nameDesc')).toEqual(['grocer', 'cafe'])
    expect(ids('amountDesc')).toEqual(['grocer', 'cafe'])
    expect(ids('amountAsc')).toEqual(['cafe', 'grocer'])
    expect(ids('countDesc')).toEqual(['cafe', 'grocer'])
    expect(ids('countAsc')).toEqual(['grocer', 'cafe'])
  })

  it('compares the average bill with the same months a year earlier', () => {
    expect(row('grocer')?.before?.average).toBe('80.0000')
    expect(row('grocer')?.change).toEqual({
      amount: '30.0000',
      percent: '37.500',
    })
    expect(row('cafe')?.change).toBeNull()
  })

  it('draws the total per month, a month without a visit at zero, and last year', () => {
    const grocer = row('grocer')
    expect(grocer?.trend).toHaveLength(11)
    expect(grocer?.trend[0]).toBe('0.0000')
    expect(grocer?.trend[1]).toBe('200.0000')
    expect(grocer?.lastYearTrend?.[0]).toBe('0.0000')
    expect(grocer?.lastYearTrend?.[1]).toBe('240.0000')
  })

  it('gives no figure when a bill misses a rate', () => {
    const missing = merchantBills(
      [...months, bill('2026-03', 'grocer', [1, null])],
      merchants,
      onYear,
    )
    expect(
      missing.find((r) => r.merchant.id === 'grocer')?.figures,
    ).toMatchObject({
      visits: 4,
      total: null,
      average: null,
    })
  })
})

describe('merchant bills on everything', () => {
  it('counts every year and has no last-year line', () => {
    const rows = merchantBills(
      months,
      merchants,
      tableColumns({ unit: 'all', year: '2026' }, { today, firstYear: 2024 }),
    )
    expect(rows.map((r) => r.merchant.id)).toEqual(['grocer', 'cafe', 'gone'])
    expect(rows[0]?.figures.visits).toBe(6)
    expect(rows[0]?.lastYearTrend).toBeNull()
    expect(rows[0]?.trend).toHaveLength(3)
  })
})
