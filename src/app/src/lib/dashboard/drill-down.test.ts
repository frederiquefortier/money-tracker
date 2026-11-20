import { describe, expect, it } from 'vitest'
import {
  bucketSearch,
  daySearch,
  periodSearch,
} from '#/lib/dashboard/drill-down'

const all = { unit: 'all' as const, year: '2026' }
const year = { unit: 'year' as const, year: '2024' }

describe('drill-down', () => {
  it('opens a month, a year or a day as a range, with the way back', () => {
    expect(bucketSearch(year, '2024-02')).toEqual({
      period: 'custom',
      start: '2024-02-01',
      end: '2024-02-29',
      dashboard: '2024',
    })
    expect(bucketSearch(all, '2025')).toEqual({
      period: 'custom',
      start: '2025-01-01',
      end: '2025-12-31',
      dashboard: 'all',
    })
    expect(daySearch(year, '2024-03-04')).toMatchObject({
      start: '2024-03-04',
      end: '2024-03-04',
    })
  })

  it('narrows a month to some categories', () => {
    expect(bucketSearch(all, '2026-03', ['a', 'b']).category).toEqual([
      'a',
      'b',
    ])
    expect(bucketSearch(all, '2026-03').category).toBeUndefined()
  })

  it('narrows the period to a category', () => {
    expect(periodSearch(all, 'c1')).toEqual({
      period: 'all',
      dashboard: 'all',
      category: ['c1'],
    })
    expect(periodSearch(year).start).toBe('2024-01-01')
  })
})
