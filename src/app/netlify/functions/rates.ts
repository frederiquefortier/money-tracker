// Daily rates job (ADR-009): Frankfurter for what the ECB publishes, HexaRate for the
// other currencies users have added. The only place the secret key is used (security.md).
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  fetchFrankfurter,
  fetchHexaRate,
  frankfurterRows,
} from '../../src/lib/currencies/rate-sources.ts'
import type { RateRow } from '../../src/lib/currencies/rate-sources.ts'

// After the ECB publishes (about 16:00 Frankfurt time) and Frankfurter picks it up.
export const config = { schedule: '0 17 * * *' }

const BACKFILL_FROM = '2018-01-01'
const CHUNK = 5000

export default async function rates() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key)
    throw new Error('SUPABASE_URL or SUPABASE_SECRET_KEY is not set')
  const db = createClient(url, key, { auth: { persistSession: false } })

  const { data: currencies, error } = await db.from('currencies').select('code')
  if (error) throw new Error(`currencies: ${error.code}`)
  const known = new Set(currencies.map((c) => c.code as string))

  await frankfurter(db, known)
  await hexarate(db, await publishedOnLastDay(db))
}

type Db = SupabaseClient

// Resumes from the last stored day, so the first run is the backfill and a missed day
// heals itself. Chunks go in date order; a timeout leaves whole days for the next run.
async function frankfurter(db: Db, known: ReadonlySet<string>) {
  const { data: last, error } = await lastFrankfurterDay(db)
  if (error) throw new Error(`exchange_rates: ${error.code}`)
  const from = last ? nextDay(last.rate_date as string) : BACKFILL_FROM

  const rows = frankfurterRows(await fetchFrankfurter(from), from, known)
  rows.sort((a, b) => a.rate_date.localeCompare(b.rate_date))
  for (let i = 0; i < rows.length; i += CHUNK) {
    await upsert(db, rows.slice(i, i + CHUNK), false)
  }
  console.log(`[rates] frankfurter: ${rows.length} rows from ${from}`)
}

// The currencies on the last stored ECB day are the ones still published.
async function publishedOnLastDay(db: Db) {
  const { data: last, error } = await lastFrankfurterDay(db)
  if (error) throw new Error(`exchange_rates: ${error.code}`)
  if (!last) return new Set<string>()
  const { data, error: quotesError } = await db
    .from('exchange_rates')
    .select('quote')
    .eq('source', 'frankfurter')
    .eq('rate_date', last.rate_date)
  if (quotesError) throw new Error(`exchange_rates: ${quotesError.code}`)
  return new Set(data.map((r) => r.quote as string))
}

function lastFrankfurterDay(db: Db) {
  return db
    .from('exchange_rates')
    .select('rate_date')
    .eq('source', 'frankfurter')
    .order('rate_date', { ascending: false })
    .limit(1)
    .maybeSingle()
}

// Only currencies someone uses that Frankfurter did not cover today (ADR-009).
async function hexarate(db: Db, published: ReadonlySet<string>) {
  const { data, error } = await db
    .from('user_currencies')
    .select('code')
    .is('removed_at', null)
  if (error) throw new Error(`user_currencies: ${error.code}`)
  const wanted = [...new Set(data.map((r) => r.code as string))].filter(
    (code) => code !== 'EUR' && !published.has(code),
  )

  const rows: Array<RateRow> = []
  for (const code of wanted) {
    const result = await fetchHexaRate(code)
    if (result.ok) {
      rows.push({
        quote: code,
        rate_date: result.date,
        rate: result.rate,
        source: 'hexarate',
      })
    } else {
      console.error(`[rates] hexarate ${code}: ${result.reason}`)
    }
  }
  // An ECB rate for the same day wins.
  await upsert(db, rows, true)
  console.log(`[rates] hexarate: ${rows.length} of ${wanted.length}`)
}

async function upsert(db: Db, rows: Array<RateRow>, keepExisting: boolean) {
  if (rows.length === 0) return
  const { error } = await db.from('exchange_rates').upsert(
    rows.map((r) => ({ base: 'EUR', ...r })),
    { onConflict: 'base,quote,rate_date', ignoreDuplicates: keepExisting },
  )
  if (error) throw new Error(`exchange_rates: ${error.code}`)
}

function nextDay(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date.toISOString().slice(0, 10)
}
