import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { SearchField } from '#/components/forms/search-field'
import { PeriodTabs } from '#/components/transactions/period/period-tabs'
import { FilterChips } from '#/components/transactions/filters/filter-chips'
import { FilterSheet } from '#/components/transactions/filters/filter-sheet'
import type {
  ListFilters,
  PeriodChoice,
} from '#/lib/transactions/transaction-list'
import { chipActive, chipSurface } from '#/components/styles'
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
      className={cn(chipSurface, count > 0 && chipActive, 'lg:hidden')}
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
        on && chipActive,
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
  // From `lg` the Filtres button hides; with no status either, the row takes no space.
  const status = pending.on || !!pending.count || owed.on || !!owed.count
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2',
        !status && 'lg:hidden',
      )}
    >
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
 * Over the list: the period tabs with the search at their end, the bubbles under them (what is pending or owed, and below `lg` a single Filtres button
 * opening the sheet; the sidebar holds the filters from `lg` up), then the chips.
 */
export function ListHeader({
  choice,
  filters,
  names,
  pending,
  owed,
  search,
  onPeriod,
  onFilters,
  onPending,
  onOwed,
  onSearch,
}: {
  choice: PeriodChoice
  filters: FilterValues
  names: ListFilters | null
  pending: { count: number | null; on: boolean }
  owed: { count: number | null; on: boolean }
  search: string
  onPeriod: (choice: PeriodChoice) => void
  onFilters: (values: FilterValues) => void
  onPending: (on: boolean) => void
  onOwed: (on: boolean) => void
  onSearch: (text: string) => void
}) {
  const empty = useEmptyFilters()
  const [sheet, setSheet] = useState<{
    open: boolean
    tab: FilterScreen | null
  }>({ open: false, tab: null })
  return (
    <>
      {/* The tabs with the search at their end (under them on phones), then what is
          pending or owed under the tabs at every width (author, 2026-11-17), as far from
          them and from the chips as the chips are from the list (author, 2026-11-18). */}
      <div className="flex flex-wrap items-center gap-3">
        <PeriodTabs
          choice={choice}
          onChange={onPeriod}
          onPickDates={() => setSheet({ open: true, tab: 'period' })}
        />
        {/* A word or two is what people type; a full-width box suggests more. */}
        <div className="w-full sm:ml-auto sm:max-w-72">
          <SearchField value={search} onChange={onSearch} />
        </div>
      </div>
      {/* Its own row of the list's column, spaced as the chips under it. */}
      <Bubbles
        {...{ filters, pending, owed, onPending, onOwed }}
        onOpen={() => setSheet({ open: true, tab: null })}
      />
      <FilterChips values={filters} names={names} onChange={onFilters} />
      <FilterSheet
        open={sheet.open}
        tab={sheet.tab}
        names={names}
        period={choice}
        empty={empty}
        values={filters}
        onOpenChange={(open) => setSheet({ ...sheet, open })}
        onTab={(tab) => setSheet({ ...sheet, tab })}
        onChange={onFilters}
        onPeriod={onPeriod}
      />
    </>
  )
}
