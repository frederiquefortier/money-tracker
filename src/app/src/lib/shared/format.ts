import { FORMAT_LOCALE } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'

// A list formats several amounts and dates per row; building an Intl formatter is the
// slow part, so each locale and options pair is built once.
const numberFormats = new Map<string, Intl.NumberFormat>()
const dateFormats = new Map<string, Intl.DateTimeFormat>()

function numberFormat(locale: Locale, options: Intl.NumberFormatOptions = {}) {
  const key = locale + JSON.stringify(options)
  let format = numberFormats.get(key)
  if (!format) {
    format = new Intl.NumberFormat(FORMAT_LOCALE[locale], options)
    numberFormats.set(key, format)
  }
  return format
}

function dateFormat(locale: Locale, options: Intl.DateTimeFormatOptions) {
  const key = locale + JSON.stringify(options)
  let format = dateFormats.get(key)
  if (!format) {
    format = new Intl.DateTimeFormat(FORMAT_LOCALE[locale], options)
    dateFormats.set(key, format)
  }
  return format
}

export function moneyFormat(
  currency: string,
  locale: Locale,
  signDisplay: 'auto' | 'exceptZero' = 'auto',
) {
  return numberFormat(locale, {
    style: 'currency',
    currency,
    signDisplay,
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

export function percentFormat(locale: Locale, maximumFractionDigits: number) {
  return numberFormat(locale, {
    style: 'percent',
    maximumFractionDigits,
  })
}

/** An exchange rate, a decimal string, to four decimals. */
export function formatRate(rate: string, locale: Locale): string {
  return numberFormat(locale, {
    maximumFractionDigits: 4,
  }).format(rate as Intl.StringNumericLiteral)
}

/** A moment (a timestamp), shown as the date it fell on in the browser's time zone. */
export function formatInstant(timestamp: string, locale: Locale): string {
  return dateFormat(locale, {
    dateStyle: 'medium',
  }).format(new Date(timestamp))
}

/** Today in the browser's time zone; toISOString() would give the UTC date. */
export function todayIso(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function utcDate(isoDate: string): Date {
  const [year, month, day = 1] = isoDate.split('-').map(Number)
  if (!year || !month) throw new RangeError(`Not an ISO date: ${isoDate}`)
  return new Date(Date.UTC(year, month - 1, day))
}

/** Read as UTC so a `YYYY-MM-DD` date never shifts a day. */
export function formatDate(
  isoDate: string,
  locale: Locale,
  style: 'long' | 'medium' | 'short' = 'long',
): string {
  return dateFormat(locale, {
    dateStyle: style,
    timeZone: 'UTC',
  }).format(utcDate(isoDate))
}

/** "lundi 3 novembre 2026", a day header in the list; a period can span years. */
export function formatDay(isoDate: string, locale: Locale): string {
  return dateFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(utcDate(isoDate))
}

/** "novembre 2026" from "2026-11"; `short` gives the month alone, "nov.". */
export function formatMonth(
  month: string,
  locale: Locale,
  style: 'long' | 'short' = 'long',
): string {
  return dateFormat(locale, {
    month: style,
    year: style === 'long' ? 'numeric' : undefined,
    timeZone: 'UTC',
  }).format(utcDate(month))
}

/** “Maison” et “Entretien”: names in quotes, as every message names them. */
export function formatQuoted(name: string): string {
  return `“${name}”`
}

export function formatQuotedList(
  names: ReadonlyArray<string>,
  locale: Locale,
): string {
  return new Intl.ListFormat(FORMAT_LOCALE[locale], {
    type: 'conjunction',
  }).format(names.map(formatQuoted))
}

export function formatCount(count: number, locale: Locale): string {
  return numberFormat(locale).format(count)
}
