import { useTranslation } from 'react-i18next'
import { DashboardCard } from '#/components/dashboard/dashboard-card'
import { ComparedList } from '#/components/events/overview/compared-list'
import { EventTag } from '#/components/display/event-tag'
import { EmptyState } from '#/components/lists/list-card'
import { SortMenu } from '#/components/lists/sort-menu'
import { TabList } from '#/components/lists/tab-list'
import { useFormatLocale } from '#/hooks/app/use-locale'
import { useStoredState } from '#/hooks/app/use-stored-state'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import {
  COMPARE_SORTS,
  comparableTypes,
  sortCompared,
  typeComparison,
} from '#/lib/events/event-calendar'
import type { CompareSort, EventSummary } from '#/lib/events/event-calendar'
import type { EventType } from '#/lib/events/event'
import type { EventPart } from '#/lib/events/event-parts'
import type { Category } from '#/lib/categories/category'
import { oneOf } from '#/lib/shared/collections'

const PANEL = 'type-comparison'
const parseSort = oneOf(COMPARE_SORTS)

const overlaps = (period: DashboardPeriod, summary: EventSummary) =>
  period.unit === 'all' ||
  (summary.from <= `${period.year}-12-31` &&
    summary.to >= `${period.year}-01-01`)

/** The sort, then the types as dots in their colour, as Par catégorie's. */
function CompareControls({
  types,
  typeId,
  onType,
  sort,
  onSort,
}: {
  types: ReadonlyArray<EventType>
  typeId: string
  onType: (id: string) => void
  sort: CompareSort
  onSort: (sort: CompareSort) => void
}) {
  const { t } = useTranslation()
  return (
    <>
      <SortMenu
        sort={sort}
        options={COMPARE_SORTS}
        labelOf={(option) => t(`dashboard.events.sort.${option}`)}
        onChange={onSort}
      />
      <TabList
        label={t('dashboard.events.typesLabel')}
        tabs={types.map((type) => type.id)}
        value={typeId}
        labelOf={(id) => types.find((type) => type.id === id)?.name ?? ''}
        dot={(id) => types.find((type) => type.id === id)?.color ?? ''}
        panelId={PANEL}
        idPrefix="compare-type"
        fit
        onSelect={onType}
      />
    </>
  )
}

/**
 * EVT-05: one type's events as a chart of their cost per day and a sortable list, each
 * against the type's mean over every year. On a year, only that year's events and the types that have
 * one (author, 2026-11-23).
 */
export function TypeComparison({
  summaries,
  types,
  parts,
  categories,
  period,
  currency,
}: {
  summaries: ReadonlyArray<EventSummary>
  types: ReadonlyArray<EventType>
  parts: ReadonlyMap<string, ReadonlyArray<EventPart> | null>
  categories: ReadonlyArray<Category>
  period: DashboardPeriod
  currency: string
}) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const inPeriod = (summary: EventSummary) => overlaps(period, summary)
  const comparable = comparableTypes(summaries, types).filter((type) =>
    summaries.some((s) => s.event.typeId === type.id && inPeriod(s)),
  )
  const ids = comparable.map((type) => type.id)
  const typeOf = (id: string) => comparable.find((type) => type.id === id)
  const [stored, setTypeId] = useStoredState<string>(
    'dashboard.compareType',
    '',
    (v) => (typeof v === 'string' ? v : undefined),
  )
  const typeId = ids.includes(stored) ? stored : ids.at(0)
  const type = typeId === undefined ? undefined : typeOf(typeId)
  const [sort, setSort] = useStoredState<CompareSort>(
    'dashboard.compareSort',
    'dateDesc',
    parseSort,
  )
  const compared = typeId ? typeComparison(summaries, typeId) : null
  const history = compared?.events ?? []
  return (
    <DashboardCard
      title={t('dashboard.events.compare')}
      note={type && <EventTag name={type.name} color={type.color} />}
      actions={
        typeId && (
          <CompareControls
            types={comparable}
            typeId={typeId}
            onType={setTypeId}
            sort={sort}
            onSort={setSort}
          />
        )
      }
    >
      {typeId ? (
        <ComparedList
          key={typeId}
          panelId={PANEL}
          parts={parts}
          categories={categories}
          typeId={typeId}
          usual={compared?.usual ?? null}
          events={sortCompared(history.filter(inPeriod), sort, locale)}
          period={period}
          currency={currency}
        />
      ) : (
        <EmptyState>
          {period.unit === 'all'
            ? t('dashboard.events.noTypes')
            : t('dashboard.events.noneInYear', { year: period.year })}
        </EmptyState>
      )}
    </DashboardCard>
  )
}
