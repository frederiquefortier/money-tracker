import { useState } from 'react'
import { demoDashboard, demoDays } from '#/components/design/dashboard-demo'
import { GallerySection, Specimen } from '#/components/design/gallery-section'
import { MissingMonthsNotice } from '#/components/dashboard/missing-months-notice'
import { MoneyOverview } from '#/components/dashboard/money-overview'
import { PeriodControls } from '#/components/dashboard/period-controls'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { missingMonths } from '#/lib/dashboard/missing-months'
import { todayIso } from '#/lib/shared/format'

// Invented figures only (dashboard-demo.ts).
export function DashboardSection() {
  const today = todayIso()
  const [period, setPeriod] = useState<DashboardPeriod>({
    unit: 'year',
    year: today.slice(0, 4),
  })
  const dashboard = demoDashboard(today)
  return (
    <GallerySection id="dashboard" title="Dashboard">
      <Specimen
        name="MoneyOverview"
        source="components/dashboard/money-overview.tsx"
      >
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <PeriodControls
              period={period}
              firstYear={dashboard.firstYear}
              today={today}
              onChange={setPeriod}
            />
            <MissingMonthsNotice
              months={missingMonths(dashboard.months, period, {
                firstMonth: dashboard.months[0]?.month ?? today.slice(0, 7),
                today,
              })}
            />
          </div>
          <MoneyOverview
            dashboard={dashboard}
            period={period}
            today={today}
            daily={{ days: demoDays(period.year, today), failed: false }}
          />
        </div>
      </Specimen>
    </GallerySection>
  )
}
