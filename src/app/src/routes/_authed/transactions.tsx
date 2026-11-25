import {
  Outlet,
  createFileRoute,
  retainSearchParams,
} from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FloatingAddLink } from '#/components/layout/floating-add-button'
import { EmptyState } from '#/components/lists/list-card'
import { BackLink } from '#/components/layout/back-link'
import { ListPage } from '#/components/layout/list-page'
import { FilterSidebar } from '#/components/transactions/filters/filter-sidebar'
import { ListHeader } from '#/components/transactions/list/list-header'
import { TransactionDayGroup } from '#/components/transactions/list/transaction-day'
import { TransactionDaysSkeleton } from '#/components/transactions/list/transaction-skeleton'
import { useTransactionPages } from '#/hooks/transactions/use-transaction-pages'
import { usePreloadForm } from '#/hooks/transactions/use-preload-form'
import { useDraftSearch } from '#/hooks/transactions/use-draft-search'
import { useFilterNames } from '#/hooks/transactions/use-filter-options'
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
import { listPagePending } from '#/components/layout/page-pending'
import { useRevealed } from '#/hooks/app/use-revealed'
import { ListEnd } from '#/components/lists/list-end'

/** The list's column of the page's grid, its days loading. */
function TransactionsPending() {
  return (
    <div className="grid items-start gap-3 lg:grid-cols-12">
      <div className="min-w-0 lg:col-span-7 lg:col-start-5">
        <TransactionDaysSkeleton />
      </div>
    </div>
  )
}

// The query the loader last asked for, in the browser only.
let requested: string | null = null

export const Route = createFileRoute('/_authed/transactions')({
  validateSearch: searchSchema,
  // The forms open over the list and close back to the same period, filters and search.
  search: { middlewares: [retainSearchParams([...KEPT])] },
  ...listPagePending((t) => t('nav.transactions'), {
    wide: true,
    body: TransactionsPending,
  }),
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

/** Every change goes through the draft, so the page shows it before the list reloads. */
function useListNavigation() {
  const navigate = Route.useNavigate()
  const [shown, change] = useDraftSearch(
    Route.useSearch(),
    (search, replace) => void navigate({ search, replace }),
  )
  return {
    shown,
    period: (c: PeriodChoice) =>
      change((prev) => ({
        ...prev,
        period: c.period,
        month: c.period === 'month' ? c.month : undefined,
        year: c.period === 'year' ? c.year : undefined,
        start: c.period === 'custom' ? c.start : undefined,
        end: c.period === 'custom' ? c.end : undefined,
        pending: undefined,
        owed: undefined,
      })),
    pending: (on: boolean) =>
      change((prev) => ({ ...prev, pending: on || undefined })),
    owed: (on: boolean) =>
      change((prev) => ({ ...prev, owed: on || undefined })),
    filters: (f: FilterValues) =>
      change((prev) => ({
        ...prev,
        kind: f.kinds.length ? f.kinds : undefined,
        account: f.accountIds.length ? f.accountIds : undefined,
        category: f.categoryIds.length ? f.categoryIds : undefined,
        merchant: f.merchantIds.length ? f.merchantIds : undefined,
        person: f.personIds.length ? f.personIds : undefined,
        event: f.eventIds.length ? f.eventIds : undefined,
      })),
    // The field already waited for typing to pause.
    search: (text: string) =>
      change((prev) => ({ ...prev, q: text.trim() || undefined }), {
        replace: true,
        now: true,
      }),
  }
}

/** The marks at the list's end: the next days to build, then the next page to load. */
function OlderDays({
  revealed,
  pages,
}: {
  revealed: { more: boolean; sentinel: (el: HTMLElement | null) => void }
  pages: { more: boolean; sentinel: (el: HTMLElement | null) => void }
}) {
  const day = <TransactionDaysSkeleton days={1} />
  if (revealed.more)
    return <ListEnd sentinel={revealed.sentinel} placeholder={day} />
  if (pages.more) return <ListEnd sentinel={pages.sentinel} placeholder={day} />
  return null
}

/** Opened from a dashboard figure: back to the dashboard on its period (author, 2026-11-20). */
function DashboardBack() {
  const { t } = useTranslation()
  const { dashboard } = Route.useSearch()
  if (!dashboard) return null
  return (
    <BackLink
      label={t('nav.dashboard')}
      to="/dashboard"
      search={dashboard === 'all' ? {} : { year: dashboard }}
    />
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
  // What the filters, chips and tabs show: the latest choice, which the list may trail.
  const shown = listQuery(go.shown)
  const names = useFilterNames(data.filters)
  usePreloadForm()
  const { days, more, sentinel } = useTransactionPages(data, deps)
  // A filter, period or search the list does not show yet: the reload runs in the
  // background, and the list gives way to its skeleton (the sheet may already be closed).
  const waiting = queryKey(shown) !== queryKey(deps)
  // Days are built as they near the screen; older pages load once all are shown.
  const revealed = useRevealed(days, 12)
  const [text, setText] = useSearchText(shown.search ?? '', go.search)
  const empty = useEmptyText(deps)

  return (
    // The net worth hub's grid (2026-11-17): the title at the far left, and from `lg` the
    // filters on 3 of 12 columns, staying in view as the list scrolls on 7, an empty
    // column on each side of it (author).
    <ListPage
      title={t('nav.transactions')}
      count={data.total}
      back={<DashboardBack />}
      wide
    >
      <div className="grid items-start gap-3 lg:grid-cols-12">
        <FilterSidebar
          values={shown}
          names={names}
          period={shown}
          onChange={go.filters}
          onPeriod={go.period}
          className="hidden lg:sticky lg:top-20 lg:col-span-3 lg:flex"
        />
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-7 lg:col-start-5">
          <ListHeader
            choice={shown}
            filters={shown}
            names={names}
            pending={{ count: data.pendingCount, on: shown.pendingOnly }}
            owed={{ count: data.owedCount, on: shown.owedOnly }}
            search={text}
            onPeriod={go.period}
            onFilters={go.filters}
            onPending={go.pending}
            onOwed={go.owed}
            onSearch={setText}
          />
          {waiting ? (
            <TransactionDaysSkeleton />
          ) : (
            <div className="flex flex-col gap-4">
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
              <OlderDays revealed={revealed} pages={{ more, sentinel }} />
            </div>
          )}
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
