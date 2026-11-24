import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MonthChips, MonthRail } from '#/components/events/overview/month-rail'
import { MonthSection } from '#/components/events/overview/month-section'
import { ListEnd } from '#/components/lists/list-end'
import { useRevealed } from '#/hooks/app/use-revealed'
import { useActiveMonth } from '#/hooks/dashboard/use-active-month'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { monthTotals } from '#/lib/dashboard/calendar-days'
import type { ActivityNames, CalendarDays } from '#/lib/dashboard/calendar-days'
import type { EventSummary } from '#/lib/events/event-calendar'

/**
 * EVT-04, YR-02: the period's months as a sticky list beside the calendar (a row of chips
 * below `lg`), the month on screen marked, a click scrolling to it. Months are built as
 * they near the screen, so Tout over many years stays fast (author, 2026-11-23).
 */
export function MonthTimeline({
  months,
  summaries,
  jump,
  onJump,
  ...days
}: {
  months: ReadonlyArray<string>
  period: DashboardPeriod
  today: string
  calendar: CalendarDays
  summaries: ReadonlyArray<EventSummary>
  names: ActivityNames
  currency: string
  /** The month last picked, here or in the overview; a new object each pick. */
  jump: { month: string } | null
  onJump: (month: string) => void
}) {
  const { t } = useTranslation()
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  // A month picked further down is built, with every month before it, before scrolling.
  const target = jump ? months.indexOf(jump.month) + 1 : 0
  const { shown, more, sentinel } = useRevealed(months, 2, target)
  const active = useActiveMonth(container, shown.length) ?? months.at(0) ?? null
  const handled = useRef<object | null>(null)
  useEffect(() => {
    if (!jump || handled.current === jump) return
    handled.current = jump
    document
      .getElementById(`month-${jump.month}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [jump, shown.length])
  const totals = monthTotals(days.calendar.spent)
  const rail = { months, period: days.period, active, onJump }
  return (
    <section
      className="flex flex-col gap-3"
      aria-label={t('dashboard.events.calendar')}
    >
      <h2 className="font-semibold">{t('dashboard.events.calendar')}</h2>
      <div className="flex gap-6">
        <MonthRail
          {...rail}
          summaries={summaries}
          totals={totals}
          currency={days.currency}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <MonthChips {...rail} />
          <div ref={setContainer} className="flex flex-col gap-10">
            {shown.map((month) => (
              <MonthSection
                key={month}
                month={month}
                spent={totals.get(month)}
                summaries={summaries}
                {...days}
              />
            ))}
            {more && <ListEnd sentinel={sentinel} />}
          </div>
        </div>
      </div>
    </section>
  )
}
