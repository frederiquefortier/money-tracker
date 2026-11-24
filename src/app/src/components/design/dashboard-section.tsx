import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { demoDashboard, demoDays } from '#/components/design/dashboard-demo'
import {
  demoActivity,
  demoEventsOverview,
} from '#/components/design/events-demo'
import { GallerySection, Specimen } from '#/components/design/gallery-section'
import { EventsOverview } from '#/components/events/overview/events-overview'
import { yearsOf } from '#/lib/events/event-calendar'
import { MissingMonthsNotice } from '#/components/dashboard/missing-months-notice'
import { MoneyOverview } from '#/components/dashboard/money-overview'
import { PeriodMenu } from '#/components/dashboard/period-menu'
import { IconToggle } from '#/components/display/icon-toggle'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { dayRangeOf } from '#/lib/dashboard/dashboard-period'
import { missingMonths } from '#/lib/dashboard/missing-months'
import { todayIso } from '#/lib/shared/format'

// Invented figures only (dashboard-demo.ts).
export function DashboardSection() {
  const { t } = useTranslation()
  const today = todayIso()
  const [period, setPeriod] = useState<DashboardPeriod>({
    unit: 'year',
    year: today.slice(0, 4),
  })
  const [tab, setTab] = useState<'money' | 'events'>('money')
  const dashboard = demoDashboard(today)
  const range = dayRangeOf(
    period,
    dashboard.months[0]?.month ?? today.slice(0, 7),
    today,
  )
  return (
    <GallerySection id="dashboard" title="Dashboard">
      <Specimen
        name="MoneyOverview"
        source="components/dashboard/money-overview.tsx"
      >
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <MissingMonthsNotice
              months={missingMonths(dashboard.months, period, {
                firstMonth: dashboard.months[0]?.month ?? today.slice(0, 7),
                today,
              })}
            />
            <span className="flex-1" />
            <PeriodMenu
              period={period}
              firstYear={dashboard.firstYear}
              today={today}
              onChange={setPeriod}
            />
            <IconToggle
              label={t('dashboard.tabsLabel')}
              value={tab}
              options={[
                {
                  value: 'money',
                  icon: 'coins',
                  label: t('dashboard.tabs.money'),
                },
                {
                  value: 'events',
                  icon: 'calendar',
                  label: t('dashboard.tabs.events'),
                },
              ]}
              onChange={setTab}
            />
          </div>
          {tab === 'money' ? (
            <MoneyOverview
              dashboard={dashboard}
              period={period}
              today={today}
              daily={{ days: demoDays(period.year, today), failed: false }}
            />
          ) : (
            <EventsOverview
              overview={demoEventsOverview(today)}
              dashboard={dashboard}
              period={period}
              range={range}
              today={today}
              activity={Object.fromEntries(
                yearsOf(range).map((y) => [y, demoActivity(y, today)]),
              )}
            />
          )}
        </div>
      </Specimen>
    </GallerySection>
  )
}
