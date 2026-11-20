import { describe, expect, it } from 'vitest'
import {
  formatCount,
  formatDate,
  formatDay,
  formatMonth,
  formatMoney,
  moneyFormat,
  todayIso,
} from '#/lib/shared/format'

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

describe('formatDay and formatMonth', () => {
  it('names the weekday of a day header', () => {
    expect(formatDay('2026-11-02', 'fr')).toBe('lundi 2 novembre 2026')
    expect(formatDay('2026-11-02', 'en')).toBe('Monday, November 2, 2026')
  })

  it('names a month with its year, or alone', () => {
    expect(formatMonth('2026-11', 'fr')).toBe('novembre 2026')
    expect(formatMonth('2026-01', 'en')).toBe('January 2026')
    expect(formatMonth('2026-11', 'fr', 'short')).toBe('nov.')
  })
})

describe('signed amounts', () => {
  it('shows a plus on incomes and nothing on zero', () => {
    expect(plain(formatMoney('3400', 'CAD', 'fr'))).toBe('3 400,00 $')
    expect(
      plain(
        moneyFormat('CAD', 'fr', { signDisplay: 'exceptZero' }).format(3400),
      ),
    ).toBe('+3 400,00 $')
    expect(
      moneyFormat('CAD', 'en', { signDisplay: 'exceptZero' }).format(0),
    ).toBe('$0.00')
    expect(moneyFormat('CAD', 'en', { whole: true }).format('1234.50')).toBe(
      '$1,235',
    )
  })
})

describe('formatCount', () => {
  it('groups thousands the locale way', () => {
    expect(formatCount(1284, 'fr')).toBe('1\u00a0284')
    expect(formatCount(1284, 'en')).toBe('1,284')
  })
})
