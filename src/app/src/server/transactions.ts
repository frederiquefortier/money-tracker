import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { compareDecimal } from '#/lib/accounts'
import { currencyCodeSchema } from '#/lib/currencies'
import { failed } from '#/lib/result'
import type { Result } from '#/lib/result'
import { getSupabase } from '#/lib/supabase.server'
import {
  SPLIT_MODES,
  TRANSACTION_KINDS,
  transactionInputSchema,
} from '#/lib/transactions'
import type {
  FormAccount,
  SplitMode,
  Transaction,
  TransactionKind,
} from '#/lib/transactions'

export type TransactionError = 'notFound' | 'failed'
type TransactionResult<T = object> = Result<TransactionError, T>

/** Per kind, the ids of the categories used most lately, most used first (CAT-06). */
export type FrequentCategories = Record<TransactionKind, Array<string>>

function failure(
  context: string,
  error: { code?: string },
): { ok: false; error: TransactionError } {
  if (error.code === 'P0002') return { ok: false, error: 'notFound' }
  return failed('transactions', context, error.code)
}

const isKind = (kind: string): kind is TransactionKind =>
  (TRANSACTION_KINDS as ReadonlyArray<string>).includes(kind)
const isMode = (mode: string): mode is SplitMode =>
  (SPLIT_MODES as ReadonlyArray<string>).includes(mode)

/** Every account, so an old transaction still shows its closed or hidden one. */
export const getFormAccounts = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<FormAccount>> => {
    const { data, error } = await getSupabase()
      .from('accounts')
      .select(
        'id, name, currency, closed_on, hidden_for_new, institutions(name)',
      )
    if (error) throw new Error(`Accounts could not be loaded (${error.code})`)
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
    const { data, error } = await getSupabase()
      .from('frequent_categories')
      .select('kind, category_id, rank')
      .order('rank')
    if (error)
      throw new Error(`Frequent categories could not be loaded (${error.code})`)
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
  .validator(z.object({ id: z.uuid() }))
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
          compareDecimal(b.amount.replace('-', ''), a.amount.replace('-', '')),
        )
        .map((s) => ({ categoryId: s.category_id, value: s.input_value })),
    }
  })

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
  .validator(z.object({ id: z.uuid() }))
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
