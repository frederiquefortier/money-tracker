import { useTranslation } from 'react-i18next'
import { useFormatLocale, useLocale } from '#/hooks/app/use-locale'
import { eventsByDay, monthWeeks, monthsOf } from '#/lib/events/event-calendar'
import type { EventSummary } from '#/lib/events/event-calendar'
import { formatMonth } from '#/lib/shared/format'
import type { DayRange } from '#/lib/shared/months'
import { tagColors } from '#/lib/shared/color'
import { cn } from '#/lib/utils'
import { firstDayOf, weekdayNames } from '#/lib/shared/week'

const NEUTRAL = 'var(--secondary)'

function dayStyle(events: ReadonlyArray<EventSummary> | undefined) {
  if (!events?.length) return undefined
  const fills = events.map((e) =>
    e.color ? tagColors(e.color).light.background : NEUTRAL,
  )
  if (fills.length === 1) return { background: fills[0] }
  const step = 100 / fills.length
  return {
    background: `linear-gradient(135deg, ${fills
      .map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`)
      .join(', ')})`,
  }
}

/** EVT-04: the period as month grids, each event's days tinted with its type's colour. */
export function PeriodCalendar({
  summaries,
  range,
}: {
  summaries: ReadonlyArray<EventSummary>
  range: DayRange
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const formatLocale = useFormatLocale()
  const firstDay = firstDayOf(formatLocale)
  const names = weekdayNames(formatLocale, firstDay)
  const byDay = eventsByDay(summaries, range)
  return (
    <div
      aria-label={t('dashboard.events.calendar')}
      role="group"
      className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-4"
    >
      {monthsOf(range).map((month) => (
        <div key={month} className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold capitalize">
            {formatMonth(month, locale)}
          </h3>
          <div className="grid grid-cols-7 text-center text-[0.6875rem] text-muted-foreground">
            {names.map((name, i) => (
              <span key={i} aria-hidden="true">
                {name}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5 text-center text-xs">
            {monthWeeks(month, firstDay)
              .flat()
              .map((day, i) => {
                if (day === null) return <span key={i} />
                const events = byDay.get(day)
                const outside = day < range.from || day > range.to
                return (
                  <span
                    key={day}
                    title={events?.map((e) => e.event.name).join(', ')}
                    className={cn(
                      'grid aspect-square place-items-center rounded-md font-mono tabular-nums',
                      events?.length && 'font-semibold text-foreground',
                      outside && 'text-muted-foreground/40',
                    )}
                    style={dayStyle(events)}
                  >
                    {Number(day.slice(8))}
                  </span>
                )
              })}
          </div>
        </div>
      ))}
    </div>
  )
}
