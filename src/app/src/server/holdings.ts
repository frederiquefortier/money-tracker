import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { holdingInputSchema } from '#/lib/holdings/holding'
import type {
  FormHolding,
  HoldingDetail,
  HoldingError,
  HoldingsPage,
} from '#/lib/holdings/holding'
import {
  deleteRow,
  inUseIds,
  loaded,
  saveRow,
  updateRow,
} from '#/lib/server/db.server'
import {
  HOLDING_COLUMNS,
  TOTALS_COLUMNS,
  holdingFailure as failure,
  loadHoldingTypes,
  toHolding,
} from '#/lib/server/holding.server'
import type { Result } from '#/lib/shared/result'
import { idInput } from '#/lib/shared/validation'
import { getSupabase } from '#/lib/server/supabase.server'

type HoldingResult<T = object> = Result<HoldingError, T>

/** The holdings with what each received and is worth, the types, and the unlinked count. */
export const getHoldings = createServerFn({ method: 'GET' }).handler(
  async (): Promise<HoldingsPage> => {
    const supabase = getSupabase()
    const [results, types, institutions] = await Promise.all([
      Promise.all([
        supabase.from('holdings').select(HOLDING_COLUMNS).order('name'),
        supabase.from('holding_totals').select(TOTALS_COLUMNS),
      ]),
      loadHoldingTypes(),
      supabase
        .from('institutions')
        .select('id, name, website_url')
        .order('name'),
    ])
    const [rows, totals] = loaded('Holdings', ...results)
    const [institutionRows] = loaded('Institutions', institutions)

    const used = await inUseIds(
      rows.map((r) => r.id),
      (id) =>
        supabase
          .from('transactions')
          .select('id')
          .eq('holding_id', id)
          .limit(1),
    )
    const unlinked = await supabase
      .from('transactions')
      .select('id, transaction_splits!inner(categories!inner(kind))', {
        count: 'exact',
        head: true,
      })
      .is('holding_id', null)
      .in('kind', ['expense', 'income'])
      .eq('transaction_splits.categories.kind', 'investment')
    if (unlinked.error)
      throw new Error(
        `Unlinked investments could not be counted (${unlinked.error.code})`,
      )

    const kinds = new Map(types.map((t) => [t.code, t.kind]))
    const byHolding = new Map(totals.map((t) => [t.holding_id, t]))
    return {
      holdings: rows.map((r) =>
        toHolding({
          row: r,
          kinds,
          totals: byHolding.get(r.id),
          inUse: used.has(r.id),
        }),
      ),
      institutions: institutionRows.map((i) => ({
        id: i.id,
        name: i.name,
        websiteUrl: i.website_url,
      })),
      types,
      unlinkedCount: unlinked.count ?? 0,
    }
  },
)

/** One holding with its values and its employer money, newest first; null when gone. */
export const getHolding = createServerFn({ method: 'GET' })
  .validator(idInput)
  .handler(async ({ data }): Promise<HoldingDetail | null> => {
    const supabase = getSupabase()
    const [row, totals, snapshots, contributions, types, used] =
      await Promise.all([
        supabase
          .from('holdings')
          .select(HOLDING_COLUMNS)
          .eq('id', data.id)
          .maybeSingle(),
        supabase
          .from('holding_totals')
          .select(TOTALS_COLUMNS)
          .eq('holding_id', data.id)
          .maybeSingle(),
        supabase
          .from('holding_snapshots')
          .select('id, on_date, amount::text')
          .eq('holding_id', data.id)
          .order('on_date', { ascending: false }),
        supabase
          .from('holding_contributions')
          .select('id, on_date, amount::text, label')
          .eq('holding_id', data.id)
          .order('on_date', { ascending: false }),
        loadHoldingTypes(),
        inUseIds([data.id], (id) =>
          supabase
            .from('transactions')
            .select('id')
            .eq('holding_id', id)
            .limit(1),
        ),
      ])
    const failed = [row, totals, snapshots, contributions].find((r) => r.error)
    if (failed?.error)
      throw new Error(`The holding could not be loaded (${failed.error.code})`)
    if (!row.data) return null

    const kinds = new Map(types.map((t) => [t.code, t.kind]))
    return {
      ...toHolding({
        row: row.data,
        kinds,
        totals: totals.data ?? undefined,
        inUse: used.has(data.id),
      }),
      snapshots: (snapshots.data ?? []).map((x) => ({
        id: x.id,
        onDate: x.on_date,
        amount: x.amount,
      })),
      contributions: (contributions.data ?? []).map((x) => ({
        id: x.id,
        onDate: x.on_date,
        amount: x.amount,
        label: x.label,
      })),
    }
  })

/** Every holding, so the transaction form can offer the ones open on its date. */
export const getFormHoldings = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<FormHolding>> => {
    const [data] = loaded(
      'Holdings',
      await getSupabase()
        .from('holdings')
        .select('id, name, currency, opened_on, closed_on')
        .order('name'),
    )
    return data.map((h) => ({
      id: h.id,
      name: h.name,
      currency: h.currency,
      openedOn: h.opened_on,
      closedOn: h.closed_on,
    }))
  },
)

export const saveHolding = createServerFn({ method: 'POST' })
  .validator(holdingInputSchema)
  .handler(async ({ data }): Promise<HoldingResult<{ id: string }>> => {
    const { saved, error } = await saveRow('holdings', data.id, {
      type: data.type,
      name: data.name,
      institution_id: data.institutionId,
      country: data.country || null,
      currency: data.currency,
      opened_on: data.openedOn,
      exclude_from_net_worth: data.excludeFromNetWorth,
    })
    if (error) return failure('save', error)
    if (!saved) return { ok: false, error: 'notFound' }
    return { ok: true, id: saved.id }
  })

export const closeHolding = createServerFn({ method: 'POST' })
  .validator(idInput.extend({ closedOn: z.iso.date() }))
  .handler(async ({ data }): Promise<HoldingResult> => {
    const error = await updateRow('holdings', data.id, {
      closed_on: data.closedOn,
    })
    return error ? failure('close', error) : { ok: true }
  })

export const reopenHolding = createServerFn({ method: 'POST' })
  .validator(idInput)
  .handler(async ({ data }): Promise<HoldingResult> => {
    const error = await updateRow('holdings', data.id, { closed_on: null })
    return error ? failure('reopen', error) : { ok: true }
  })

/** A holding with transactions refuses (23503): archive it instead. */
export const deleteHolding = createServerFn({ method: 'POST' })
  .validator(idInput)
  .handler(async ({ data }): Promise<HoldingResult> => {
    const error = await deleteRow('holdings', data.id)
    return error ? failure('delete', error) : { ok: true }
  })
