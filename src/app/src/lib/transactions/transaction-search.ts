import { z } from 'zod'
import { todayIso } from '#/lib/shared/format'
import { monthOf } from '#/lib/shared/months'
import { FILTER_KINDS, idFilters } from '#/lib/transactions/transaction-filters'
import {
  NO_EVENT,
  PERIOD_UNITS,
  lastThirtyDays,
  monthSchema,
  periodRange,
  yearSchema,
} from '#/lib/transactions/transaction-list'

// The transactions list's address: what it keeps, and the query it asks for.

export const KEPT = [
  'period',
  'month',
  'year',
  'start',
  'end',
  'kind',
  'account',
  'category',
  'merchant',
  'person',
  'event',
  'q',
  'pending',
  'owed',
] as const

const ids = z.array(z.uuid()).max(100).optional().catch(undefined)
// Ids, or the one choice of "none" (no event, no holding).
const orNone = (none: string) =>
  z
    .array(z.union([z.uuid(), z.literal(none)]))
    .max(100)
    .optional()
    .catch(undefined)

export const searchSchema = z.object({
  period: z.enum(PERIOD_UNITS).optional().catch(undefined),
  month: monthSchema.optional().catch(undefined),
  year: yearSchema.optional().catch(undefined),
  start: z.iso.date().optional().catch(undefined),
  end: z.iso.date().optional().catch(undefined),
  kind: z.array(z.enum(FILTER_KINDS)).max(3).optional().catch(undefined),
  account: ids,
  category: ids,
  merchant: ids,
  person: ids,
  event: orNone(NO_EVENT),
  q: z.string().max(200).optional().catch(undefined),
  pending: z.boolean().optional().catch(undefined),
  owed: z.boolean().optional().catch(undefined),
})

/** What the list asks for, from the address. */
export function listQuery(search: z.infer<typeof searchSchema>) {
  const today = todayIso()
  const month = search.month ?? monthOf(today)
  const year = search.year ?? month.slice(0, 4)
  const recent = lastThirtyDays(today)
  const start = search.start ?? recent.start
  const end = search.end ?? recent.end
  const period = search.period ?? 'all'
  const pendingOnly = search.pending === true
  const owedOnly = search.owed === true
  return {
    period,
    month,
    year,
    start,
    end,
    ...idFilters(search),
    search: search.q?.trim() || undefined,
    pendingOnly,
    owedOnly,
    // What is pending or owed shows at any date, as its bubble counts.
    ...(pendingOnly || owedOnly
      ? { from: null, to: null }
      : periodRange(period, { month, year, start, end })),
  }
}

export type Query = ReturnType<typeof listQuery>
export const queryKey = (query: Query) => JSON.stringify(query)
