import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { currencyCodeSchema } from '#/lib/currencies'
import type { Currency, MyCurrencies } from '#/lib/currencies'
import { loaded, updateProfile } from '#/lib/db.server'
import { fetchHexaRate } from '#/lib/rates'
import { failureFor } from '#/lib/result'
import type { Result } from '#/lib/result'
import { getSupabase } from '#/lib/supabase.server'

export type CurrencyError =
  'unavailable' | 'unknown' | 'isDefault' | 'usedByAccount' | 'failed'
type CurrencyResult = Result<CurrencyError>

const codeInput = z.object({ code: currencyCodeSchema })

const failure = failureFor<CurrencyError>('currencies', {
  // On insert: not in the ISO list.
  '23503': 'unknown',
  default_currency_cannot_be_removed: 'isDefault',
  currency_used_by_open_account: 'usedByAccount',
})

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
        .select('code, currencies(name_fr, name_en, symbol)')
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
      currencies: list.data.map((row) => toCurrency(row.code, row.currencies)),
      defaultCurrency: profile.data.default_currency,
      displayCurrency: profile.data.display_currency,
    }
  },
)

/** The ISO list for the add picker, and when the rates of each of the user's start. */
export const getCurrencySettings = createServerFn({ method: 'GET' }).handler(
  async () => {
    const supabase = getSupabase()
    const [catalog, mine, open] = await Promise.all([
      supabase
        .from('currencies')
        .select('code, name_fr, name_en, symbol')
        .order('code'),
      supabase.from('user_currencies').select('code').is('removed_at', null),
      // An open account keeps its currency (CUR-04).
      supabase
        .from('accounts')
        .select('name, currency')
        .is('closed_on', null)
        .order('name'),
    ])
    const [catalogRows, mineRows, openRows] = loaded(
      'Currencies',
      catalog,
      mine,
      open,
    )

    // One primary-key lookup per currency; EUR is the base and always has rates.
    const firsts = await Promise.all(
      mineRows
        .map((row) => row.code)
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
          return [code, first?.rate_date ?? null]
        }),
    )
    return {
      catalog: catalogRows.map((row) => toCurrency(row.code, row)),
      ratesFrom: Object.fromEntries(firsts) as Record<string, string | null>,
      openAccounts: openRows.reduce<Partial<Record<string, Array<string>>>>(
        (byCode, account) => {
          ;(byCode[account.currency] ??= []).push(account.name)
          return byCode
        },
        {},
      ),
    }
  },
)

/** Units of `to` for one `from` on `date`, as exact text; null when a rate is missing. */
export const getRate = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      from: currencyCodeSchema,
      to: currencyCodeSchema,
      date: z.iso.date(),
    }),
  )
  .handler(async ({ data }): Promise<string | null> => {
    const { data: rate, error } = await getSupabase().rpc(
      'exchange_rate_text',
      { from_currency: data.from, to_currency: data.to, on_date: data.date },
    )
    if (error) throw new Error(`The rate could not be loaded (${error.code})`)
    return rate
  })

/**
 * CUR-02: HexaRate must know the currency. A currency removed earlier comes back
 * without the check (CUR-04).
 */
export const addCurrency = createServerFn({ method: 'POST' })
  .validator(codeInput)
  .handler(async ({ data }): Promise<CurrencyResult> => {
    const supabase = getSupabase()
    const { data: existing, error } = await supabase
      .from('user_currencies')
      .select('removed_at')
      .eq('code', data.code)
      .maybeSingle()
    if (error) return failure('lookup', error)

    if (existing) {
      if (existing.removed_at === null) return { ok: true }
      const restored = await supabase
        .from('user_currencies')
        .update({ removed_at: null })
        .eq('code', data.code)
      return restored.error ? failure('restore', restored.error) : { ok: true }
    }

    if (data.code !== 'EUR') {
      const check = await fetchHexaRate(data.code)
      if (!check.ok) return { ok: false, error: check.reason }
    }
    const inserted = await supabase
      .from('user_currencies')
      .insert({ code: data.code })
    return inserted.error ? failure('insert', inserted.error) : { ok: true }
  })

/**
 * Open accounts block removal and a transaction count asks for confirmation once those
 * tables exist (spec 10, specs 11 and 14). The display currency falls back to the default
 * in a trigger.
 */
export const removeCurrency = createServerFn({ method: 'POST' })
  .validator(codeInput)
  .handler(async ({ data }): Promise<CurrencyResult> => {
    const { error } = await getSupabase()
      .from('user_currencies')
      .update({ removed_at: new Date().toISOString() })
      .eq('code', data.code)
      .is('removed_at', null)
    return error ? failure('remove', error) : { ok: true }
  })

export const setDefaultCurrency = createServerFn({ method: 'POST' })
  .validator(codeInput)
  .handler(async ({ data }) => setProfile({ default_currency: data.code }))

export const setDisplayCurrency = createServerFn({ method: 'POST' })
  .validator(codeInput)
  .handler(async ({ data }) => setProfile({ display_currency: data.code }))

async function setProfile(
  values: { default_currency: string } | { display_currency: string },
): Promise<CurrencyResult> {
  const { error } = await updateProfile(values)
  return error ? failure('profile', error) : { ok: true }
}
