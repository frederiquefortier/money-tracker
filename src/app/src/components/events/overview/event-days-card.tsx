import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DashboardCard } from '#/components/dashboard/dashboard-card'
import { DayGrid, DaysCount } from '#/components/dashboard/day-grid'
import { heatFills } from '#/components/styles'
import { useLocale } from '#/hooks/app/use-locale'
import type { CalendarDays } from '#/lib/dashboard/calendar-days'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { daySearch } from '#/lib/dashboard/drill-down'
import type { EventSummary } from '#/lib/events/event-calendar'
import { formatDay } from '#/lib/shared/format'
import { daysGoneBy } from '#/lib/shared/months'
import type { DayRange } from '#/lib/shared/months'

const NEUTRAL = 'var(--primary)'

/** A day in its event's colour, split diagonally between several; paler when to come. */
function eventFill(
  events: ReadonlyArray<EventSummary> | undefined,
  future: boolean,
): string {
  if (!events?.length) return heatFills.none
  const colors = events.map((e) => {
    const color = e.color ?? NEUTRAL
    return future ? `color-mix(in oklch, ${color} 40%, var(--card))` : color
  })
  if (colors.length === 1) return colors[0] ?? NEUTRAL
  const step = 100 / colors.length
  return `linear-gradient(135deg, ${colors
    .map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`)
    .join(', ')})`
}

/** The hovered day and its events, or none. */
function Caption({
  day,
  events,
}: {
  day: string | null
  events: ReadonlyArray<EventSummary>
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  if (!day) return <span />
  return (
    <span className="text-xs">
      <span className="text-muted-foreground first-letter:uppercase">
        {formatDay(day, locale)}
      </span>{' '}
      {events.length ? (
        <span className="font-semibold">
          {events.map((e) => e.event.name).join(', ')}
        </span>
      ) : (
        t('dashboard.events.noEvent')
      )}
    </span>
  )
}

/**
 * Événements par jour, as Argent's Dépenses par jour (author, 2026-11-23): the period's
 * months as small calendars, each day with an event in its type's colour, the days with
 * an event over the days gone by in the corner, the hovered day on a line of kept height.
 * A month's name scrolls the calendar to it; a day opens its transactions.
 */
export function EventDaysCard({
  months,
  range,
  period,
  today,
  calendar,
  actions,
  onJump,
}: {
  months: ReadonlyArray<string>
  range: DayRange
  period: DashboardPeriod
  today: string
  calendar: CalendarDays
  /** The eye hiding events. */
  actions?: React.ReactNode
  onJump: (month: string) => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<string | null>(null)
  const count = [...calendar.events.keys()].filter((d) => d <= today).length
  const total = daysGoneBy(range, today)
  return (
    <DashboardCard
      title={t('dashboard.events.dayMap')}
      className="justify-between"
      actions={
        <>
          <DaysCount
            count={count}
            total={total}
            label={t('dashboard.events.daysLabel', { count, total })}
          />
          {actions}
        </>
      }
    >
      <div role="img" aria-label={t('dashboard.events.dayMapLabel', { count })}>
        <DayGrid
          months={months}
          today={today}
          future
          withYear={period.unit === 'all'}
          fillOf={(day, future) => eventFill(calendar.events.get(day), future)}
          onHover={setHovered}
          onOpen={(day) =>
            void navigate({
              to: '/transactions',
              search: daySearch(period, day),
            })
          }
          onMonth={onJump}
        />
      </div>
      {/* Room kept for the hovered day, so the card never changes height. */}
      <p className="h-5 truncate text-xs leading-5">
        <Caption
          day={hovered}
          events={hovered ? (calendar.events.get(hovered) ?? []) : []}
        />
      </p>
    </DashboardCard>
  )
}
