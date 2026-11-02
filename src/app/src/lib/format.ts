import { FORMAT_LOCALE } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'

// Amounts are decimal strings (ADR-004); Intl formats them without a float.
export function formatMoney(
  amount: string,
  currency: string,
  locale: Locale,
): string {
  return new Intl.NumberFormat(FORMAT_LOCALE[locale], {
    style: 'currency',
    currency,
  }).format(amount as Intl.StringNumericLiteral)
}

/** Read as UTC so a `YYYY-MM-DD` date never shifts a day. */
export function formatDate(
  isoDate: string,
  locale: Locale,
  style: 'long' | 'medium' | 'short' = 'long',
): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day)
    throw new RangeError(`Not an ISO date: ${isoDate}`)
  return new Intl.DateTimeFormat(FORMAT_LOCALE[locale], {
    dateStyle: style,
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}
