import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { adjustmentInputSchema } from '#/lib/adjustments/adjustment'
import type { Adjustment, AdjustmentError } from '#/lib/adjustments/adjustment'
import { failureFor } from '#/lib/shared/result'
import type { Result } from '#/lib/shared/result'
import { idInput } from '#/lib/shared/validation'
import { getSupabase } from '#/lib/server/supabase.server'

type AdjustmentResult<T = object> = Result<AdjustmentError, T>

const failure = failureFor<AdjustmentError>('adjustments', {
  P0002: 'notFound',
  balance_already_matches: 'balanceMatches',
})

/** One adjustment; null when it is not there (spec 16). */
export const getAdjustment = createServerFn({ method: 'GET' })
  .validator(idInput)
  .handler(async ({ data }): Promise<Adjustment | null> => {
    const { data: row, error } = await getSupabase()
      .from('transactions')
      .select('id, account_id, occurred_on, amount::text, note')
      .eq('id', data.id)
      .eq('kind', 'adjustment')
      .maybeSingle()
    if (error)
      throw new Error(`The adjustment could not be loaded (${error.code})`)
    if (!row) return null
    return {
      id: row.id,
      accountId: row.account_id,
      occurredOn: row.occurred_on,
      amount: row.amount,
      note: row.note,
    }
  })

/**
 * The account's balance at the end of a day, pending included, as exact text. An
 * adjustment being edited is left out, so the gap is measured as if it were not there.
 */
export const getAdjustmentBalance = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      accountId: z.uuid(),
      on: z.iso.date(),
      adjustmentId: z.uuid().optional(),
    }),
  )
  .handler(async ({ data }): Promise<string> => {
    const { data: balance, error } = await getSupabase().rpc(
      'adjustment_balance_text',
      {
        account_id: data.accountId,
        on_date: data.on,
        adjustment_id: data.adjustmentId,
      },
    )
    if (error)
      throw new Error(`The balance could not be loaded (${error.code})`)
    return balance
  })

/** The SQL function stores the gap from the real balance (TRX-03). */
export const saveAdjustment = createServerFn({ method: 'POST' })
  .validator(adjustmentInputSchema)
  .handler(async ({ data }): Promise<AdjustmentResult<{ id: string }>> => {
    const { data: id, error } = await getSupabase().rpc('save_adjustment', {
      adjustment_id: data.id ?? null,
      account_id: data.accountId,
      real_balance: data.realBalance,
      occurred_on: data.occurredOn,
      note: data.note,
    })
    if (error) return failure('save', error)
    return { ok: true, id }
  })

export const deleteAdjustment = createServerFn({ method: 'POST' })
  .validator(idInput)
  .handler(async ({ data }): Promise<AdjustmentResult> => {
    const { data: deleted, error } = await getSupabase()
      .from('transactions')
      .delete()
      .eq('id', data.id)
      .eq('kind', 'adjustment')
      .select('id')
    if (error) return failure('delete', error)
    return deleted.length ? { ok: true } : { ok: false, error: 'notFound' }
  })
