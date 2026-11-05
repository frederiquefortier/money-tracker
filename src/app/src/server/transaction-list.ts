import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import type { Database } from '#/lib/database'
import { loaded } from '#/lib/db.server'
import { getSupabase } from '#/lib/supabase.server'
import { LISTED_KINDS, groupByDay } from '#/lib/transaction-list'
import type {
  ListFilters,
  PageRow,
  TransactionPage,
} from '#/lib/transaction-list'
import { isOneOf } from '#/lib/utils'

const isListedKind = isOneOf(LISTED_KINDS)

const listInput = z.object({
  from: z.iso.date().nullable(),
  to: z.iso.date().nullable(),
  accountIds: z.array(z.uuid()).max(100).optional(),
  categoryIds: z.array(z.uuid()).max(100).optional(),
  merchantIds: z.array(z.uuid()).max(100).optional(),
  search: z.string().trim().max(200).optional(),
  pendingOnly: z.boolean().optional(),
  before: z.iso.date().optional(),
})

const categoriesSchema = z.array(
  z.object({ name: z.string(), icon: z.string(), color: z.string() }),
)

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

const none = { data: [], error: null }

/** The filters in use with their names, for their chips (RLS hides another user's). */
async function filterNames(
  data: z.infer<typeof listInput>,
): Promise<ListFilters> {
  const supabase = getSupabase()
  const { accountIds = [], categoryIds = [], merchantIds = [] } = data
  const [accounts, categories, merchants] = loaded(
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
  }
}

/**
 * One page of the list (spec 14): whole days of the period, newest first, narrowed by
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
      }
    > => {
      const [result, filters] = await Promise.all([
        getSupabase().rpc('list_transactions', {
          from_date: data.from ?? undefined,
          to_date: data.to ?? undefined,
          account_ids: data.accountIds,
          category_ids: data.categoryIds,
          merchant_ids: data.merchantIds,
          search: data.search || undefined,
          pending_only: data.pendingOnly,
          before: data.before,
        }),
        data.before ? null : filterNames(data),
      ])
      const [rows] = loaded('Transactions', result)
      return {
        ...groupByDay(rows.flatMap(toPageRow), rows.at(0)?.more ?? false),
        filters,
        // Every row carries it; only the first page's counts the whole list.
        total: data.before ? null : (rows.at(0)?.total ?? 0),
        // Pending rows at any date, for the "En attente" bubble.
        pendingCount: data.before ? null : (rows.at(0)?.pending_count ?? 0),
      }
    },
  )
