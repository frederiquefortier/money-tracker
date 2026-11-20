import '@tanstack/react-start/server-only'
import type { PostgrestError } from '@supabase/supabase-js'
import type { Database } from '#/lib/db/database'
import { getSupabase } from '#/lib/server/supabase.server'

type Tables = Database['public']['Tables']
type Loaded<T> =
  { data: T; error: null } | { data: null; error: { code: string } }

/** The API's row cap (`max_rows` in config.toml). */
const PAGE = 1000

/**
 * Every row of a query the API would cut at its row cap, fetched a page at a time.
 * `page` asks for rows `from` to `to`; the query must order its rows so pages do not
 * overlap. Shaped like a single response, for `loaded`.
 */
export async function allRows<T>(
  page: (from: number, to: number) => PromiseLike<Loaded<Array<T>>>,
): Promise<Loaded<Array<T>>> {
  const rows: Array<T> = []
  for (let from = 0; ; from += PAGE) {
    const result = await page(from, from + PAGE - 1)
    if (result.error) return result
    rows.push(...result.data)
    if (result.data.length < PAGE) return { data: rows, error: null }
  }
}

/** Each query's rows; the first error throws, naming what could not be loaded. */
export function loaded<TResults extends ReadonlyArray<Loaded<unknown>>>(
  what: string,
  ...results: TResults
): { [K in keyof TResults]: NonNullable<TResults[K]['data']> } {
  const failed = results.find((r) => r.error)
  if (failed?.error) {
    throw new Error(`${what} could not be loaded (${failed.error.code})`)
  }
  return results.map((r) => r.data) as {
    [K in keyof TResults]: NonNullable<TResults[K]['data']>
  }
}

type SelectId = {
  select: (columns: 'id') => {
    maybeSingle: () => PromiseLike<{
      data: { id: string } | null
      error: PostgrestError | null
    }>
  }
}

type Done = PromiseLike<{ error: PostgrestError | null }>

// What the row helpers use of a table. supabase-js cannot type a query on a table chosen
// by a type parameter; the values are still checked against that table in each signature.
type Rows = {
  insert: (values: object) => SelectId
  update: (values: object) => {
    eq: (column: 'id', id: string) => SelectId & Done
  }
  delete: () => { eq: (column: 'id', id: string) => Done }
}

function rowsOf(table: keyof Tables) {
  return getSupabase().from(table) as unknown as Rows
}

/**
 * Inserts the row, or updates it when `id` is set, and returns its id; `saved` is null
 * when RLS hides the row or it is gone.
 */
export async function saveRow<TTable extends keyof Tables>(
  table: TTable,
  id: string | undefined,
  values: Tables[TTable]['Insert'] & Tables[TTable]['Update'],
) {
  const rows = rowsOf(table)
  const query = id ? rows.update(values).eq('id', id) : rows.insert(values)
  const { data, error } = await query.select('id').maybeSingle()
  return { saved: data, error }
}

/** Changes some columns of one row; a row RLS hides is left alone without an error. */
export async function updateRow<TTable extends keyof Tables>(
  table: TTable,
  id: string,
  values: Tables[TTable]['Update'],
) {
  const { error } = await rowsOf(table).update(values).eq('id', id)
  return error
}

export async function deleteRow(table: keyof Tables, id: string) {
  const { error } = await rowsOf(table).delete().eq('id', id)
  return error
}

/** The category every transfer fee goes to (TRX-04), from the user's profile. */
export async function loadFeeCategoryId(): Promise<string | null> {
  const [profile] = loaded(
    'Transfer fee category',
    await getSupabase()
      .from('profiles')
      .select('transfer_fee_category_id')
      .single(),
  )
  return profile.transfer_fee_category_id
}

export const SIGNED_OUT = { code: 'signed_out' }

/** The signed-in user's profile row. aal1 cannot write it (MFA policy). */
export async function updateProfile(values: Tables['profiles']['Update']) {
  const supabase = getSupabase()
  const { data: auth } = await supabase.auth.getClaims()
  if (!auth?.claims) return { error: SIGNED_OUT }
  // Supabase refuses an update without a filter; RLS limits it to the user anyway.
  const { error } = await supabase
    .from('profiles')
    .update(values)
    .eq('user_id', auth.claims.sub)
  return { error }
}

/** The ids something still points at, in one query; they can be archived, not deleted. */
export async function inUseIds(
  fn: 'used_category_ids' | 'used_account_ids' | 'holdings_with_history',
): Promise<Set<string>> {
  const [ids] = loaded('Usage', await getSupabase().rpc(fn))
  return new Set(ids)
}
