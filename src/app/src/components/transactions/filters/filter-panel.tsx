import { useState } from 'react'
import {
  FilterDetail,
  FilterListScreen,
  PeriodScreen,
} from '#/components/transactions/filters/filter-screens'
import { NO_FILTERS } from '#/lib/transactions/transaction-filters'
import type {
  FilterOptions,
  FilterScreen,
  FilterTab,
  FilterValues,
} from '#/lib/transactions/transaction-filters'
import type {
  ListFilters,
  PeriodChoice,
} from '#/lib/transactions/transaction-list'

/**
 * Mounted while the sheet is open, so the search starts empty each time. One screen at a
 * time (ADR-029, ADR-030): `tab` null is the list of filters, the period being on the
 * page's tabs (2026-11-17) and opened here only from their calendar; a filter has its search over its list, and either has a back arrow to the list
 * when the sheet came from it. The footer clears what is shown (the open filter, or all
 * of them in the list) or closes, saying how many rows the list now shows.
 */
export function FilterPanel({
  tabs,
  tab,
  canGoBack,
  options,
  names,
  values,
  period,
  empty,
  onTab,
  onChange,
  onPeriod,
  onClose,
}: {
  tabs: ReadonlyArray<FilterTab>
  tab: FilterScreen | null
  canGoBack: boolean
  options: FilterOptions | null
  names: ListFilters | null
  values: FilterValues
  period: PeriodChoice | null
  empty: ReadonlySet<FilterTab> | null
  onTab: (tab: FilterScreen | null) => void
  onChange: (values: FilterValues) => void
  onPeriod: (choice: PeriodChoice) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const go = (next: FilterScreen | null) => {
    setQuery('')
    onTab(next)
  }
  const back = () => go(null)
  if (tab === 'period' && period)
    return (
      // Opened from the period tabs' calendar only, so it has no way back to the filters.
      <PeriodScreen choice={period} onPeriod={onPeriod} onClose={onClose} />
    )
  if (tab === null || tab === 'period')
    return (
      <FilterListScreen
        {...{ names, period, empty, onClose }}
        screens={tabs}
        values={values}
        onTab={go}
        onClear={() => onChange(NO_FILTERS)}
      />
    )
  return (
    <FilterDetail
      {...{ tab, canGoBack, options, onClose }}
      query={query}
      values={values}
      onQuery={setQuery}
      onChange={onChange}
      onBack={back}
    />
  )
}
