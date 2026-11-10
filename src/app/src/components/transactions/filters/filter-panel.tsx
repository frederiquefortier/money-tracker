import { useEffect, useRef, useState } from 'react'
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
 * The ticks as the sheet shows them: at once, while the list behind is told once the
 * ticking pauses, and again on closing, so a tick never waits for the list to reload.
 */
function useLocalValues(
  values: FilterValues,
  send: (values: FilterValues) => void,
) {
  const [local, setLocal] = useState(values)
  const pending = useRef<FilterValues | null>(null)
  const latest = useRef(send)
  latest.current = send
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const flush = () => {
    clearTimeout(timer.current)
    if (pending.current) latest.current(pending.current)
    pending.current = null
  }
  useEffect(() => flush, [])
  return [
    local,
    (next: FilterValues) => {
      setLocal(next)
      pending.current = next
      clearTimeout(timer.current)
      timer.current = setTimeout(flush, 400)
    },
  ] as const
}

/**
 * Mounted while the sheet is open, so the search starts empty each time. One screen at a
 * time (ADR-029, ADR-030): `tab` null is the list of filters (and the period, where there
 * is one), a filter has its search over its list, and either has a back arrow to the list
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
  total,
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
  total: number | null
  onTab: (tab: FilterScreen | null) => void
  onChange: (values: FilterValues) => void
  onPeriod: (choice: PeriodChoice) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [local, setLocal] = useLocalValues(values, onChange)
  const go = (next: FilterScreen | null) => {
    setQuery('')
    onTab(next)
  }
  const back = () => go(null)
  if (tab === 'period' && period)
    return (
      <PeriodScreen
        {...{ canGoBack, total, onClose }}
        choice={period}
        onPeriod={onPeriod}
        onBack={back}
      />
    )
  if (tab === null || tab === 'period')
    return (
      <FilterListScreen
        {...{ names, period, empty, total, onClose }}
        screens={period ? ['period', ...tabs] : tabs}
        values={local}
        onTab={go}
        onClear={() => {
          setLocal(NO_FILTERS)
          if (period) onPeriod({ ...period, period: 'all' })
        }}
      />
    )
  return (
    <FilterDetail
      {...{ tab, canGoBack, options, total, onClose }}
      query={query}
      values={local}
      onQuery={setQuery}
      onChange={setLocal}
      onBack={back}
    />
  )
}
