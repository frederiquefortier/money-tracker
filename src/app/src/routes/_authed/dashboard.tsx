import { createFileRoute, redirect } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DashboardCard } from '#/components/dashboard/dashboard-card'
import { MissingMonthsNotice } from '#/components/dashboard/missing-months-notice'
import { MoneyOverview } from '#/components/dashboard/money-overview'
import { PeriodMenu } from '#/components/dashboard/period-menu'
import { IconToggle } from '#/components/display/icon-toggle'
import { EventSummaryList } from '#/components/events/overview/event-summary-list'
import { PeriodCalendar } from '#/components/events/overview/period-calendar'
import { TypeComparison } from '#/components/events/overview/type-comparison'
import { ListPage } from '#/components/layout/list-page'
import { listPagePending } from '#/components/layout/page-pending'
import { useStoredState } from '#/hooks/app/use-stored-state'
import { useDailySpending } from '#/hooks/dashboard/use-daily-spending'
import {
  dashboardSearchSchema,
  periodFromSearch,
  searchOfPeriod,
  storeSearch,
  storedSearch,
} from '#/lib/dashboard/dashboard-period'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { missingMonths } from '#/lib/dashboard/missing-months'
import type { DayRange } from '#/lib/shared/months'
import { eventSummaries, summariesIn } from '#/lib/events/event-calendar'
import { oneOf } from '#/lib/shared/collections'
import { todayIso } from '#/lib/shared/format'
import { getDashboard, getEventsOverview } from '#/server/dashboard'

// One page for the spreadsheet's dashboard (DSH) and the events (EVT-04, 05), the yearly
// review's social view to come as a third tab (spec 22).
export const Route = createFileRoute('/_authed/dashboard')({
  ...listPagePending((t) => t('nav.dashboard'), { wide: true }),
  validateSearch: dashboardSearchSchema,
  // Coming back from another page (the nav has no year) opens the period last picked. In
  // the browser only: the server has no storage, and a reload keeps the year in the URL.
  beforeLoad: ({ search }) => {
    if (typeof window === 'undefined' || search.year) return
    const stored = storedSearch()
    if (stored?.year)
      throw redirect({ to: '/dashboard', search: stored, replace: true })
  },
  // The whole history loads once; the period is cut in the browser.
  loader: async () => {
    const [dashboard, events] = await Promise.all([
      getDashboard(),
      getEventsOverview(),
    ])
    return { dashboard, events }
  },
  component: DashboardPage,
})

const TABS = ['money', 'events'] as const
type Tab = (typeof TABS)[number]
const parseTab = oneOf(TABS)
const TAB_ICONS = { money: 'coins', events: 'calendar' } as const

function MoneyTab({
  period,
  today,
}: {
  period: DashboardPeriod
  today: string
}) {
  const { dashboard } = Route.useLoaderData()
  const daily = useDailySpending(period.unit === 'year' ? period.year : null)
  return (
    <MoneyOverview
      dashboard={dashboard}
      period={period}
      today={today}
      daily={daily}
    />
  )
}

function EventsTab({ range }: { range: DayRange }) {
  const { t } = useTranslation()
  const { dashboard, events } = Route.useLoaderData()
  const summaries = eventSummaries(events.events, events.types, events.totals)
  const inRange = summariesIn(summaries, range)
  const currency = dashboard.displayCurrency
  return (
    <>
      <DashboardCard title={t('dashboard.events.calendar')}>
        <PeriodCalendar summaries={inRange} range={range} />
      </DashboardCard>
      <EventSummaryList summaries={inRange} currency={currency} />
      <TypeComparison
        summaries={summaries}
        types={events.types}
        currency={currency}
      />
    </>
  )
}

function DashboardPage() {
  const { t } = useTranslation()
  const { dashboard } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const today = todayIso()
  const period = periodFromSearch(search, today)
  const range: DayRange =
    period.unit === 'year'
      ? { from: `${period.year}-01-01`, to: `${period.year}-12-31` }
      : { from: `${dashboard.firstYear}-01-01`, to: today }
  const [tab, setTab] = useStoredState<Tab>('dashboard.tab', 'money', parseTab)
  return (
    <ListPage
      title={t('nav.dashboard')}
      titleNote={
        <MissingMonthsNotice
          months={missingMonths(dashboard.months, period, {
            firstMonth: dashboard.months[0]?.month ?? today.slice(0, 7),
            today,
          })}
        />
      }
      wide
      actions={
        <>
          <PeriodMenu
            period={period}
            firstYear={dashboard.firstYear}
            today={today}
            onChange={(next) => {
              storeSearch(searchOfPeriod(next))
              void navigate({ search: searchOfPeriod(next) })
            }}
          />
          <IconToggle
            label={t('dashboard.tabsLabel')}
            value={tab}
            options={TABS.map((value) => ({
              value,
              icon: TAB_ICONS[value],
              label: t(`dashboard.tabs.${value}`),
            }))}
            onChange={setTab}
          />
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {tab === 'money' ? (
          <MoneyTab period={period} today={today} />
        ) : (
          <EventsTab range={range} />
        )}
      </div>
    </ListPage>
  )
}
