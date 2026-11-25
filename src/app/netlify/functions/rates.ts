// Daily rates job (ADR-069): Frankfurter for every currency it has, HexaRate for the
// others users have added. The only place the secret key is used (security.md).
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  fetchFrankfurter,
  fetchFrankfurterCodes,
  fetchHexaRate,
  frankfurterRows,
} from '../../src/lib/currencies/rate-sources.ts'
import type { RateRow } from '../../src/lib/currencies/rate-sources.ts'

// After the ECB publishes (about 16:00 Frankfurt time) and Frankfurter picks it up.
export const config = { schedule: '0 17 * * *' }

const BACKFILL_FROM = '2018-01-01'
const CHUNK = 5000

export default async function rates() {
  // A first line, so a run that stops at once still shows in the function's log.
  console.log('[rates] start')
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key)
    throw new Error('SUPABASE_URL or SUPABASE_SECRET_KEY is not set')
  const db = createClient(url, key, { auth: { persistSession: false } })

  const { data: currencies, error } = await db.from('currencies').select('code')
  if (error) throw new Error(`currencies: ${error.code}`)
  const known = new Set(currencies.map((c) => c.code as string))
  const covered = await fetchFrankfurterCodes()
  const wanted = [...(await wantedCodes(db))].filter(
    (code) => code !== 'EUR' && known.has(code),
  )

  await frankfurter(
    db,
    wanted.filter((code) => covered.has(code)),
    known,
  )
  await hexarate(
    db,
    wanted.filter((code) => !covered.has(code)),
  )
}

type Db = SupabaseClient

// The currencies someone uses, and those already kept up (the ECB's list from v1).
async function wantedCodes(db: Db): Promise<Set<string>> {
  const used = await db
    .from('user_currencies')
    .select('code')
    .is('removed_at', null)
  if (used.error) throw new Error(`user_currencies: ${used.error.code}`)
  const last = await lastDay(db)
  const kept = last
    ? await db
        .from('exchange_rates')
        .select('quote')
        .eq('source', 'frankfurter')
        .eq('rate_date', last)
    : { data: [], error: null }
  if (kept.error) throw new Error(`exchange_rates: ${kept.error.code}`)
  return new Set([
    ...used.data.map((r) => r.code as string),
    ...kept.data.map((r) => r.quote as string),
  ])
}

// Each currency resumes from its own last stored day, so the first run is the backfill,
// a currency added later gets its history, and a missed day heals itself. A year per
// call; chunks go in date order, so a timeout leaves whole days for the next run.
async function frankfurter(
  db: Db,
  codes: ReadonlyArray<string>,
  known: ReadonlySet<string>,
) {
  const byStart = new Map<string, Array<string>>()
  for (const code of codes) {
    const last = await lastDay(db, code)
    const from = last ? nextDay(last) : BACKFILL_FROM
    byStart.set(from, [...(byStart.get(from) ?? []), code])
  }
  const today = new Date().toISOString().slice(0, 10)
  let count = 0
  for (const [start, quotes] of [...byStart].sort()) {
    for (let from = start; from <= today; from = nextYear(from)) {
      const to = dayBefore(nextYear(from))
      const rows = frankfurterRows(
        await fetchFrankfurter({ from, to, quotes }),
        from,
        known,
      )
      rows.sort((a, b) => a.rate_date.localeCompare(b.rate_date))
      for (let i = 0; i < rows.length; i += CHUNK) {
        await upsert(db, rows.slice(i, i + CHUNK), false)
      }
      count += rows.length
    }
  }
  console.log(
    `[rates] frankfurter: ${count} rows for ${codes.length} currencies`,
  )
}

async function lastDay(db: Db, quote?: string): Promise<string | null> {
  let query = db
    .from('exchange_rates')
    .select('rate_date')
    .eq('source', 'frankfurter')
  if (quote) query = query.eq('quote', quote)
  const { data, error } = await query
    .order('rate_date', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(`exchange_rates: ${error.code}`)
  return (data?.rate_date as string | undefined) ?? null
}

// Only what Frankfurter does not have, today's rate, nothing before (ADR-069).
async function hexarate(db: Db, wanted: ReadonlyArray<string>) {
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
  // A Frankfurter rate for the same day wins.
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

function shift(isoDate: string, days: number, years = 0) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCFullYear(
    date.getUTCFullYear() + years,
    date.getUTCMonth(),
    date.getUTCDate() + days,
  )
  return date.toISOString().slice(0, 10)
}

const nextDay = (isoDate: string) => shift(isoDate, 1)
const dayBefore = (isoDate: string) => shift(isoDate, -1)
const nextYear = (isoDate: string) => shift(isoDate, 0, 1)
