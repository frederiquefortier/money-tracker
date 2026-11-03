import { describe, expect, it } from 'vitest'
import { formatDate, formatMoney, todayIso } from './format'

// ICU versions differ in which space they use as a separator.
const plain = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ')

describe('formatMoney', () => {
  it('formats with Canadian conventions per language', () => {
    expect(plain(formatMoney('-1234.5', 'CAD', 'fr'))).toBe('-1 234,50 $')
    expect(formatMoney('-1234.5', 'CAD', 'en')).toBe('-$1,234.50')
  })

  it('shows other currencies by code', () => {
    expect(plain(formatMoney('1234567.891', 'CHF', 'fr'))).toBe(
      '1 234 567,89 CHF',
    )
    expect(plain(formatMoney('1234567.891', 'CHF', 'en'))).toBe(
      'CHF 1,234,567.89',
    )
  })

  it('keeps decimal strings exact beyond float precision', () => {
    expect(formatMoney('90071992547409.93', 'USD', 'en')).toBe(
      'US$90,071,992,547,409.93',
    )
  })
})

describe('formatDate', () => {
  it('formats an ISO date in the language', () => {
    expect(formatDate('2024-01-15', 'fr')).toBe('15 janvier 2024')
    expect(formatDate('2024-01-15', 'en')).toBe('January 15, 2024')
  })

  it('never shifts the day', () => {
    expect(formatDate('2024-12-31', 'en')).toBe('December 31, 2024')
  })

  it('rejects anything that is not YYYY-MM-DD', () => {
    expect(() => formatDate('15/01/2024', 'fr')).toThrow(RangeError)
  })
})

describe('todayIso', () => {
  it('uses the local date, not the UTC one', () => {
    // 23:30 local time: in Canada, already the next day in UTC.
    expect(todayIso(new Date(2026, 10, 3, 23, 30))).toBe('2026-11-03')
    expect(todayIso(new Date(2026, 0, 9, 0, 5))).toBe('2026-01-09')
  })
})
