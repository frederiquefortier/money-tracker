import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { isOneOf } from '#/lib/shared/collections'
import { KINDS } from '#/lib/categories/category'
import type { CategoryKind } from '#/lib/categories/category'
import { dailySpending } from '#/lib/dashboard/daily-spending'
import type { DaySpent } from '#/lib/dashboard/daily-spending'
import { yearSchema } from '#/lib/transactions/transaction-list'
import type { Dashboard } from '#/lib/dashboard/dashboard'
import type { EventTotal } from '#/lib/events/event-calendar'
import { todayIso } from '#/lib/shared/format'
import { allRows, loaded } from '#/lib/server/db.server'
import { getSupabase } from '#/lib/server/supabase.server'
import { getCategories } from '#/server/categories'
import { getEvents } from '#/server/events'

/**
 * Every month's figures per category and the categories. One round trip (ADR-053); the period is cut in the browser, so switching it
 * loads nothing.
 */
export const getDashboard = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Dashboard> => {
    const supabase = getSupabase()
    const [results, categories] = await Promise.all([
      Promise.all([
        supabase.from('profiles').select('display_currency').single(),
        // About 50 categories a month for years: far past one page (bugs.md).
        allRows((from, to) => supabase.rpc('my_monthly').range(from, to)),
      ]),
      getCategories(),
    ])
    const [profile, months] = loaded('Dashboard', ...results)
    const firstMonth = months.at(0)?.month.slice(0, 7)
    return {
      displayCurrency: profile.display_currency,
      firstYear: Number(firstMonth?.slice(0, 4) ?? todayIso().slice(0, 4)),
      months: months.map((m) => ({
        month: m.month.slice(0, 7),
        categoryId: m.category_id,
        amount: m.display_amount,
      })),
      categories,
    }
  },
)

const isKind = isOneOf<CategoryKind>(KINDS)

/**
 * The heat map's year: what I spent each day, from that year's lines only. Loaded when the
 * year is shown, since a day per line over the whole history is far more than the months.
 */
export const getDailySpending = createServerFn({ method: 'GET' })
  .validator(z.object({ year: yearSchema }))
  .handler(async ({ data }): Promise<Array<DaySpent>> => {
    const supabase = getSupabase()
    const [lines, categories] = loaded(
      'Daily spending',
      await allRows((from, to) =>
        supabase
          .rpc('my_lines', {
            from_date: `${data.year}-01-01`,
            to_date: `${data.year}-12-31`,
          })
          .range(from, to),
      ),
      await supabase.from('categories').select('id, kind'),
    )
    const kindOf = new Map(
      categories.flatMap((c) =>
        isKind(c.kind) ? [[c.id, c.kind] as const] : [],
      ),
    )
    return dailySpending(
      lines.map((l) => ({
        occurredOn: l.occurred_on,
        categoryId: l.category_id,
        amount: l.display_amount,
      })),
      kindOf,
    )
  })

/** EVT-04, EVT-05: the events, their types and each one's total over its whole history. */
export const getEventsOverview = createServerFn({ method: 'GET' }).handler(
  async () => {
    const [events, totals] = await Promise.all([
      getEvents(),
      getSupabase().rpc('event_totals'),
    ])
    const [rows] = loaded('Event totals', totals)
    return {
      events: events.events,
      types: events.types,
      totals: rows.map((r): EventTotal => ({
        eventId: r.event_id,
        total: r.display_total,
        transactionCount: r.transaction_count,
      })),
    }
  },
)
