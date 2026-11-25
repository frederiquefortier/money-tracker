import { createFileRoute, redirect } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DashboardSkeleton } from '#/components/dashboard/dashboard-skeleton'
import { MissingMonthsNotice } from '#/components/dashboard/missing-months-notice'
import { MoneyOverview } from '#/components/dashboard/money-overview'
import { PeriodMenu } from '#/components/dashboard/period-menu'
import { ListPage } from '#/components/layout/list-page'
import { listPagePending } from '#/components/layout/page-pending'
import { useYearActivity } from '#/hooks/dashboard/use-year-activity'
import {
  dashboardSearchSchema,
  periodFromSearch,
  searchOfPeriod,
  storeSearch,
  storedSearch,
} from '#/lib/dashboard/dashboard-period'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { missingMonths } from '#/lib/dashboard/missing-months'
import { todayIso } from '#/lib/shared/format'
import { getDashboard } from '#/server/dashboard'

// The spreadsheet's dashboard (DSH, spec 22). The year in review (EVT-04, 05, YR-02..05)
// waits in improvements.md.
export const Route = createFileRoute('/_authed/dashboard')({
  ...listPagePending((t) => t('nav.dashboard'), {
    wide: true,
    body: DashboardSkeleton,
  }),
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
  loader: async () => ({ dashboard: await getDashboard() }),
  component: DashboardPage,
})

function MoneyTab({
  period,
  today,
}: {
  period: DashboardPeriod
  today: string
}) {
  const { dashboard } = Route.useLoaderData()
  const activity = useYearActivity(period.unit === 'year' ? period.year : null)
  const daily = {
    days: activity.data?.days ?? null,
    failed: activity.isError,
  }
  return (
    <MoneyOverview
      dashboard={dashboard}
      period={period}
      today={today}
      daily={daily}
    />
  )
}

function DashboardPage() {
  const { t } = useTranslation()
  const { dashboard } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const today = todayIso()
  const period = periodFromSearch(search, today)
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
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <MoneyTab period={period} today={today} />
      </div>
    </ListPage>
  )
}
