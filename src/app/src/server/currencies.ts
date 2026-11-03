import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { currencyCodeSchema } from '#/lib/currencies'
import type { Currency, MyCurrencies } from '#/lib/currencies'
import { fetchHexaRate } from '#/lib/rates'
import { getSupabase } from '#/lib/supabase.server'

export type CurrencyError = 'unavailable' | 'unknown' | 'isDefault' | 'failed'
type Result = { ok: true } | { ok: false; error: CurrencyError }

const codeInput = z.object({ code: currencyCodeSchema })

// Undefined table, column or relationship, in Postgres and PostgREST.
const SCHEMA_NOT_YET = new Set(['42P01', '42703', 'PGRST200', 'PGRST205'])

type CurrencyRow = { name_fr: string; name_en: string; symbol: string }

function toCurrency(code: string, row: CurrencyRow): Currency {
  return {
    code,
    nameFr: row.name_fr,
    nameEn: row.name_en,
    symbol: row.symbol,
  }
}

function failed(context: string, code: string | undefined): Result {
  console.error(`[currencies] ${context}:`, code ?? 'unknown')
  return { ok: false, error: 'failed' }
}

/** The active list and the profile's two currencies, for every signed-in screen. */
export const getMyCurrencies = createServerFn({ method: 'GET' }).handler(
  async (): Promise<MyCurrencies> => {
    const supabase = getSupabase()
    const [profile, list] = await Promise.all([
      supabase
        .from('profiles')
        .select('default_currency, display_currency')
        .single(),
      supabase
        .from('user_currencies')
        .select('code, is_favourite, currencies(name_fr, name_en, symbol)')
        .is('removed_at', null)
        .order('code'),
    ])
    const error = profile.error ?? list.error
    // The app can deploy before the migration (ADR-017): until then, CAD and no list.
    if (error && SCHEMA_NOT_YET.has(error.code)) {
      return { currencies: [], defaultCurrency: 'CAD', displayCurrency: 'CAD' }
    }
    if (profile.error || list.error) {
      throw new Error(`Currencies could not be loaded (${error?.code})`)
    }
    return {
      currencies: list.data.map((row) => ({
        ...toCurrency(row.code, row.currencies as unknown as CurrencyRow),
        isFavourite: row.is_favourite,
      })),
      defaultCurrency: profile.data.default_currency,
      displayCurrency: profile.data.display_currency,
    }
  },
)

/** The ISO list for the add picker, and when the rates of each of the user's start. */
export const getCurrencySettings = createServerFn({ method: 'GET' }).handler(
  async () => {
    const supabase = getSupabase()
    const [catalog, mine] = await Promise.all([
      supabase
        .from('currencies')
        .select('code, name_fr, name_en, symbol')
        .order('code'),
      supabase.from('user_currencies').select('code').is('removed_at', null),
    ])
    if (catalog.error || mine.error) {
      const code = (catalog.error ?? mine.error)?.code
      throw new Error(`Currencies could not be loaded (${code})`)
    }

    // One primary-key lookup per currency; EUR is the base and always has rates.
    const firsts = await Promise.all(
      mine.data
        .map((row) => row.code as string)
        .filter((code) => code !== 'EUR')
        .map(async (code) => {
          const { data: first } = await supabase
            .from('exchange_rates')
            .select('rate_date')
            .eq('base', 'EUR')
            .eq('quote', code)
            .order('rate_date')
            .limit(1)
            .maybeSingle()
          return [code, (first?.rate_date as string | undefined) ?? null]
        }),
    )
    return {
      catalog: catalog.data.map((row) => toCurrency(row.code, row)),
      ratesFrom: Object.fromEntries(firsts) as Record<string, string | null>,
    }
  },
)

/**
 * CUR-02: HexaRate must know the currency. A currency removed earlier comes back
 * without the check (CUR-04).
 */
export const addCurrency = createServerFn({ method: 'POST' })
  .validator(codeInput)
  .handler(async ({ data }): Promise<Result> => {
    const supabase = getSupabase()
    const { data: existing, error } = await supabase
      .from('user_currencies')
      .select('removed_at')
      .eq('code', data.code)
      .maybeSingle()
    if (error) return failed('lookup', error.code)

    if (existing) {
      if (existing.removed_at === null) return { ok: true }
      const restored = await supabase
        .from('user_currencies')
        .update({ removed_at: null })
        .eq('code', data.code)
      return restored.error
        ? failed('restore', restored.error.code)
        : { ok: true }
    }

    if (data.code !== 'EUR') {
      const check = await fetchHexaRate(data.code)
      if (!check.ok) return { ok: false, error: check.reason }
    }
    const inserted = await supabase
      .from('user_currencies')
      .insert({ code: data.code })
    // 23503: not in the ISO list.
    if (inserted.error?.code === '23503') return { ok: false, error: 'unknown' }
    return inserted.error ? failed('insert', inserted.error.code) : { ok: true }
  })

export const setFavourite = createServerFn({ method: 'POST' })
  .validator(codeInput.extend({ on: z.boolean() }))
  .handler(async ({ data }): Promise<Result> => {
    const { error } = await getSupabase()
      .from('user_currencies')
      .update({ is_favourite: data.on })
      .eq('code', data.code)
    return error ? failed('favourite', error.code) : { ok: true }
  })

/**
 * Open accounts block removal and a transaction count asks for confirmation once those
 * tables exist (spec 10, specs 11 and 14). The display currency falls back to the default
 * in a trigger.
 */
export const removeCurrency = createServerFn({ method: 'POST' })
  .validator(codeInput)
  .handler(async ({ data }): Promise<Result> => {
    const { error } = await getSupabase()
      .from('user_currencies')
      .update({ removed_at: new Date().toISOString() })
      .eq('code', data.code)
      .is('removed_at', null)
    if (error?.message === 'default_currency_cannot_be_removed') {
      return { ok: false, error: 'isDefault' }
    }
    return error ? failed('remove', error.code) : { ok: true }
  })

export const setDefaultCurrency = createServerFn({ method: 'POST' })
  .validator(codeInput)
  .handler(async ({ data }) => updateProfile({ default_currency: data.code }))

export const setDisplayCurrency = createServerFn({ method: 'POST' })
  .validator(codeInput)
  .handler(async ({ data }) => updateProfile({ display_currency: data.code }))

async function updateProfile(
  values: { default_currency: string } | { display_currency: string },
): Promise<Result> {
  const supabase = getSupabase()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) return { ok: false, error: 'failed' }
  // Supabase refuses an update without a filter; RLS limits it to the user anyway.
  const { error } = await supabase
    .from('profiles')
    .update(values)
    .eq('user_id', auth.claims.sub)
  return error ? failed('profile', error.code) : { ok: true }
}
