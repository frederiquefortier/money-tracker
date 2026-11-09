import { z } from 'zod'
import { inLocale } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'

export const currencyCodeSchema = z.string().regex(/^[A-Z]{3}$/)

export type Currency = {
  code: string
  nameFr: string
  nameEn: string
  symbol: string
}

export type MyCurrencies = {
  currencies: Array<Currency>
  defaultCurrency: string
  displayCurrency: string
}

// The first business day of the rates backfill (ADR-009). A currency whose rates start
// later shows when they start (spec 10).
export const RATES_HISTORY_START = '2018-01-02'

export function currencyName(currency: Currency, locale: Locale) {
  return inLocale(locale, currency.nameFr, currency.nameEn)
}

export type CurrencyError =
  'unavailable' | 'unknown' | 'isDefault' | 'usedByAccount' | 'failed'
