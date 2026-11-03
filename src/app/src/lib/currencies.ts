import { z } from 'zod'
import type { Locale } from '#/i18n/locales'

export const currencyCodeSchema = z.string().regex(/^[A-Z]{3}$/)

export type Currency = {
  code: string
  nameFr: string
  nameEn: string
  symbol: string
}

export type UserCurrency = Currency & { isFavourite: boolean }

export type MyCurrencies = {
  currencies: Array<UserCurrency>
  defaultCurrency: string
  displayCurrency: string
}

// The first business day of the rates backfill (ADR-009). A currency whose rates start
// later shows when they start (spec 10).
export const RATES_HISTORY_START = '2018-01-02'

export function currencyName(currency: Currency, locale: Locale) {
  return locale === 'fr' ? currency.nameFr : currency.nameEn
}

/** Favourites first, then alphabetical by code (CUR-03). */
export function pickerOrder<T extends UserCurrency>(
  currencies: ReadonlyArray<T>,
): Array<T> {
  return [...currencies].sort(
    (a, b) =>
      Number(b.isFavourite) - Number(a.isFavourite) ||
      a.code.localeCompare(b.code),
  )
}

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

/** Matches the code and the name in both languages, accents ignored. */
export function searchCurrencies<T extends Currency>(
  currencies: ReadonlyArray<T>,
  query: string,
): Array<T> {
  const q = fold(query.trim())
  if (!q) return [...currencies]
  return currencies.filter((c) =>
    [c.code, c.nameFr, c.nameEn].some((field) => fold(field).includes(q)),
  )
}
