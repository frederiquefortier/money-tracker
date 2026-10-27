import { describe, expect, it } from 'vitest'
import { formatDate, formatMoney, localeName } from './format'

// ICU versions differ in which space or apostrophe they use as a separator.
const plain = (s: string) =>
  s.replace(/[\u00a0\u202f]/g, ' ').replace(/\u2019/g, "'")

describe('formatMoney', () => {
  it('follows the full locale, not just the language', () => {
    expect(plain(formatMoney('-1234.5', 'CAD', 'fr-CA'))).toBe('-1 234,50 $')
    expect(plain(formatMoney('1234567.891', 'CHF', 'fr-CH'))).toBe(
      "1'234'567.89 CHF",
    )
    expect(formatMoney('-1234.5', 'CAD', 'en-CA')).toBe('-$1,234.50')
  })

  it('keeps decimal strings exact beyond float precision', () => {
    expect(formatMoney('90071992547409.93', 'USD', 'en-US')).toBe(
      '$90,071,992,547,409.93',
    )
  })
})

describe('formatDate', () => {
  it('formats an ISO date in the locale', () => {
    expect(formatDate('2024-01-15', 'fr-CA')).toBe('15 janvier 2024')
    expect(formatDate('2024-01-15', 'en-CA')).toBe('January 15, 2024')
  })

  it('never shifts the day', () => {
    expect(formatDate('2024-12-31', 'en-US')).toBe('December 31, 2024')
  })

  it('rejects anything that is not YYYY-MM-DD', () => {
    expect(() => formatDate('15/01/2024', 'fr-CA')).toThrow(RangeError)
  })
})

describe('localeName', () => {
  it('names a locale in itself, capitalised', () => {
    expect(localeName('fr-CH')).toBe('Français suisse')
    expect(localeName('en-GB')).toBe('British English')
  })
})
