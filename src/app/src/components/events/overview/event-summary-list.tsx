import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Figure } from '#/components/dashboard/dashboard-card'
import { EventTag } from '#/components/display/event-tag'
import { useDateRange } from '#/components/events/list/event-row'
import { EmptyState, ListCard } from '#/components/lists/list-card'
import { focusRing, rowHover } from '#/components/styles'
import type { EventSummary } from '#/lib/events/event-calendar'
import { cn } from '#/lib/utils'

function SummaryRow({
  summary,
  currency,
}: {
  summary: EventSummary
  currency: string
}) {
  const { t } = useTranslation()
  const dates = useDateRange(summary.event)
  const people = summary.event.personIds.length
  return (
    <li className={rowHover}>
      <Link
        to="/transactions"
        search={{ period: 'all', event: [summary.event.id] }}
        className={cn('flex items-center gap-3 px-4 py-3', focusRing)}
      >
        <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <EventTag name={summary.event.name} color={summary.color} />
          <span className="text-xs text-muted-foreground">
            {dates}
            {' · '}
            {t('dashboard.events.days', { count: summary.days })}
            {people > 0 && (
              <>
                {' · '}
                {t('dashboard.events.people', { count: people })}
              </>
            )}
          </span>
        </span>
        <span className="flex flex-col items-end">
          <Figure
            amount={summary.spent}
            currency={currency}
            className="font-semibold"
          />
          {summary.days > 1 && summary.perDay !== null && (
            <span className="text-xs text-muted-foreground">
              <Figure amount={summary.perDay} currency={currency} />{' '}
              {t('dashboard.events.perDay')}
            </span>
          )}
        </span>
      </Link>
    </li>
  )
}

/** The period's events with what each cost me; a row opens its transactions. */
export function EventSummaryList({
  summaries,
  currency,
}: {
  summaries: ReadonlyArray<EventSummary>
  currency: string
}) {
  const { t } = useTranslation()
  if (summaries.length === 0)
    return <EmptyState>{t('dashboard.events.empty')}</EmptyState>
  return (
    <ListCard>
      {summaries.map((summary) => (
        <SummaryRow
          key={summary.event.id}
          summary={summary}
          currency={currency}
        />
      ))}
    </ListCard>
  )
}
