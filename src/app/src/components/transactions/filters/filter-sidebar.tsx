import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FilterRoot } from '#/components/transactions/filters/filter-root'
import { FilterSheet } from '#/components/transactions/filters/filter-sheet'
import { Button } from '#/components/ui/button'
import { useEmptyFilters } from '#/hooks/transactions/use-empty-filters'
import {
  FILTER_KEYS,
  FILTER_TABS,
  NO_FILTERS,
} from '#/lib/transactions/transaction-filters'
import type {
  FilterScreen,
  FilterValues,
} from '#/lib/transactions/transaction-filters'
import type {
  ListFilters,
  PeriodChoice,
} from '#/lib/transactions/transaction-list'
import { cn } from '#/lib/utils'

const SCREENS: ReadonlyArray<FilterScreen> = ['period', ...FILTER_TABS]

/**
 * The filters beside the list from `lg` up (2026-11-16): the phone's first level, each
 * filter with what is chosen, always in view. A row opens the sheet from the left on that
 * filter alone, where the long lists have their search.
 */
export function FilterSidebar({
  values,
  names,
  period,
  total,
  onChange,
  onPeriod,
  className,
}: {
  values: FilterValues
  names: ListFilters | null
  period: PeriodChoice
  /** How many rows the list matches, for the sheet's button; null while it loads. */
  total: number | null
  onChange: (values: FilterValues) => void
  onPeriod: (choice: PeriodChoice) => void
  className?: string
}) {
  const { t } = useTranslation()
  const empty = useEmptyFilters()
  const [sheet, setSheet] = useState<{ open: boolean; tab: FilterScreen }>({
    open: false,
    tab: 'period',
  })
  const nothing =
    period.period === 'all' &&
    FILTER_TABS.every((tab) => values[FILTER_KEYS[tab]].length === 0)
  return (
    <aside className={cn('flex flex-col gap-2', className)}>
      <div className="flex min-h-9 items-center justify-between gap-2">
        <h2 className="font-semibold">{t('transactions.list.filters')}</h2>
        <Button
          variant="ghost"
          size="sm"
          disabled={nothing}
          onClick={() => {
            onChange(NO_FILTERS)
            onPeriod({ ...period, period: 'all' })
          }}
        >
          {t('transactions.list.clearAll')}
        </Button>
      </div>
      <FilterRoot
        screens={SCREENS}
        values={values}
        names={names}
        period={period}
        empty={empty}
        onTab={(tab) => setSheet({ open: true, tab })}
      />
      <FilterSheet
        open={sheet.open}
        side="left"
        tab={sheet.tab}
        canGoBack={false}
        names={names}
        period={period}
        empty={empty}
        values={values}
        total={total}
        onOpenChange={(open) => setSheet({ ...sheet, open })}
        onTab={(tab) => tab && setSheet({ ...sheet, tab })}
        onChange={onChange}
        onPeriod={onPeriod}
      />
    </aside>
  )
}
