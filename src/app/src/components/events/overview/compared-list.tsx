import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Figure } from '#/components/dashboard/dashboard-card'
import { ComparedChart } from '#/components/events/overview/compared-chart'
import { focusRing } from '#/components/styles'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { eventSearch } from '#/lib/dashboard/drill-down'
import type { Category } from '#/lib/categories/category'
import type { EventSummary } from '#/lib/events/event-calendar'
import type { EventPart } from '#/lib/events/event-parts'
import { absDecimal, compareDecimal } from '#/lib/shared/money'
import { cn } from '#/lib/utils'

const rowGrid = 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3'

function ComparedRow({
  summary,
  period,
  currency,
}: {
  summary: EventSummary
  period: DashboardPeriod
  currency: string
}) {
  const { t } = useTranslation()
  const broughtIn =
    summary.perDay !== null && compareDecimal(summary.perDay, '0') < 0
  return (
    <li className={cn(rowGrid, 'py-2.5')}>
      <span className="min-w-0">
        <Link
          to="/transactions"
          search={eventSearch(period, summary.event.id)}
          className={cn(
            'block truncate rounded-md font-semibold hover:underline',
            focusRing,
          )}
        >
          {summary.event.name}
        </Link>
        <span className="block truncate text-xs text-muted-foreground">
          {period.unit === 'all' && `${summary.from.slice(0, 4)} · `}
          {t('dashboard.events.days', { count: summary.days })} ·{' '}
          <Figure
            amount={summary.spent === null ? null : absDecimal(summary.spent)}
            currency={currency}
          />
        </span>
      </span>
      <Figure
        amount={summary.perDay === null ? null : absDecimal(summary.perDay)}
        currency={currency}
        className={cn(
          'text-right text-sm font-semibold',
          broughtIn && 'text-income',
        )}
      />
    </li>
  )
}

/**
 * The type's events shown, every one: the chart of their cost per day, then a row each
 * with its figures (author, 2026-11-23).
 */
export function ComparedList({
  panelId,
  typeId,
  usual,
  parts,
  categories,
  events,
  period,
  currency,
}: {
  panelId: string
  typeId: string
  usual: string | null
  parts: ReadonlyMap<string, ReadonlyArray<EventPart> | null>
  categories: ReadonlyArray<Category>
  events: ReadonlyArray<EventSummary>
  period: DashboardPeriod
  currency: string
}) {
  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={`compare-type-${typeId}`}
    >
      <ComparedChart
        events={events}
        usual={usual}
        parts={parts}
        categories={categories}
        period={period}
        currency={currency}
      />
      <ul className="divide-y">
        {events.map((e) => (
          <ComparedRow
            key={e.event.id}
            summary={e}
            period={period}
            currency={currency}
          />
        ))}
      </ul>
    </div>
  )
}
