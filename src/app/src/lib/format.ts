import type { Locale } from '#/i18n/locales'

// Amounts travel as strings (ADR-004). Intl formats a decimal string exactly, with no
// detour through a float.
export function formatMoney(
  amount: string,
  currency: string,
  locale: Locale,
): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(
    amount as Intl.StringNumericLiteral,
  )
}

/** Formats a `YYYY-MM-DD` date. Read as UTC so it never shifts a day in another time zone. */
export function formatDate(
  isoDate: string,
  locale: Locale,
  style: 'long' | 'medium' | 'short' = 'long',
): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day)
    throw new RangeError(`Not an ISO date: ${isoDate}`)
  return new Intl.DateTimeFormat(locale, {
    dateStyle: style,
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

export function localeName(locale: Locale): string {
  const name =
    new Intl.DisplayNames([locale], { type: 'language' }).of(locale) ?? locale
  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1)
}
