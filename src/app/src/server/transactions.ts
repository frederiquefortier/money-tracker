import { createServerFn } from '@tanstack/react-start'
import { loaded } from '#/lib/server/db.server'
import { absDecimal, compareDecimal } from '#/lib/shared/money'
import { failureFor } from '#/lib/shared/result'
import type { Result } from '#/lib/shared/result'
import { idInput } from '#/lib/shared/validation'
import { getSupabase } from '#/lib/server/supabase.server'
import {
  PERSON_ROLES,
  SPLIT_MODES,
  TRANSACTION_KINDS,
  transactionInputSchema,
} from '#/lib/transactions/transaction'
import type {
  FormAccount,
  FrequentCategories,
  Transaction,
  TransactionError,
} from '#/lib/transactions/transaction'
import { isOneOf } from '#/lib/shared/collections'
import type { EventSource } from '#/lib/events/event'

type TransactionResult<T = object> = Result<TransactionError, T>

const failure = failureFor<TransactionError>('transactions', {
  P0002: 'notFound',
  holding_needs_investment_category: 'holdingInvalid',
  holding_closed: 'holdingInvalid',
})

const isKind = isOneOf(TRANSACTION_KINDS)
const isMode = isOneOf(SPLIT_MODES)
const isRole = isOneOf(PERSON_ROLES)
const isEventSource = isOneOf<EventSource>(['manual', 'auto'])

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

/** The people most often on transactions over the last 90 days, most first. */
export const getFrequentPeople = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<string>> => {
    const [data] = loaded(
      'Frequent people',
      await getSupabase()
        .from('person_usage')
        .select('person_id, recent_count, last_on')
        .gt('recent_count', 0)
        .order('recent_count', { ascending: false })
        .order('last_on', { ascending: false })
        .limit(8),
    )
    return data.flatMap((row) => (row.person_id ? [row.person_id] : []))
  },
)

/** An expense or income with its splits; null for anything else, such as a transfer. */
export const getTransaction = createServerFn({ method: 'GET' })
  .validator(idInput)
  .handler(async ({ data }): Promise<Transaction | null> => {
    const { data: row, error } = await getSupabase()
      .from('transactions')
      .select(
        'id, account_id, kind, occurred_on, amount::text, original_amount::text, original_currency, status, merchant_id, seller_person_id, holding_id, note, transfer_id, event_id, event_source, transaction_splits(category_id, input_mode, input_value::text, amount::text), transaction_people(id, position, role, person_id, head_count, input_mode, input_value::text, amount_unknown, fills_rest, back:reimbursements!reimbursements_user_id_owed_line_id_fkey(amount::text, income:transactions!reimbursements_user_id_income_id_fkey(occurred_on))), reimbursements!reimbursements_user_id_income_id_fkey(owed_line_id)',
      )
      .eq('id', data.id)
      .maybeSingle()
    if (error)
      throw new Error(`The transaction could not be loaded (${error.code})`)
    if (!row || !isKind(row.kind) || row.transfer_id) return null
    const splits = row.transaction_splits
    const mode = splits[0]?.input_mode ?? 'amount'
    const people = [...row.transaction_people].sort(
      (a, b) => a.position - b.position,
    )
    const peopleMode = people[0]?.input_mode ?? 'share'
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
      sellerId: row.seller_person_id,
      holdingId: row.holding_id,
      note: row.note,
      splitMode: isMode(mode) ? mode : 'amount',
      // Splits keep no order of their own; largest first reads best.
      splits: [...splits]
        .sort((a, b) =>
          compareDecimal(absDecimal(b.amount), absDecimal(a.amount)),
        )
        .map((s) => ({ categoryId: s.category_id, value: s.input_value })),
      peopleMode: isMode(peopleMode) ? peopleMode : 'share',
      people: people.flatMap((p) =>
        isRole(p.role)
          ? [
              {
                role: p.role,
                personId: p.person_id,
                headCount: p.head_count,
                value: p.input_value,
                amountUnknown: p.amount_unknown,
                fillsRest: p.fills_rest,
                back: p.back.map((r) => ({
                  amount: r.amount,
                  date: r.income.occurred_on,
                })),
              },
            ]
          : [],
      ),
      reimburses: row.reimbursements.map((r) => r.owed_line_id),
      eventId: row.event_id,
      eventSource: isEventSource(row.event_source) ? row.event_source : null,
    }
  })

/** One SQL function writes the transaction, its splits and people together (ADR-012). */
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
      seller_id: data.sellerId,
      holding_id: data.holdingId,
      note: data.note,
      splits: data.splits.map((s) => ({
        category_id: s.categoryId,
        input_mode: data.splitMode,
        input_value: s.value,
      })),
      people: data.people.map((p) => ({
        role: p.role,
        person_id: p.personId,
        head_count: p.headCount,
        input_mode: data.peopleMode,
        input_value: p.value,
        amount_unknown: p.amountUnknown,
        fills_rest: p.fillsRest,
      })),
      reimburses: data.kind === 'income' ? data.reimburses : undefined,
      event_id:
        data.eventChoice === 'manual' ? (data.eventId ?? undefined) : undefined,
      event_choice: data.eventChoice,
    })
    if (error) return failure('save', error)
    return { ok: true, id }
  })

/** An expense or income; a transfer's parts are deleted together. */
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
