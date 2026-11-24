import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { isOneOf } from '#/lib/shared/collections'
import { KINDS } from '#/lib/categories/category'
import type { CategoryKind } from '#/lib/categories/category'
import { yearActivity } from '#/lib/dashboard/year-activity'
import type { YearActivity } from '#/lib/dashboard/year-activity'
import { yearSchema } from '#/lib/transactions/transaction-list'
import type { Dashboard } from '#/lib/dashboard/dashboard'
import type { EventTotal, EventsOverview } from '#/lib/events/event-calendar'
import { todayIso } from '#/lib/shared/format'
import { allRows, loaded } from '#/lib/server/db.server'
import { getSupabase } from '#/lib/server/supabase.server'
import { getCategories } from '#/server/categories'
import { getEvents } from '#/server/events'
import { getBalances } from '#/server/owed'

/**
 * Every month's figures per category and the categories, and each merchant's bills per
 * month (MER-04). One round trip (ADR-053); the period is cut in the browser, so switching it
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
        allRows((from, to) => supabase.rpc('merchant_monthly').range(from, to)),
        supabase.from('merchants').select('id, name'),
      ]),
      getCategories(),
    ])
    const [profile, months, bills, merchants] = loaded('Dashboard', ...results)
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
      merchantMonths: bills.map((b) => ({
        month: b.month.slice(0, 7),
        merchantId: b.merchant_id,
        visits: b.visits,
        total: b.display_total,
        min: b.display_min,
        max: b.display_max,
      })),
      merchants,
    }
  },
)

const isKind = isOneOf<CategoryKind>(KINDS)

/**
 * A year's days and transactions at my share, for the heat maps, the events calendar and
 * the highlights (ADR-066). Loaded when the year is shown: a row per line over the whole
 * history is far more than the months.
 */
export const getYearActivity = createServerFn({ method: 'GET' })
  .validator(z.object({ year: yearSchema }))
  .handler(async ({ data }): Promise<YearActivity> => {
    const supabase = getSupabase()
    const from = `${data.year}-01-01`
    const to = `${data.year}-12-31`
    const [lines, categories, details] = loaded(
      'Year activity',
      ...(await Promise.all([
        allRows((start, end) =>
          supabase
            .rpc('my_lines', { from_date: from, to_date: to })
            .range(start, end),
        ),
        supabase.from('categories').select('id, kind'),
        allRows((start, end) =>
          supabase
            .from('transactions')
            .select(
              'id, merchant_id, seller_person_id, transaction_people(person_id)',
            )
            .in('kind', ['expense', 'income'])
            .gte('occurred_on', from)
            .lte('occurred_on', to)
            .order('id')
            .range(start, end),
        ),
      ])),
    )
    const kindOf = new Map(
      categories.flatMap((c) =>
        isKind(c.kind) ? [[c.id, c.kind] as const] : [],
      ),
    )
    return yearActivity(
      lines.map((l) => ({
        transactionId: l.transaction_id,
        occurredOn: l.occurred_on,
        kind: l.kind,
        categoryId: l.category_id,
        eventId: l.event_id,
        amount: l.display_amount,
      })),
      details.map((d) => ({
        id: d.id,
        merchantId: d.merchant_id,
        // Everyone on it, whatever their role, the seller included (author, 2026-11-23).
        personIds: [
          ...new Set([
            ...d.transaction_people.flatMap((p) =>
              p.person_id ? [p.person_id] : [],
            ),
            ...(d.seller_person_id ? [d.seller_person_id] : []),
          ]),
        ],
      })),
      kindOf,
    )
  })

/**
 * EVT-04, EVT-05, YR-04, YR-05: the events, their types, each one's total over its whole
 * history and per category, the people's names and what each still owes me.
 */
export const getEventsOverview = createServerFn({ method: 'GET' }).handler(
  async (): Promise<EventsOverview> => {
    const supabase = getSupabase()
    const [events, totals, categoryTotals, people, balances] =
      await Promise.all([
        getEvents(),
        supabase.rpc('event_totals'),
        supabase.rpc('event_category_totals'),
        supabase.from('people').select('id, name'),
        getBalances(),
      ])
    const [rows, parts, names] = loaded(
      'Events overview',
      totals,
      categoryTotals,
      people,
    )
    return {
      events: events.events,
      types: events.types,
      totals: rows.map((r): EventTotal => ({
        eventId: r.event_id,
        total: r.display_total,
        transactionCount: r.transaction_count,
      })),
      categoryTotals: parts.map((r) => ({
        eventId: r.event_id,
        categoryId: r.category_id,
        total: r.display_total,
      })),
      people: names,
      balances,
    }
  },
)
