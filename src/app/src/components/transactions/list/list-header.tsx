import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CategoryBadge } from '#/components/categories/category-badge'
import { Icon } from '#/components/display/icon'
import { SearchField } from '#/components/forms/search-field'
import { PageTitle } from '#/components/layout/list-page'
import { FilterSheet } from '#/components/transactions/filters/filter-sheet'
import { PeriodPicker } from '#/components/transactions/period/period-controls'
import { accountLabel } from '#/lib/accounts/account'
import type {
  ListFilters,
  PeriodChoice,
} from '#/lib/transactions/transaction-list'
import { chipSurface } from '#/components/styles'
import { cn } from '#/lib/utils'
import {
  FILTER_KEYS,
  FILTER_TABS,
} from '#/lib/transactions/transaction-filters'
import type {
  FilterTab,
  FilterValues,
} from '#/lib/transactions/transaction-filters'
import { useFilterLabel } from '#/hooks/transactions/use-filter-label'

const inUse = 'border-primary text-primary'

/** The one ticked in a filter, named on its button; null with none or several. */
function onlyPicked(tab: FilterTab, names: ListFilters | null) {
  if (tab === 'accounts' && names?.accounts.length === 1)
    return { name: accountLabel(names.accounts[0]) }
  if (tab === 'categories' && names?.categories.length === 1) {
    const c = names.categories[0]
    return {
      name: c.name,
      icon: (
        <CategoryBadge
          icon={c.icon}
          color={c.color}
          size="sm"
          className="size-6 [&_svg]:size-3.5"
        />
      ),
    }
  }
  if (tab === 'merchants' && names?.merchants.length === 1)
    return { name: names.merchants[0].name }
  if (tab === 'people' && names?.people.length === 1)
    return { name: names.people[0].name }
  return null
}

/**
 * A filter's button: "Comptes", the one ticked ("Épicerie"), or "Catégories · 2",
 * filled while in use. It opens the sheet on that filter.
 */
function FilterButton({
  tab,
  values,
  names,
  onOpen,
}: {
  tab: FilterTab
  values: FilterValues
  names: ListFilters | null
  onOpen: () => void
}) {
  const labelOf = useFilterLabel(values)
  const count = values[FILTER_KEYS[tab]].length
  const only = count === 1 ? onlyPicked(tab, names) : null
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={labelOf(tab)}
      onClick={onOpen}
      className={cn(chipSurface, count > 0 && inUse, only?.icon && 'pl-1')}
    >
      {only?.icon}
      <span className="max-w-40 truncate">{only?.name ?? labelOf(tab)}</span>
      <Icon name="chevron-down" className="size-4" />
    </button>
  )
}

/** On phones, one button for the three filters, "Filtres · 3", opening on Comptes. */
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
 * keeps only those. TRX-09: "3 en attente" in the spreadsheet's blue; spec 20: "2 me
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
  onOpen: (tab: FilterTab) => void
}

/**
 * Pending, owed, the period and the filters, as bubbles: on phones one row scrolling
 * sideways and fading at the edge; from md up, wrapping onto more lines.
 */
function Bubbles(props: BubblesProps) {
  const { choice, filters, names, pending, owed, loading } = props
  return (
    <div className="-mx-4 -my-1 overflow-x-auto px-4 py-1 [scrollbar-width:none] max-md:[mask-image:linear-gradient(to_right,black_calc(100%-1rem),transparent)] md:mx-0 md:overflow-visible md:px-0">
      <div className="flex w-max items-center gap-2 md:w-auto md:flex-wrap">
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
        <PeriodPicker
          choice={choice}
          disabled={loading}
          onChange={props.onPeriod}
        />
        <AllFiltersButton
          values={filters}
          onOpen={() => props.onOpen('accounts')}
        />
        {FILTER_TABS.map((tab) => (
          <span key={tab} className="hidden md:contents">
            <FilterButton
              tab={tab}
              values={filters}
              names={names}
              onOpen={() => props.onOpen(tab)}
            />
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * The title, the search, then the bubbles: what is pending or owed, the period with its
 * arrows and a button per filter (spec 14), or on phones a single Filtres button.
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
  const [sheet, setSheet] = useState<{ open: boolean; tab: FilterTab }>({
    open: false,
    tab: 'accounts',
  })
  return (
    <>
      <PageTitle>{t('nav.transactions')}</PageTitle>
      <SearchField value={search} onChange={onSearch} />
      <Bubbles
        {...{ choice, filters, names, pending, owed, loading }}
        {...{ onPeriod, onPending, onOwed }}
        onOpen={(tab) => setSheet({ open: true, tab })}
      />
      <FilterSheet
        open={sheet.open}
        tab={sheet.tab}
        values={filters}
        total={loading ? null : total}
        onOpenChange={(open) => setSheet({ ...sheet, open })}
        onTab={(tab) => setSheet({ ...sheet, tab })}
        onChange={onFilters}
      />
    </>
  )
}
