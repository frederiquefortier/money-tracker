import { createServerFn } from '@tanstack/react-start'
import { loaded } from '#/lib/db.server'
import { absDecimal } from '#/lib/money'
import { failureFor } from '#/lib/result'
import type { Result } from '#/lib/result'
import { idInput } from '#/lib/schemas'
import { getSupabase } from '#/lib/supabase.server'
import { transferInputSchema } from '#/lib/transfers'
import type { Transfer } from '#/lib/transfers'
import type { ListedCategory } from '#/lib/transaction-list'

export type TransferError = 'notFound' | 'failed'
type TransferResult<T = object> = Result<TransferError, T>

const failure = failureFor<TransferError>('transfers', {
  P0002: 'notFound',
})

/** Both legs and the fee of one transfer; null when it is not there (spec 16). */
export const getTransfer = createServerFn({ method: 'GET' })
  .validator(idInput)
  .handler(async ({ data }): Promise<Transfer | null> => {
    const [rows] = loaded(
      'Transfer',
      await getSupabase()
        .from('transactions')
        .select('kind, account_id, occurred_on, amount::text, status, note')
        .eq('transfer_id', data.id),
    )
    const out = rows.find(
      (r) => r.kind === 'transfer' && r.amount.startsWith('-'),
    )
    const into = rows.find(
      (r) => r.kind === 'transfer' && !r.amount.startsWith('-'),
    )
    const fee = rows.find((r) => r.kind === 'expense')
    if (!out || !into) return null
    return {
      id: data.id,
      fromAccountId: out.account_id,
      toAccountId: into.account_id,
      occurredOn: out.occurred_on,
      amount: absDecimal(out.amount),
      received: into.amount,
      fee: fee ? absDecimal(fee.amount) : null,
      note: out.note,
      fromPending: out.status === 'pending',
      toPending: into.status === 'pending',
    }
  })

/** The category every transfer fee goes to, set in Réglages (TRX-04). */
export const getTransferFeeCategory = createServerFn({ method: 'GET' }).handler(
  async (): Promise<string | null> => {
    const [profile] = loaded(
      'Transfer fee category',
      await getSupabase()
        .from('profiles')
        .select('transfer_fee_category_id')
        .single(),
    )
    return profile.transfer_fee_category_id
  },
)

/** One SQL function writes both legs and the fee under one transfer_id (ADR-012). */
export const saveTransfer = createServerFn({ method: 'POST' })
  .validator(transferInputSchema)
  .handler(async ({ data }): Promise<TransferResult<{ id: string }>> => {
    const { data: id, error } = await getSupabase().rpc('save_transfer', {
      transfer_id: data.id ?? null,
      from_account: data.fromAccountId,
      to_account: data.toAccountId,
      amount: data.amount,
      occurred_on: data.occurredOn,
      received: data.received,
      fee: data.fee,
      note: data.note,
      from_pending: data.fromPending,
      to_pending: data.toPending,
    })
    if (error) return failure('save', error)
    return { ok: true, id }
  })

/** Every part of the transfer, its fee included (TRX-04). */
export const deleteTransfer = createServerFn({ method: 'POST' })
  .validator(idInput)
  .handler(async ({ data }): Promise<TransferResult> => {
    const { error } = await getSupabase().rpc('delete_transfer', {
      transfer_id: data.id,
    })
    if (error) return failure('delete', error)
    return { ok: true }
  })

/** The fee category's name and look, for the fee lines of the list (spec 14). */
export const getFeeCategory = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ListedCategory | null> => {
    const supabase = getSupabase()
    const [profile] = loaded(
      'Fee category',
      await supabase
        .from('profiles')
        .select('transfer_fee_category_id')
        .single(),
    )
    if (!profile.transfer_fee_category_id) return null
    const [category] = loaded(
      'Fee category',
      await supabase
        .from('categories')
        .select('name, icon, color')
        .eq('id', profile.transfer_fee_category_id)
        .maybeSingle(),
    )
    return category
  },
)
