import { describe, expect, it } from 'vitest'
import {
  bucketOf,
  bucketsOf,
  dashboardSearchSchema,
  inPeriod,
  periodFromSearch,
  searchOfPeriod,
} from '#/lib/dashboard/dashboard-period'

const today = '2026-11-19'

describe('dashboard period', () => {
  it('opens on everything and reads back what it writes', () => {
    expect(periodFromSearch({}, today)).toEqual({ unit: 'all', year: '2026' })
    const year = { unit: 'year' as const, year: '2024' }
    expect(periodFromSearch(searchOfPeriod(year), today)).toEqual(year)
    expect(
      periodFromSearch(
        dashboardSearchSchema.parse({ unit: 'year', year: 'x' }),
        today,
      ).unit,
    ).toBe('all')
  })

  it('counts a year by month and everything by year', () => {
    expect(bucketsOf({ unit: 'year', year: '2025' }, 2018, today)).toHaveLength(
      12,
    )
    expect(bucketsOf({ unit: 'all', year: '2026' }, 2018, today)).toEqual([
      '2018',
      '2019',
      '2020',
      '2021',
      '2022',
      '2023',
      '2024',
      '2025',
      '2026',
    ])
    expect(bucketOf({ unit: 'all', year: '2026' }, '2024-03')).toBe('2024')
    expect(inPeriod({ unit: 'year', year: '2025' }, '2026-01')).toBe(false)
  })
})
