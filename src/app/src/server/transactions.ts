import { createServerFn } from '@tanstack/react-start'
import { loaded } from '#/lib/db.server'
import { absDecimal, compareDecimal } from '#/lib/money'
import { failureFor } from '#/lib/result'
import type { Result } from '#/lib/result'
import { idInput } from '#/lib/schemas'
import { getSupabase } from '#/lib/supabase.server'
import {
  SPLIT_MODES,
  TRANSACTION_KINDS,
  transactionInputSchema,
} from '#/lib/transactions'
import { isOneOf } from '#/lib/utils'
import type {
  FormAccount,
  FrequentCategories,
  Transaction,
} from '#/lib/transactions'

export type TransactionError = 'notFound' | 'failed'
type TransactionResult<T = object> = Result<TransactionError, T>

const failure = failureFor<TransactionError>('transactions', {
  P0002: 'notFound',
})

const isKind = isOneOf(TRANSACTION_KINDS)
const isMode = isOneOf(SPLIT_MODES)

/** Every account, so an old transaction still shows its closed or hidden one. */
export const getFormAccounts = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<FormAccount>> => {
    const [data] = loaded(
      'Accounts',
      await getSupabase()
        .from('accounts')
        .select(
          'id, name, currency, closed_on, hidden_for_new, institutions(name)',
        ),
    )
    return data.map((a) => ({
      id: a.id,
      name: a.name,
      currency: a.currency,
      institution: a.institutions?.name ?? null,
      closedOn: a.closed_on,
      hiddenForNew: a.hidden_for_new,
    }))
  },
)

export const getFrequentCategories = createServerFn({ method: 'GET' }).handler(
  async (): Promise<FrequentCategories> => {
    const [data] = loaded(
      'Frequent categories',
      await getSupabase()
        .from('frequent_categories')
        .select('kind, category_id, rank')
        .order('rank'),
    )
    const frequent: FrequentCategories = { expense: [], income: [] }
    for (const row of data) {
      if (row.kind && isKind(row.kind) && row.category_id)
        frequent[row.kind].push(row.category_id)
    }
    return frequent
  },
)

/** An expense or income with its splits; null for anything else, such as a transfer. */
export const getTransaction = createServerFn({ method: 'GET' })
  .validator(idInput)
  .handler(async ({ data }): Promise<Transaction | null> => {
    const { data: row, error } = await getSupabase()
      .from('transactions')
      .select(
        'id, account_id, kind, occurred_on, amount::text, original_amount::text, original_currency, status, merchant_id, note, transfer_id, transaction_splits(category_id, input_mode, input_value::text, amount::text)',
      )
      .eq('id', data.id)
      .maybeSingle()
    if (error)
      throw new Error(`The transaction could not be loaded (${error.code})`)
    if (!row || !isKind(row.kind) || row.transfer_id) return null
    const splits = row.transaction_splits
    const mode = splits[0]?.input_mode ?? 'amount'
    return {
      id: row.id,
      accountId: row.account_id,
      kind: row.kind,
      occurredOn: row.occurred_on,
      amount: row.amount,
      originalAmount: row.original_amount,
      originalCurrency: row.original_currency,
      pending: row.status === 'pending',
      merchantId: row.merchant_id,
      note: row.note,
      splitMode: isMode(mode) ? mode : 'amount',
      // Splits keep no order of their own; largest first reads best.
      splits: [...splits]
        .sort((a, b) =>
          compareDecimal(absDecimal(b.amount), absDecimal(a.amount)),
        )
        .map((s) => ({ categoryId: s.category_id, value: s.input_value })),
    }
  })

/** One SQL function writes the transaction and its splits together (ADR-012). */
export const saveTransaction = createServerFn({ method: 'POST' })
  .validator(transactionInputSchema)
  .handler(async ({ data }): Promise<TransactionResult<{ id: string }>> => {
    const { data: id, error } = await getSupabase().rpc('save_transaction', {
      transaction_id: data.id ?? null,
      account_id: data.accountId,
      kind: data.kind,
      occurred_on: data.occurredOn,
      amount: data.amount,
      original_amount: data.originalAmount,
      original_currency: data.originalCurrency,
      status: data.pending ? 'pending' : 'cleared',
      merchant_id: data.merchantId,
      note: data.note,
      splits: data.splits.map((s) => ({
        category_id: s.categoryId,
        input_mode: data.splitMode,
        input_value: s.value,
      })),
    })
    if (error) return failure('save', error)
    return { ok: true, id }
  })

/** An expense or income; a transfer's parts are deleted together (spec 16). */
export const deleteTransaction = createServerFn({ method: 'POST' })
  .validator(idInput)
  .handler(async ({ data }): Promise<TransactionResult> => {
    const { data: deleted, error } = await getSupabase()
      .from('transactions')
      .delete()
      .eq('id', data.id)
      .is('transfer_id', null)
      .in('kind', [...TRANSACTION_KINDS])
      .select('id')
    if (error) return failure('delete', error)
    return deleted.length ? { ok: true } : { ok: false, error: 'notFound' }
  })
