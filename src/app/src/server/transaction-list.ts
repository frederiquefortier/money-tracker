import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { Database } from '#/lib/db/database'
import { loaded } from '#/lib/server/db.server'
import { getSupabase } from '#/lib/server/supabase.server'
import {
  LISTED_KINDS,
  NO_EVENT,
  groupByDay,
} from '#/lib/transactions/transaction-list'
import type {
  ListFilters,
  PageRow,
  TransactionPage,
} from '#/lib/transactions/transaction-list'
import { isOneOf } from '#/lib/shared/collections'

const isListedKind = isOneOf(LISTED_KINDS)

const listInput = z.object({
  from: z.iso.date().nullable(),
  to: z.iso.date().nullable(),
  accountIds: z.array(z.uuid()).max(100).optional(),
  categoryIds: z.array(z.uuid()).max(100).optional(),
  merchantIds: z.array(z.uuid()).max(100).optional(),
  personIds: z.array(z.uuid()).max(100).optional(),
  eventIds: z
    .array(z.union([z.uuid(), z.literal(NO_EVENT)]))
    .max(100)
    .optional(),
  search: z.string().trim().max(200).optional(),
  pendingOnly: z.boolean().optional(),
  owedOnly: z.boolean().optional(),
  before: z.iso.date().optional(),
})

const categoriesSchema = z.array(
  z.object({ name: z.string(), icon: z.string(), color: z.string() }),
)

const peopleSchema = z.array(
  z.object({
    name: z.string().nullable(),
    count: z.number().int(),
    role: z.enum(['invited', 'owes', 'from']),
    open: z.boolean(),
  }),
)

const reimbursesSchema = z.array(
  z.object({ label: z.string().nullable(), date: z.string() }),
)

const eventSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    color: z.string().nullable(),
    source: z.enum(['manual', 'auto']),
  })
  .nullable()

type ListRow =
  Database['public']['Functions']['list_transactions']['Returns'][number]

function toPageRow(r: ListRow): Array<PageRow> {
  if (!isListedKind(r.kind)) return []
  const categories = categoriesSchema.safeParse(r.categories)
  return [
    {
      row: {
        id: r.id,
        transferId: r.transfer_id,
        kind: r.kind,
        occurredOn: r.occurred_on,
        pending: r.pending,
        merchant: r.merchant,
        note: r.note,
        account: { name: r.account_name, institution: r.institution },
        transfer:
          r.from_account && r.to_account
            ? {
                from: { name: r.from_account, institution: r.from_institution },
                to: { name: r.to_account, institution: r.to_institution },
              }
            : null,
        categories: categories.success ? categories.data : [],
        people: peopleSchema.safeParse(r.people).data ?? [],
        reimburses: reimbursesSchema.safeParse(r.reimburses).data ?? [],
        event: eventSchema.safeParse(r.event).data ?? null,
        amount: r.amount,
        currency: r.currency,
        displayAmount: r.display_amount,
        rate: r.rate,
        fee: r.fee_amount
          ? { amount: r.fee_amount, category: r.fee_category }
          : null,
        arrival:
          r.received_amount && r.received_currency
            ? {
                amount: r.received_amount,
                currency: r.received_currency,
                value: r.received_value,
              }
            : null,
        conversionCost: r.conversion_cost,
      },
      dayNet: r.day_net,
    },
  ]
}

/**
 * Every row carries the counts; only the first page's are the whole list's (`first` is
 * undefined on later pages). Pending and owed count at any date, for their bubbles.
 */
function counts(first: ListRow | undefined | null) {
  if (first === undefined)
    return { total: null, pendingCount: null, owedCount: null }
  return {
    total: first?.total ?? 0,
    pendingCount: first?.pending_count ?? 0,
    owedCount: first?.owed_count ?? 0,
  }
}

const none = { data: [], error: null }

/** The filters in use with their names, for their chips (RLS hides another user's). */
async function filterNames(
  data: z.infer<typeof listInput>,
): Promise<ListFilters> {
  const supabase = getSupabase()
  const {
    accountIds = [],
    categoryIds = [],
    merchantIds = [],
    personIds = [],
    eventIds = [],
  } = data
  const named = eventIds.filter((id) => id !== NO_EVENT)
  const [accounts, categories, merchants, people, events] = loaded(
    'Filters',
    ...(await Promise.all([
      accountIds.length
        ? supabase
            .from('accounts')
            .select('id, name, institutions(name)')
            .in('id', accountIds)
        : none,
      categoryIds.length
        ? supabase
            .from('categories')
            .select('id, name, icon, color')
            .in('id', categoryIds)
        : none,
      merchantIds.length
        ? supabase.from('merchants').select('id, name').in('id', merchantIds)
        : none,
      personIds.length
        ? supabase.from('people').select('id, name').in('id', personIds)
        : none,
      named.length
        ? supabase.from('events').select('id, name').in('id', named)
        : none,
    ])),
  )
  return {
    accounts: accounts.map((a) => ({
      id: a.id,
      name: a.name,
      institution: a.institutions?.name ?? null,
    })),
    categories,
    merchants,
    people,
    events,
  }
}

/**
 * One page of the list: whole days of the period, newest first, narrowed by
 * the filters and the search (TRX-12), converted and netted in SQL. The first page also
 * names the filters in use.
 */
export const listTransactions = createServerFn({ method: 'GET' })
  .validator(listInput)
  .handler(
    async ({
      data,
    }): Promise<
      TransactionPage & {
        filters: ListFilters | null
        total: number | null
        pendingCount: number | null
        owedCount: number | null
      }
    > => {
      const [result, filters] = await Promise.all([
        getSupabase().rpc('list_transactions', {
          from_date: data.from ?? undefined,
          to_date: data.to ?? undefined,
          account_ids: data.accountIds,
          category_ids: data.categoryIds,
          merchant_ids: data.merchantIds,
          person_ids: data.personIds,
          event_ids: data.eventIds?.filter((id) => id !== NO_EVENT),
          without_event: data.eventIds?.includes(NO_EVENT),
          search: data.search || undefined,
          pending_only: data.pendingOnly,
          owed_only: data.owedOnly,
          before: data.before,
        }),
        data.before ? null : filterNames(data),
      ])
      const [rows] = loaded('Transactions', result)
      return {
        ...groupByDay(rows.flatMap(toPageRow), rows.at(0)?.more ?? false),
        filters,
        ...counts(data.before ? undefined : (rows.at(0) ?? null)),
      }
    },
  )
