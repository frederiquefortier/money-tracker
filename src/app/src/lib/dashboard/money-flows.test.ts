import { describe, expect, it } from 'vitest'
import { at, categories } from '#/lib/dashboard/dashboard-fixtures.test-utils'
import {
  averageFlows,
  bucketFlows,
  comparedFlows,
  cumulative,
  periodFlows,
} from '#/lib/dashboard/money-flows'

const months = [
  at('2025-06', 'pay', '1000.0000'),
  at('2025-06', 'rent', '-600.0000'),
  at('2026-01', 'pay', '3000.0000'),
  at('2026-01', 'rent', '-1000.0000'),
  // A refund lowers spending.
  at('2026-01', 'fun', '50.0000'),
  at('2026-02', 'fun', '-300.0000'),
  at('2026-02', 'etf', '-500.0000'),
]
const year = { unit: 'year' as const, year: '2026' }

describe('money flows', () => {
  it('gives earned, spent, invested and what remains', () => {
    expect(periodFlows(months, categories, year)).toEqual({
      earned: '3000.0000',
      spent: '1250.0000',
      invested: '500.0000',
      remaining: '1250.0000',
    })
  })

  it('averages each flow over the months counted', () => {
    expect(
      averageFlows(
        {
          earned: '3000.0000',
          spent: '1250.0000',
          invested: null,
          remaining: '1.0000',
        },
        3,
      ),
    ).toEqual({
      earned: '1000.0000',
      spent: '416.6667',
      invested: null,
      remaining: '0.3333',
    })
  })

  it('counts everything over the whole history', () => {
    expect(
      periodFlows(months, categories, { unit: 'all', year: '2026' }).remaining,
    ).toBe('1650.0000')
  })

  it('gives a missing rate as no figure, never a partial sum', () => {
    expect(
      periodFlows([...months, at('2026-03', 'fun', null)], categories, year),
    ).toMatchObject({
      spent: null,
      remaining: null,
      earned: '3000.0000',
    })
  })

  it('buckets by month', () => {
    const buckets = bucketFlows(months, categories, {
      period: year,
      buckets: ['2026-01', '2026-02'],
    })
    expect(buckets.map((b) => [b.earned, b.spent])).toEqual([
      ['3000.0000', '950.0000'],
      ['0.0000', '300.0000'],
    ])
  })

  it('starts the year with what earlier years left, and stops at this month', () => {
    const points = cumulative(months, categories, {
      period: year,
      firstMonth: '2025-06',
      today: '2026-03-10',
    })
    expect(points).toEqual([
      { month: '2026-01', income: '3400.0000', spent: '950.0000' },
      { month: '2026-02', income: '3400.0000', spent: '1250.0000' },
      { month: '2026-03', income: '3400.0000', spent: '1250.0000' },
    ])
  })
})

describe('the same stretch a year earlier', () => {
  const history = [
    at('2025-01', 'pay', '900.0000'),
    at('2025-02', 'rent', '-400.0000'),
    at('2025-03', 'rent', '-999.0000'),
    at('2025-12', 'pay', '100.0000'),
  ]

  it("takes the current year's months so far, one year back", () => {
    expect(
      comparedFlows(history, categories, { period: year, today: '2026-02-10' }),
    ).toEqual({
      year: '2025',
      flows: {
        earned: '900.0000',
        spent: '400.0000',
        invested: '0.0000',
        remaining: '500.0000',
      },
    })
  })

  it('takes the whole year before a past year', () => {
    expect(
      comparedFlows(history, categories, {
        period: year,
        today: '2027-05-01',
      })?.flows.spent,
    ).toBe('1399.0000')
  })

  it('compares nothing on everything', () => {
    expect(
      comparedFlows(history, categories, {
        period: { unit: 'all', year: '2026' },
        today: '2026-02-10',
      }),
    ).toBeNull()
  })
})
