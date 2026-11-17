import {
  Outlet,
  createFileRoute,
  retainSearchParams,
} from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FloatingAddLink } from '#/components/layout/floating-add-button'
import { EmptyState } from '#/components/lists/list-card'
import { ListPage } from '#/components/layout/list-page'
import { FilterSidebar } from '#/components/transactions/filters/filter-sidebar'
import { ListHeader } from '#/components/transactions/list/list-header'
import { TransactionDayGroup } from '#/components/transactions/list/transaction-day'
import { useTransactionPages } from '#/hooks/transactions/use-transaction-pages'
import { usePreloadForm } from '#/hooks/transactions/use-preload-form'
import { formatDate, formatMonth } from '#/lib/shared/format'
import {
  KEPT,
  listQuery,
  queryKey,
  searchSchema,
} from '#/lib/transactions/transaction-search'
import type { Query } from '#/lib/transactions/transaction-search'
import { useLocale } from '#/hooks/app/use-locale'
import { useMyCurrencies } from '#/hooks/currencies/use-my-currencies'
import { listTransactions } from '#/server/transaction-list'
import { getFeeCategory } from '#/server/transfers'
import type { FilterValues } from '#/lib/transactions/transaction-filters'
import type { PeriodChoice } from '#/lib/transactions/transaction-list'
import { Spinner } from '#/components/feedback/spinner'
import { PagePending } from '#/components/layout/page-pending'
import { useRevealed } from '#/hooks/app/use-revealed'

// The query the loader last asked for, in the browser only.
let requested: string | null = null

export const Route = createFileRoute('/_authed/transactions')({
  validateSearch: searchSchema,
  // The forms open over the list and close back to the same period, filters and search.
  search: { middlewares: [retainSearchParams([...KEPT])] },
  pendingComponent: PagePending,
  pendingMs: 0,
  pendingMinMs: 0,
  // No loaderDeps: a filter or a search would make a new match, which loads blocking (the
  // page, its search field included, gave way to the loading one). One match reloads in
  // the background instead, and the list says which query it shows.
  shouldReload: ({ location }) =>
    queryKey(listQuery(searchSchema.parse(location.search))) !== requested ||
    undefined,
  loader: async ({ location }) => {
    const query = listQuery(searchSchema.parse(location.search))
    if (typeof window !== 'undefined') requested = queryKey(query)
    const [page, feeCategory] = await Promise.all([
      listTransactions({ data: query }),
      getFeeCategory(),
    ])
    return { ...page, feeCategory, query }
  },
  component: Transactions,
})

function useEmptyText(deps: Query) {
  const { t } = useTranslation()
  const locale = useLocale()
  const { period } = deps
  const filtered =
    deps.kinds.length +
    deps.accountIds.length +
    deps.categoryIds.length +
    deps.merchantIds.length +
    deps.personIds.length +
    deps.eventIds.length
  if (deps.search || filtered || deps.pendingOnly || deps.owedOnly)
    return t('common.noMatch')
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
          pending: undefined,
          owed: undefined,
        }),
      }),
    pending: (on: boolean) =>
      void navigate({
        search: (prev) => ({ ...prev, pending: on || undefined }),
      }),
    owed: (on: boolean) =>
      void navigate({
        search: (prev) => ({ ...prev, owed: on || undefined }),
      }),
    filters: (f: FilterValues) =>
      void navigate({
        search: (prev) => ({
          ...prev,
          kind: f.kinds.length ? f.kinds : undefined,
          account: f.accountIds.length ? f.accountIds : undefined,
          category: f.categoryIds.length ? f.categoryIds : undefined,
          merchant: f.merchantIds.length ? f.merchantIds : undefined,
          person: f.personIds.length ? f.personIds : undefined,
          event: f.eventIds.length ? f.eventIds : undefined,
        }),
      }),
    search: (text: string) =>
      void navigate({
        replace: true,
        search: (prev) => ({ ...prev, q: text.trim() || undefined }),
      }),
  }
}

/** The marks at the list's end: the next days to build, then the next page to load. */
function OlderDays({
  revealed,
  pages,
}: {
  revealed: { more: boolean; sentinel: React.Ref<HTMLDivElement> }
  pages: {
    more: boolean
    loading: boolean
    sentinel: React.Ref<HTMLDivElement>
  }
}) {
  const { t } = useTranslation()
  if (revealed.more) return <div ref={revealed.sentinel} aria-hidden="true" />
  if (!pages.more) return null
  return (
    <div
      ref={pages.sentinel}
      className="py-4 text-center text-muted-foreground"
    >
      {pages.loading && (
        <Spinner label={t('common.loading')} className="mx-auto" />
      )}
    </div>
  )
}

function Transactions() {
  const { t } = useTranslation()
  // The loader's object itself: the pages hook knows a reload by its identity.
  const data = Route.useLoaderData()
  // What the list shows (the loader's query, which may trail the address).
  const deps = data.query
  const { displayCurrency } = useMyCurrencies()
  const go = useListNavigation()
  usePreloadForm()
  const { days, more, loading, sentinel } = useTransactionPages(data, deps)
  // Days are built as they near the screen; older pages load once all are shown.
  const revealed = useRevealed(days, 12)
  const [text, setText] = useSearchText(deps.search ?? '', go.search)
  const empty = useEmptyText(deps)

  return (
    // The net worth hub's grid (2026-11-17): the title at the far left, and from `lg` the
    // filters on 3 of 12 columns, staying in view as the list scrolls on 7, an empty
    // column on each side of it (author).
    <ListPage title={t('nav.transactions')} wide>
      <div className="grid items-start gap-3 lg:grid-cols-12">
        <FilterSidebar
          values={deps}
          names={data.filters}
          period={deps}
          onChange={go.filters}
          onPeriod={go.period}
          className="hidden lg:sticky lg:top-20 lg:col-span-3 lg:flex"
        />
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-7 lg:col-start-5">
          <ListHeader
            choice={deps}
            filters={deps}
            names={data.filters}
            pending={{ count: data.pendingCount, on: deps.pendingOnly }}
            owed={{ count: data.owedCount, on: deps.owedOnly }}
            search={text}
              onPeriod={go.period}
            onFilters={go.filters}
            onPending={go.pending}
            onOwed={go.owed}
            onSearch={setText}
          />
          <div className="mt-2 flex flex-col gap-4">
            {days.length === 0 ? (
              <EmptyState>{empty}</EmptyState>
            ) : (
              revealed.shown.map((day) => (
                <TransactionDayGroup
                  key={day.date}
                  day={day}
                  displayCurrency={displayCurrency}
                  filtered={deps.accountIds.length > 0}
                  feeCategory={data.feeCategory}
                />
              ))
            )}
            <OlderDays
              revealed={revealed}
              pages={{ more, loading, sentinel }}
            />
          </div>
          <FloatingAddLink
            to="/transactions/new"
            label={t('transactions.add')}
          />
          {/* The transaction forms open here as sheets. */}
          <Outlet />
        </div>
      </div>
    </ListPage>
  )
}
