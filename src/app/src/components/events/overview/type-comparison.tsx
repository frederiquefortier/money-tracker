import { useTranslation } from 'react-i18next'
import { DashboardCard, Figure } from '#/components/dashboard/dashboard-card'
import { ChoiceMenu } from '#/components/display/choice-menu'
import { ShareBar } from '#/components/display/share-bar'
import { useDateRange } from '#/components/events/list/event-row'
import { EmptyState } from '#/components/lists/list-card'
import { useStoredState } from '#/hooks/app/use-stored-state'
import { typeComparison } from '#/lib/events/event-calendar'
import type { EventSummary } from '#/lib/events/event-calendar'
import type { EventType } from '#/lib/events/event'

function ComparedRow({
  summary,
  max,
  currency,
}: {
  summary: EventSummary
  max: number
  currency: string
}) {
  const { t } = useTranslation()
  const dates = useDateRange(summary.event)
  return (
    <li className="flex flex-col gap-1.5 py-2.5">
      <span className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate font-semibold">
          {summary.event.name}
        </span>
        <Figure
          amount={summary.spent}
          currency={currency}
          className="text-sm font-semibold"
        />
      </span>
      <ShareBar
        value={summary.spent}
        max={max}
        color={summary.color ?? 'var(--primary)'}
      />
      <span className="flex justify-between gap-3 text-xs text-muted-foreground">
        <span className="truncate">
          {dates} · {t('dashboard.events.days', { count: summary.days })}
        </span>
        {summary.perDay !== null && (
          <span className="whitespace-nowrap">
            <Figure amount={summary.perDay} currency={currency} />{' '}
            {t('dashboard.events.perDay')}
          </span>
        )}
      </span>
    </li>
  )
}

function ComparedRows({
  typeId,
  rows,
  max,
  currency,
}: {
  typeId: string | undefined
  rows: ReadonlyArray<EventSummary>
  max: number
  currency: string
}) {
  const { t } = useTranslation()
  if (!typeId) return <EmptyState>{t('dashboard.events.noTypes')}</EmptyState>
  if (rows.length === 0)
    return <EmptyState>{t('dashboard.events.noneOfType')}</EmptyState>
  return (
    <ul className="divide-y">
      {rows.map((summary) => (
        <ComparedRow
          key={summary.event.id}
          summary={summary}
          max={max}
          currency={currency}
        />
      ))}
    </ul>
  )
}

/** EVT-05: one type's events over every year, as bars of what each cost. */
export function TypeComparison({
  summaries,
  types,
  currency,
}: {
  summaries: ReadonlyArray<EventSummary>
  types: ReadonlyArray<EventType>
  currency: string
}) {
  const { t } = useTranslation()
  const used = types.filter((type) => type.eventCount > 0)
  const ids = used.map((type) => type.id)
  const [stored, setTypeId] = useStoredState<string>(
    'dashboard.compareType',
    '',
    (v) => (typeof v === 'string' ? v : undefined),
  )
  const typeId = ids.includes(stored) ? stored : ids[0]
  const nameOf = (id: string) => used.find((type) => type.id === id)?.name ?? ''
  const rows = typeId ? typeComparison(summaries, typeId) : []
  const max = Math.max(...rows.map((r) => Number(r.spent ?? 0)), 0)
  return (
    <DashboardCard
      title={t('dashboard.events.compare')}
      actions={
        typeId && (
          <ChoiceMenu
            label={t('dashboard.events.typeLabel', { type: nameOf(typeId) })}
            value={typeId}
            options={ids}
            labelOf={nameOf}
            onChange={setTypeId}
          />
        )
      }
    >
      <ComparedRows typeId={typeId} rows={rows} max={max} currency={currency} />
    </DashboardCard>
  )
}
