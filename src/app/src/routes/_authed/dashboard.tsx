import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DashboardCard } from '#/components/dashboard/dashboard-card'
import { MissingMonthsNotice } from '#/components/dashboard/missing-months-notice'
import { MoneyOverview } from '#/components/dashboard/money-overview'
import { PeriodControls } from '#/components/dashboard/period-controls'
import { EventSummaryList } from '#/components/events/overview/event-summary-list'
import { PeriodCalendar } from '#/components/events/overview/period-calendar'
import { TypeComparison } from '#/components/events/overview/type-comparison'
import { ListPage } from '#/components/layout/list-page'
import { listPagePending } from '#/components/layout/page-pending'
import { TabList } from '#/components/lists/tab-list'
import { useStoredState } from '#/hooks/app/use-stored-state'
import { useDailySpending } from '#/hooks/dashboard/use-daily-spending'
import {
  dashboardSearchSchema,
  periodFromSearch,
  searchOfPeriod,
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
const PANEL_ID = 'dashboard-panel'

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
        <PeriodControls
          period={period}
          firstYear={dashboard.firstYear}
          today={today}
          onChange={(next) => void navigate({ search: searchOfPeriod(next) })}
        />
      }
    >
      <TabList
        label={t('dashboard.tabsLabel')}
        tabs={TABS}
        value={tab}
        labelOf={(value) => t(`dashboard.tabs.${value}`)}
        panelId={PANEL_ID}
        idPrefix="dashboard-tab"
        onSelect={setTab}
      />
      <div
        id={PANEL_ID}
        role="tabpanel"
        aria-labelledby={`dashboard-tab-${tab}`}
        className="flex flex-col gap-4"
      >
        {tab === 'money' ? (
          <MoneyTab period={period} today={today} />
        ) : (
          <EventsTab range={range} />
        )}
      </div>
    </ListPage>
  )
}
