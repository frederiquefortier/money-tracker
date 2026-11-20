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
  it('opens on the current year and reads back what it writes', () => {
    expect(periodFromSearch({}, today)).toEqual({ unit: 'year', year: '2026' })
    const all = { unit: 'all' as const, year: '2026' }
    expect(periodFromSearch(searchOfPeriod(all), today).unit).toBe('all')
    expect(
      periodFromSearch(
        dashboardSearchSchema.parse({ unit: 'nope', year: 'x' }),
        today,
      ),
    ).toEqual({
      unit: 'year',
      year: '2026',
    })
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
