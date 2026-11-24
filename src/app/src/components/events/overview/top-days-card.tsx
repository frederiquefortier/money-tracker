import { useTranslation } from 'react-i18next'
import { Figure } from '#/components/dashboard/dashboard-card'
import {
  HighlightRows,
  HighlightSlip,
  SlipRow,
} from '#/components/events/overview/highlight-rows'
import { useLocale } from '#/hooks/app/use-locale'
import type { DaySpent } from '#/lib/dashboard/daily-spending'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { daySearch } from '#/lib/dashboard/drill-down'
import { topDays } from '#/lib/dashboard/year-activity'
import type { DayTransaction } from '#/lib/dashboard/year-activity'
import type { ActivityNames } from '#/lib/dashboard/calendar-days'
import type { EventSummary } from '#/lib/events/event-calendar'
import { formatDate } from '#/lib/shared/format'

/** What drove a day: its event, or else its largest expense's merchant or category. */
function driverOf(
  day: string,
  {
    transactions,
    summaries,
    names,
  }: {
    transactions: ReadonlyArray<DayTransaction>
    summaries: ReadonlyArray<EventSummary>
    names: ActivityNames
  },
): string | undefined {
  const event = summaries.find((s) => s.from <= day && s.to >= day)
  if (event) return event.event.name
  // The most negative amount is the largest expense.
  const largest = transactions
    .filter((tx) => tx.day === day && tx.kind === 'expense')
    .sort((a, b) => Number(a.amount ?? 0) - Number(b.amount ?? 0))
    .at(0)
  return largest && names.label(largest)
}

/** YR-03: the period's three costliest days, each opening its transactions. */
export function TopDaysCard({
  period,
  days,
  transactions,
  summaries,
  complete,
  names,
  currency,
}: {
  period: DashboardPeriod
  days: ReadonlyArray<DaySpent>
  transactions: ReadonlyArray<DayTransaction>
  /** The events shown: a hidden type's event does not name a day. */
  summaries: ReadonlyArray<EventSummary>
  complete: boolean
  names: ActivityNames
  currency: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const top = topDays(days)
  return (
    <HighlightSlip title={t('dashboard.events.highlights.topDays')}>
      <HighlightRows
        complete={complete}
        empty={top.length ? null : t('dashboard.events.highlights.noDays')}
      >
        {top.map((day, i) => (
          <SlipRow
            key={day.day}
            search={daySearch(period, day.day)}
            label={`${i + 1}. ${formatDate(day.day, locale, 'medium')}`}
            figure={<Figure amount={day.spent} currency={currency} />}
            detail={driverOf(day.day, { transactions, summaries, names })}
          />
        ))}
      </HighlightRows>
    </HighlightSlip>
  )
}
