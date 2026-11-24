import { useTranslation } from 'react-i18next'
import { Figure } from '#/components/dashboard/dashboard-card'
import { MonthAgenda } from '#/components/events/overview/month-agenda'
import { MonthGrid } from '#/components/events/overview/month-grid'
import { useLocale } from '#/hooks/app/use-locale'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import type { ActivityNames, CalendarDays } from '#/lib/dashboard/calendar-days'
import { eventsInMonth } from '#/lib/events/event-calendar'
import type { EventSummary } from '#/lib/events/event-calendar'
import { formatMonth } from '#/lib/shared/format'
import { cn } from '#/lib/utils'

/**
 * One month of the calendar, at least the screen's height from `lg`: its name and spending,
 * then its days as a grid (a list below `lg`).
 */
export function MonthSection({
  month,
  spent,
  summaries,
  ...days
}: {
  month: string
  spent: string | null | undefined
  summaries: ReadonlyArray<EventSummary>
  period: DashboardPeriod
  today: string
  calendar: CalendarDays
  names: ActivityNames
  currency: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const year = month.slice(0, 4)
  const events = eventsInMonth(summaries, month)
  return (
    <section
      id={`month-${month}`}
      data-month={month}
      className="flex scroll-mt-32 flex-col gap-3 lg:min-h-[calc(100dvh-7rem)] lg:scroll-mt-20"
    >
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h3 className="text-lg font-semibold capitalize">
            {formatMonth(month, locale)}
          </h3>
          {spent !== undefined && (
            <Figure
              amount={spent}
              currency={days.currency}
              className="text-muted-foreground"
            />
          )}
          {days.calendar.failed.has(year) && (
            <span className="text-sm text-destructive">
              {t('dashboard.events.failed', { year })}
            </span>
          )}
        </div>
      </header>
      <div
        className={cn(
          'flex flex-1 flex-col',
          days.calendar.loading.has(year) && 'opacity-60',
        )}
      >
        <MonthGrid month={month} summaries={events} {...days} />
        <MonthAgenda month={month} {...days} />
      </div>
    </section>
  )
}
