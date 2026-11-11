import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { SearchField } from '#/components/forms/search-field'
import { PageTitle } from '#/components/layout/list-page'
import { FilterChips } from '#/components/transactions/filters/filter-chips'
import { FilterSheet } from '#/components/transactions/filters/filter-sheet'
import type {
  ListFilters,
  PeriodChoice,
} from '#/lib/transactions/transaction-list'
import { chipSurface } from '#/components/styles'
import {
  FilterBubble,
  inUse,
} from '#/components/transactions/filters/filter-bubble'
import { cn } from '#/lib/utils'
import {
  FILTER_KEYS,
  FILTER_TABS,
} from '#/lib/transactions/transaction-filters'
import type {
  FilterScreen,
  FilterTab,
  FilterValues,
} from '#/lib/transactions/transaction-filters'
import { useEmptyFilters } from '#/hooks/transactions/use-empty-filters'
import { useFilterLabel } from '#/hooks/transactions/use-filter-label'

/**
 * A filter's button: "Comptes", or "Catégories · 2" with some ticked, filled while in
 * use. It opens the sheet on that filter.
 */
function FilterButton({
  tab,
  values,
  empty,
  onOpen,
}: {
  tab: FilterTab
  values: FilterValues
  /** Nothing to choose from, so it cannot open (unless something is still ticked). */
  empty: boolean
  onOpen: () => void
}) {
  const labelOf = useFilterLabel(values)
  const count = values[FILTER_KEYS[tab]].length
  return (
    <FilterBubble
      label={labelOf(tab)}
      count={count}
      disabled={empty && count === 0}
      onOpen={onOpen}
    />
  )
}

/** On phones, one button for the five filters, "Filtres · 3", opening their list. */
function AllFiltersButton({
  values,
  onOpen,
}: {
  values: FilterValues
  onOpen: () => void
}) {
  const { t } = useTranslation()
  const name = t('transactions.list.filters')
  const count = FILTER_TABS.reduce(
    (sum, tab) => sum + values[FILTER_KEYS[tab]].length,
    0,
  )
  const label = count
    ? t('transactions.list.filterCount', { name, count })
    : name
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={onOpen}
      className={cn(chipSurface, count > 0 && inUse, 'md:hidden')}
    >
      <Icon name="filter" className="size-4" />
      {label}
    </button>
  )
}

/**
 * A status's bubble in its rows' colour, at any date, while some exist; pressed, the list
 * keeps only those. TRX-09: "3 en attente" in the spreadsheet's blue; "2 me
 * doivent" in amber.
 */
function StatusButton({
  status,
  count,
  on,
  onToggle,
}: {
  status: 'pending' | 'owed'
  count: number | null
  on: boolean
  onToggle: (on: boolean) => void
}) {
  const { t } = useTranslation()
  if (!on && !count) return null
  const pending = status === 'pending'
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onToggle(!on)}
      className={cn(
        chipSurface,
        pending ? 'bg-pending' : 'bg-owed',
        on && inUse,
      )}
    >
      <Icon name={pending ? 'clock' : 'users'} className="size-4" />
      {t(
        pending
          ? 'transactions.list.pendingCount'
          : 'transactions.list.owedCount',
        { count: count ?? 0 },
      )}
    </button>
  )
}

type BubblesProps = {
  choice: PeriodChoice
  filters: FilterValues
  names: ListFilters | null
  pending: { count: number | null; on: boolean }
  owed: { count: number | null; on: boolean }
  loading: boolean
  onPeriod: (choice: PeriodChoice) => void
  onPending: (on: boolean) => void
  onOwed: (on: boolean) => void
  empty: ReadonlySet<FilterTab>
  onOpen: (tab: FilterScreen | null) => void
}

/** Pending, owed, the period and the filters, as bubbles wrapping onto more lines. */
function Bubbles(props: BubblesProps) {
  const { t } = useTranslation()
  const { choice, filters, pending, owed, loading } = props
  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusButton
        status="pending"
        count={pending.count}
        on={pending.on}
        onToggle={props.onPending}
      />
      <StatusButton
        status="owed"
        count={owed.count}
        on={owed.on}
        onToggle={props.onOwed}
      />
      <span className="hidden md:contents">
        <FilterBubble
          label={t('transactions.list.dates')}
          count={choice.period === 'all' ? 0 : 1}
          disabled={loading}
          onOpen={() => props.onOpen('period')}
        />
      </span>
      <AllFiltersButton values={filters} onOpen={() => props.onOpen(null)} />
      {FILTER_TABS.map((tab) => (
        <span key={tab} className="hidden md:contents">
          <FilterButton
            tab={tab}
            values={filters}
            empty={props.empty.has(tab)}
            onOpen={() => props.onOpen(tab)}
          />
        </span>
      ))}
    </div>
  )
}

/**
 * The title, the search, then the bubbles: what is pending or owed, the period with its
 * arrows and a button per filter, or on phones a single Filtres button.
 */
export function ListHeader({
  choice,
  filters,
  names,
  total,
  pending,
  owed,
  search,
  loading,
  onPeriod,
  onFilters,
  onPending,
  onOwed,
  onSearch,
}: {
  choice: PeriodChoice
  filters: FilterValues
  names: ListFilters | null
  /** How many rows the list matches, for the sheet's button. */
  total: number | null
  pending: { count: number | null; on: boolean }
  owed: { count: number | null; on: boolean }
  search: string
  loading: boolean
  onPeriod: (choice: PeriodChoice) => void
  onFilters: (values: FilterValues) => void
  onPending: (on: boolean) => void
  onOwed: (on: boolean) => void
  onSearch: (text: string) => void
}) {
  const { t } = useTranslation()
  const empty = useEmptyFilters()
  // `list`: the sheet came from a phone's Filtres button, so a filter has a way back to it.
  const [sheet, setSheet] = useState<{
    open: boolean
    tab: FilterScreen | null
    list: boolean
  }>({ open: false, tab: null, list: true })
  return (
    <>
      <PageTitle>{t('nav.transactions')}</PageTitle>
      <SearchField value={search} onChange={onSearch} />
      <Bubbles
        {...{ choice, filters, names, pending, owed, loading, empty }}
        {...{ onPeriod, onPending, onOwed }}
        onOpen={(tab) => setSheet({ open: true, tab, list: tab === null })}
      />
      <FilterChips
        values={filters}
        names={names}
        period={{ choice, onChange: onPeriod }}
        onChange={onFilters}
      />
      <FilterSheet
        open={sheet.open}
        tab={sheet.tab}
        canGoBack={sheet.list}
        names={names}
        period={choice}
        empty={empty}
        values={filters}
        total={loading ? null : total}
        onOpenChange={(open) => setSheet({ ...sheet, open })}
        onTab={(tab) => setSheet({ ...sheet, tab })}
        onChange={onFilters}
        onPeriod={onPeriod}
      />
    </>
  )
}
