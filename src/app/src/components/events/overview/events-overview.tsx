import { useCallback, useState } from 'react'
import { HideEvents } from '#/components/events/overview/hide-events'
import { EventHighlights } from '#/components/events/overview/event-highlights'
import { MonthTimeline } from '#/components/events/overview/month-timeline'
import { TypeComparison } from '#/components/events/overview/type-comparison'
import { EventDaysCard } from '#/components/events/overview/event-days-card'
import { useStoredIds } from '#/hooks/app/use-stored-state'
import type { YearState } from '#/hooks/dashboard/use-year-activity'
import type { Dashboard } from '#/lib/dashboard/dashboard'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import {
  activityNames,
  calendarDays,
  periodActivity,
} from '#/lib/dashboard/calendar-days'
import {
  eventSummaries,
  monthsOf,
  summariesIn,
  yearsOf,
} from '#/lib/events/event-calendar'
import type { EventsOverview as Overview } from '#/lib/events/event-calendar'
import { eventParts } from '#/lib/events/event-parts'
import type { DayRange } from '#/lib/shared/months'

/**
 * The year in review (EVT-04, EVT-05, YR-02..05; author, 2026-11-23): the days and events
 * at a glance beside the comparison, the highlights, then the calendar, the long part, last.
 */
export function EventsOverview({
  overview,
  dashboard,
  period,
  range,
  today,
  activity,
}: {
  overview: Overview
  dashboard: Dashboard
  period: DashboardPeriod
  range: DayRange
  today: string
  /** Each year of the range as it loads (useYearActivity). */
  activity: Record<string, YearState>
}) {
  const currency = dashboard.displayCurrency
  const summaries = eventSummaries(
    overview.events,
    overview.types,
    overview.totals,
  )
  const inRange = summariesIn(summaries, range)
  const loaded = periodActivity(yearsOf(range), activity, range.to)
  // A hidden event leaves the overview and the calendar (author, 2026-11-23).
  const hidden = useStoredIds('dashboard.hiddenEvents')
  const shown = inRange.filter((s) => !hidden.ids.has(s.event.id))
  const calendar = calendarDays(loaded, shown, range)
  const names = activityNames(
    dashboard.merchants,
    dashboard.categories,
    overview.people,
  )
  const months = monthsOf(range)
  // A month picked in the overview or the timeline, for the calendar to build up to and
  // scroll to: a new object each pick, so picking the same month again scrolls again.
  const [jump, setJump] = useState<{ month: string } | null>(null)
  const onJump = useCallback((month: string) => setJump({ month }), [])
  const shared = { period, today, calendar, currency, onJump }
  return (
    <>
      {/* Two halves from `xl`, as Argent's cards: the days beside the comparison. */}
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <EventDaysCard
          months={months}
          range={range}
          actions={
            <HideEvents
              summaries={summaries}
              types={overview.types}
              hidden={hidden}
            />
          }
          {...shared}
        />
        <TypeComparison
          summaries={summaries}
          types={overview.types}
          parts={eventParts(
            summaries,
            overview.categoryTotals,
            dashboard.categories,
          )}
          categories={dashboard.categories}
          period={period}
          currency={currency}
        />
      </div>
      <EventHighlights
        period={period}
        days={loaded.days}
        transactions={loaded.transactions}
        summaries={inRange}
        shownSummaries={shown}
        complete={loaded.complete}
        balances={overview.balances}
        names={names}
        currency={currency}
      />
      <MonthTimeline
        months={months}
        summaries={shown}
        names={names}
        jump={jump}
        {...shared}
      />
    </>
  )
}
