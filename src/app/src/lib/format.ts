import { FORMAT_LOCALE } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'

export function moneyFormat(currency: string, locale: Locale) {
  return new Intl.NumberFormat(FORMAT_LOCALE[locale], {
    style: 'currency',
    currency,
  })
}

// Amounts are decimal strings (ADR-004); Intl formats them without a float.
export function formatMoney(
  amount: string,
  currency: string,
  locale: Locale,
): string {
  return moneyFormat(currency, locale).format(
    amount as Intl.StringNumericLiteral,
  )
}

/** Today in the browser's time zone; toISOString() would give the UTC date. */
export function todayIso(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
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
