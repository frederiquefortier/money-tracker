import { Link } from '@tanstack/react-router'
import { Figure } from '#/components/dashboard/dashboard-card'
import {
  DayPeople,
  DayTransactions,
} from '#/components/events/overview/day-parts'
import { focusRing, heatFill, tagTint, tagTintStyle } from '#/components/styles'
import { useFormatLocale } from '#/hooks/app/use-locale'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { daySearch } from '#/lib/dashboard/drill-down'
import { eventLanes } from '#/lib/dashboard/year-activity'
import type { ActivityNames, CalendarDays } from '#/lib/dashboard/calendar-days'
import { monthWeeks } from '#/lib/events/event-calendar'
import type { EventSummary } from '#/lib/events/event-calendar'
import { monthEnd } from '#/lib/shared/months'
import { firstDayOf, weekdayNames } from '#/lib/shared/week'
import { cn } from '#/lib/utils'

// Past three overlapping events a day's box would be all bars; the month's header lists
// every event anyway.
const MAX_LANES = 3

type BoxProps = {
  period: DashboardPeriod
  today: string
  calendar: CalendarDays
  names: ActivityNames
  currency: string
}

/** An event's bar on one day: rounded where it starts and ends, named where a row starts. */
function EventBar({
  summary,
  day,
  column,
}: {
  summary: EventSummary
  day: string
  column: number
}) {
  const starts = day === summary.from || column === 0 || day.endsWith('-01')
  const ends =
    day === summary.to || column === 6 || day === monthEnd(day.slice(0, 7))
  return (
    <Link
      to="/transactions"
      search={{ period: 'all', event: [summary.event.id] }}
      title={summary.event.name}
      className={cn(
        'block h-4 truncate text-[0.625rem] leading-4 font-semibold',
        summary.color ? tagTint : 'bg-secondary text-primary',
        starts ? 'ml-1 rounded-l-full pl-2' : 'pl-1',
        ends ? 'mr-1 rounded-r-full' : '-mr-px',
        focusRing,
      )}
      style={tagTintStyle(summary.color)}
    >
      {starts ? summary.event.name : ' '}
    </Link>
  )
}

/** The day's events, each on its lane so a bar keeps its height across the days. */
function EventLanes({
  day,
  column,
  events,
  lanes,
  count,
}: {
  day: string
  column: number
  events: ReadonlyArray<EventSummary>
  lanes: ReadonlyMap<string, number>
  count: number
}) {
  if (count === 0) return null
  return (
    <div className="flex flex-col gap-0.5">
      {Array.from({ length: count }, (_, lane) => {
        const summary = events.find((e) => lanes.get(e.event.id) === lane)
        return summary ? (
          <EventBar
            key={summary.event.id}
            summary={summary}
            day={day}
            column={column}
          />
        ) : (
          <span key={`lane-${lane}`} className="h-4" />
        )
      })}
    </div>
  )
}

function DayBox({
  day,
  column,
  lanes,
  laneCount,
  period,
  today,
  calendar,
  names,
  currency,
}: BoxProps & {
  day: string
  column: number
  lanes: ReadonlyMap<string, number>
  laneCount: number
}) {
  const spent = calendar.spent.get(day)
  const transactions = calendar.transactions.get(day) ?? []
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1 py-1.5 text-xs',
        day > today && 'text-muted-foreground',
      )}
      style={{
        backgroundColor:
          spent === undefined
            ? 'var(--card)'
            : heatFill(spent, calendar.steps, 'soft'),
      }}
    >
      <div className="flex items-center justify-between gap-1 px-2">
        <Link
          to="/transactions"
          search={daySearch(period, day)}
          className={cn(
            'grid size-5 place-items-center rounded-full font-mono font-semibold tabular-nums',
            day === today
              ? 'bg-primary text-primary-foreground'
              : 'hover:text-primary',
            focusRing,
          )}
        >
          {Number(day.slice(8))}
        </Link>
        {spent !== undefined && (
          <Figure
            amount={spent}
            currency={currency}
            className="font-semibold"
          />
        )}
      </div>
      <EventLanes
        day={day}
        column={column}
        events={calendar.events.get(day) ?? []}
        lanes={lanes}
        count={laneCount}
      />
      <div className="flex min-w-0 flex-col gap-0.5 px-2">
        <DayTransactions
          day={day}
          period={period}
          transactions={transactions}
          shown={2}
          names={names}
          currency={currency}
        />
      </div>
      <div className="mt-auto px-2">
        <DayPeople transactions={transactions} names={names} />
      </div>
    </div>
  )
}

/**
 * A month as seven columns filling the rest of the screen's height (from `lg`): each
 * day's spending as a pale heat tint, its events as bars across their days, its first
 * transactions and the people on them.
 */
export function MonthGrid({
  month,
  summaries,
  ...box
}: BoxProps & {
  month: string
  /** The events overlapping the month. */
  summaries: ReadonlyArray<EventSummary>
}) {
  const formatLocale = useFormatLocale()
  const firstDay = firstDayOf(formatLocale)
  const weeks = monthWeeks(month, firstDay)
  const lanes = eventLanes(summaries)
  const laneCount = Math.min(Math.max(-1, ...lanes.values()) + 1, MAX_LANES)
  return (
    <div className="hidden flex-1 flex-col gap-1 lg:flex">
      <div className="grid grid-cols-7 text-xs text-muted-foreground">
        {weekdayNames(formatLocale, firstDay, 'short').map((name, i) => (
          <span key={i} aria-hidden="true" className="px-2 capitalize">
            {name}
          </span>
        ))}
      </div>
      <div
        className="grid flex-1 grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border"
        style={{
          gridTemplateRows: `repeat(${weeks.length}, minmax(7.5rem, 1fr))`,
        }}
      >
        {weeks
          .flat()
          .map((day, i) =>
            day === null ? (
              <div key={`empty-${i}`} className="bg-muted/40" />
            ) : (
              <DayBox
                key={day}
                day={day}
                column={i % 7}
                lanes={lanes}
                laneCount={laneCount}
                {...box}
              />
            ),
          )}
      </div>
    </div>
  )
}
