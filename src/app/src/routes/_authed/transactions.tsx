import {
  Outlet,
  createFileRoute,
  retainSearchParams,
  useRouterState,
} from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { FloatingAddLink } from '#/components/floating-add-button'
import { EmptyState } from '#/components/list-card'
import type { FilterValues } from '#/components/transactions/filter-sheet'
import { ListHeader } from '#/components/transactions/list-header'
import type { PeriodChoice } from '#/components/transactions/period-controls'
import { TransactionDayGroup } from '#/components/transactions/transaction-day'
import { useTransactionPages } from '#/components/transactions/use-transaction-pages'
import { formatDate, formatMonth, todayIso } from '#/lib/format'
import {
  PERIODS,
  lastThirtyDays,
  monthOf,
  monthSchema,
  periodRange,
  yearSchema,
} from '#/lib/transaction-list'
import { useLocale } from '#/lib/use-locale'
import { useMyCurrencies } from '#/lib/use-my-currencies'
import { listTransactions } from '#/server/transactions'

const KEPT = [
  'period',
  'month',
  'year',
  'start',
  'end',
  'account',
  'category',
  'merchant',
  'q',
] as const

const ids = z.array(z.uuid()).max(100).optional().catch(undefined)

export const Route = createFileRoute('/_authed/transactions')({
  validateSearch: z.object({
    period: z.enum(PERIODS).optional().catch(undefined),
    month: monthSchema.optional().catch(undefined),
    year: yearSchema.optional().catch(undefined),
    start: z.iso.date().optional().catch(undefined),
    end: z.iso.date().optional().catch(undefined),
    account: ids,
    category: ids,
    merchant: ids,
    q: z.string().max(200).optional().catch(undefined),
  }),
  // The forms open over the list and close back to the same period, filters and search.
  search: { middlewares: [retainSearchParams([...KEPT])] },
  loaderDeps: ({ search }) => {
    const today = todayIso()
    const month = search.month ?? monthOf(today)
    const year = search.year ?? month.slice(0, 4)
    const recent = lastThirtyDays(today)
    const start = search.start ?? recent.start
    const end = search.end ?? recent.end
    const period = search.period ?? 'all'
    return {
      period,
      month,
      year,
      start,
      end,
      accountIds: search.account ?? [],
      categoryIds: search.category ?? [],
      merchantIds: search.merchant ?? [],
      search: search.q?.trim() || undefined,
      ...periodRange(period, { month, year, start, end }),
    }
  },
  loader: ({ deps }) => listTransactions({ data: deps }),
  component: Transactions,
})

function useEmptyText() {
  const { t } = useTranslation()
  const locale = useLocale()
  const deps = Route.useLoaderDeps()
  const { period } = deps
  const filtered =
    deps.accountIds.length + deps.categoryIds.length + deps.merchantIds.length
  if (deps.search || filtered) return t('common.noMatch')
  if (period === 'month')
    return t('transactions.list.empty.month', {
      period: formatMonth(deps.month, locale),
    })
  if (period === 'year')
    return t('transactions.list.empty.year', { period: deps.year })
  if (period === 'custom')
    return t('transactions.list.empty.custom', {
      start: formatDate(deps.start, locale, 'medium'),
      end: formatDate(deps.end, locale, 'medium'),
    })
  return t('transactions.list.empty.all')
}

/** The search as typed, sent to the address once typing pauses. */
function useSearchText(sent: string, send: (text: string) => void) {
  const [text, setText] = useState(sent)
  const latest = useRef(send)
  latest.current = send
  useEffect(() => {
    if (text.trim() === sent) return
    const timer = setTimeout(() => latest.current(text), 300)
    return () => clearTimeout(timer)
  }, [text, sent])
  return [text, setText] as const
}

function useListNavigation() {
  const navigate = Route.useNavigate()
  return {
    period: (c: PeriodChoice) =>
      void navigate({
        search: (prev) => ({
          ...prev,
          period: c.period,
          month: c.period === 'month' ? c.month : undefined,
          year: c.period === 'year' ? c.year : undefined,
          start: c.period === 'custom' ? c.start : undefined,
          end: c.period === 'custom' ? c.end : undefined,
        }),
      }),
    filters: (f: FilterValues) =>
      void navigate({
        search: (prev) => ({
          ...prev,
          account: f.accountIds.length ? f.accountIds : undefined,
          category: f.categoryIds.length ? f.categoryIds : undefined,
          merchant: f.merchantIds.length ? f.merchantIds : undefined,
        }),
      }),
    search: (text: string) =>
      void navigate({
        replace: true,
        search: (prev) => ({ ...prev, q: text.trim() || undefined }),
      }),
  }
}

function Transactions() {
  const { t } = useTranslation()
  const deps = Route.useLoaderDeps()
  // The loader's object itself: the pages hook knows a reload by its identity.
  const data = Route.useLoaderData()
  const { displayCurrency } = useMyCurrencies()
  const go = useListNavigation()
  const switching = useRouterState({ select: (s) => s.isLoading })
  const { days, more, loading, sentinel } = useTransactionPages(data, deps)
  const [text, setText] = useSearchText(deps.search ?? '', go.search)
  const empty = useEmptyText()

  return (
    <div className="mx-auto flex w-full max-w-[48rem] flex-col gap-4 pb-20">
      <ListHeader
        choice={deps}
        filters={deps}
        names={data.filters}
        total={data.total}
        search={text}
        loading={switching}
        onPeriod={go.period}
        onFilters={go.filters}
        onSearch={setText}
      />
      <div className="mt-2 flex flex-col gap-4">
        {days.length === 0 ? (
          <EmptyState>{empty}</EmptyState>
        ) : (
          days.map((day) => (
            <TransactionDayGroup
              key={day.date}
              day={day}
              displayCurrency={displayCurrency}
              filtered={deps.accountIds.length > 0}
            />
          ))
        )}
        {more && (
          <div
            ref={sentinel}
            className="py-4 text-center text-muted-foreground"
          >
            {loading && t('common.loading')}
          </div>
        )}
      </div>
      <FloatingAddLink to="/transactions/new" label={t('transactions.add')} />
      {/* The transaction forms open here as sheets (spec 15). */}
      <Outlet />
    </div>
  )
}
