import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CategoryBadge } from '#/components/categories/category-badge'
import { Icon } from '#/components/icon'
import { SearchField } from '#/components/search-field'
import { PageTitle } from '#/components/list-page'
import {
  FILTER_KEYS,
  FILTER_TABS,
  FilterSheet,
  useFilterLabel,
} from '#/components/transactions/filter-sheet'
import type {
  FilterTab,
  FilterValues,
} from '#/components/transactions/filter-sheet'
import { PeriodPicker } from '#/components/transactions/period-controls'
import type { PeriodChoice } from '#/components/transactions/period-controls'
import { accountLabel } from '#/lib/accounts'
import type { ListFilters } from '#/lib/transaction-list'
import { chip } from '#/components/chip'
import { cn } from '#/lib/utils'

const inUse = 'border-primary bg-accent text-accent-foreground'

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
      className={cn(chip, count > 0 && inUse, only?.icon && 'pl-1')}
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
      className={cn(chip, count > 0 && inUse, 'md:hidden')}
    >
      <Icon name="filter" className="size-4" />
      {label}
    </button>
  )
}

/**
 * TRX-09: "3 en attente" in the spreadsheet's blue while something is pending, at any
 * date; pressed, the list keeps only those.
 */
function PendingButton({
  count,
  on,
  onToggle,
}: {
  count: number | null
  on: boolean
  onToggle: (on: boolean) => void
}) {
  const { t } = useTranslation()
  if (!on && !count) return null
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onToggle(!on)}
      className={cn(chip, 'bg-pending', on && inUse)}
    >
      <Icon name="clock" className="size-4" />
      {t('transactions.list.pendingCount', { count: count ?? 0 })}
    </button>
  )
}

/**
 * The title, the search, then one row: what is pending, the period with its arrows and a button per
 * filter (spec 14), or on phones a single Filtres button. The row scrolls sideways when
 * it runs out of room, fading at the edge.
 */
export function ListHeader({
  choice,
  filters,
  names,
  total,
  pending,
  search,
  loading,
  onPeriod,
  onFilters,
  onPending,
  onSearch,
}: {
  choice: PeriodChoice
  filters: FilterValues
  names: ListFilters | null
  /** How many rows the list matches, for the sheet's button. */
  total: number | null
  pending: { count: number | null; on: boolean }
  search: string
  loading: boolean
  onPeriod: (choice: PeriodChoice) => void
  onFilters: (values: FilterValues) => void
  onPending: (on: boolean) => void
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
      <div className="-mx-4 -my-1 overflow-x-auto px-4 py-1 [scrollbar-width:none] max-md:[mask-image:linear-gradient(to_right,black_calc(100%-1rem),transparent)] md:mx-0 md:px-0">
        <div className="flex w-max items-center gap-2">
          <PendingButton
            count={pending.count}
            on={pending.on}
            onToggle={onPending}
          />
          <PeriodPicker
            choice={choice}
            disabled={loading}
            onChange={onPeriod}
          />
          <AllFiltersButton
            values={filters}
            onOpen={() => setSheet({ open: true, tab: 'accounts' })}
          />
          <div className="hidden gap-2 md:flex">
            {FILTER_TABS.map((tab) => (
              <FilterButton
                key={tab}
                tab={tab}
                values={filters}
                names={names}
                onOpen={() => setSheet({ open: true, tab })}
              />
            ))}
          </div>
        </div>
      </div>
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
