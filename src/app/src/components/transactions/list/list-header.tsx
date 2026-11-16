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
import { inUse } from '#/components/transactions/filters/filter-bubble'
import { cn } from '#/lib/utils'
import {
  FILTER_KEYS,
  FILTER_TABS,
} from '#/lib/transactions/transaction-filters'
import type {
  FilterScreen,
  FilterValues,
} from '#/lib/transactions/transaction-filters'
import { useEmptyFilters } from '#/hooks/transactions/use-empty-filters'

/** Below `lg`, one button for the filters, "Filtres · 3", opening their list; the sidebar shows them from `lg` up. */
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
      className={cn(chipSurface, count > 0 && inUse, 'lg:hidden')}
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
  filters: FilterValues
  pending: { count: number | null; on: boolean }
  owed: { count: number | null; on: boolean }
  onPending: (on: boolean) => void
  onOwed: (on: boolean) => void
  onOpen: () => void
}

/** What is pending or owed, and below `lg` the Filtres button, wrapping onto more lines. */
function Bubbles(props: BubblesProps) {
  const { filters, pending, owed } = props
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
      <AllFiltersButton values={filters} onOpen={props.onOpen} />
    </div>
  )
}

/**
 * The title, the search, then the bubbles: what is pending or owed, and below `lg` a
 * single Filtres button opening the sheet (the sidebar holds the filters from `lg` up).
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
  const [sheet, setSheet] = useState<{
    open: boolean
    tab: FilterScreen | null
  }>({ open: false, tab: null })
  return (
    <>
      <PageTitle>{t('nav.transactions')}</PageTitle>
      <SearchField value={search} onChange={onSearch} />
      <Bubbles
        {...{ filters, pending, owed, onPending, onOwed }}
        onOpen={() => setSheet({ open: true, tab: null })}
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
