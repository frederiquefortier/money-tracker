import { describe, expect, it } from 'vitest'
import {
  addDays,
  daysGoneBy,
  daysIn,
  monthEnd,
  monthOf,
  monthsStart,
  shiftMonth,
} from '#/lib/shared/months'

describe('months', () => {
  it('steps across years', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(shiftMonth('2025-12', 1)).toBe('2026-01')
    expect(shiftMonth('2026-11', 14)).toBe('2028-01')
  })

  it('takes the month of a date and its last day', () => {
    expect(monthOf('2026-11-05')).toBe('2026-11')
    expect(monthEnd('2024-02')).toBe('2024-02-29')
    expect(monthEnd('2026-12')).toBe('2026-12-31')
  })

  it('counts and steps days across a month and a year', () => {
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
    expect(daysIn('2026-01-01', '2026-01-01')).toBe(1)
    expect(daysIn('2024-01-01', '2024-12-31')).toBe(366)
  })

  it('starts the last N months the day after the same date N months back', () => {
    expect(monthsStart('2026-11-17', 1)).toBe('2026-10-18')
    expect(monthsStart('2026-11-17', 12)).toBe('2025-11-18')
    expect(monthsStart('2026-01-10', 3)).toBe('2025-10-11')
    // A short month takes its last day: 31 March, one month back, is 29 February.
    expect(monthsStart('2024-03-31', 1)).toBe('2024-03-01')
  })
})

describe('daysGoneBy', () => {
  it('counts to today, a whole range once over, nothing before it starts', () => {
    const range = { from: '2026-01-01', to: '2026-12-31' }
    expect(daysGoneBy(range, '2026-01-10')).toBe(10)
    expect(daysGoneBy(range, '2027-03-01')).toBe(365)
    expect(daysGoneBy(range, '2025-12-31')).toBe(0)
  })
})
