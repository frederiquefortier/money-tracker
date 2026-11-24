import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Figure } from '#/components/dashboard/dashboard-card'
import { EventTag } from '#/components/display/event-tag'
import {
  DayPeople,
  DayTransactions,
} from '#/components/events/overview/day-parts'
import { focusRing, heatFill } from '#/components/styles'
import { useFormatLocale } from '#/hooks/app/use-locale'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { daySearch } from '#/lib/dashboard/drill-down'
import type { ActivityNames, CalendarDays } from '#/lib/dashboard/calendar-days'
import { addDays, monthEnd } from '#/lib/shared/months'
import { cn } from '#/lib/utils'

type DayProps = {
  period: DashboardPeriod
  calendar: CalendarDays
  names: ActivityNames
  currency: string
}

function AgendaDay({
  day,
  weekday,
  period,
  calendar,
  names,
  currency,
}: DayProps & { day: string; weekday: string }) {
  const spent = calendar.spent.get(day)
  const transactions = calendar.transactions.get(day) ?? []
  const events = calendar.events.get(day) ?? []
  return (
    <li
      className="flex gap-3 px-3 py-2.5"
      style={{
        backgroundColor:
          spent === undefined
            ? 'var(--card)'
            : heatFill(spent, calendar.steps, 'soft'),
      }}
    >
      <Link
        to="/transactions"
        search={daySearch(period, day)}
        className={cn(
          'flex w-9 shrink-0 flex-col items-center rounded',
          focusRing,
        )}
      >
        <span className="text-[0.625rem] text-muted-foreground uppercase">
          {weekday}
        </span>
        <span className="font-mono text-lg leading-6 font-semibold">
          {Number(day.slice(8))}
        </span>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1 text-xs">
        {events.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {events.map((e) => (
              <EventTag key={e.event.id} name={e.event.name} color={e.color} />
            ))}
          </div>
        )}
        <DayTransactions
          day={day}
          period={period}
          transactions={transactions}
          shown={3}
          names={names}
          currency={currency}
        />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {spent !== undefined && (
          <Figure
            amount={spent}
            currency={currency}
            className="text-sm font-semibold"
          />
        )}
        <DayPeople transactions={transactions} names={names} />
      </div>
    </li>
  )
}

/**
 * Below `lg`, seven columns cannot hold a transaction: the month as a list of its days
 * with a transaction or an event, each as the calendar box's content on one row.
 */
export function MonthAgenda({ month, ...day }: DayProps & { month: string }) {
  const { t } = useTranslation()
  const weekday = new Intl.DateTimeFormat(useFormatLocale(), {
    weekday: 'short',
    timeZone: 'UTC',
  })
  const days: Array<string> = []
  for (let d = `${month}-01`; d <= monthEnd(month); d = addDays(d, 1))
    if (day.calendar.transactions.has(d) || day.calendar.events.has(d))
      days.push(d)
  if (days.length === 0)
    return (
      <p className="text-sm text-muted-foreground lg:hidden">
        {t('dashboard.heatmap.nothing')}
      </p>
    )
  return (
    <ul className="flex flex-col divide-y overflow-hidden rounded-lg border lg:hidden">
      {days.map((d) => (
        <AgendaDay
          key={d}
          day={d}
          weekday={weekday.format(new Date(`${d}T00:00:00Z`))}
          {...day}
        />
      ))}
    </ul>
  )
}
