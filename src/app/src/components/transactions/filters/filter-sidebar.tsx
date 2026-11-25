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

/**
 * The filters beside the list from `lg` up: each filter by name, with how
 * many are chosen (the chips name them), always in view, without a heading of its own.
 * A row opens the sheet from the left on that filter alone, where the long
 * lists have their search. The period is on the list's tabs.
 */
export function FilterSidebar({
  values,
  names,
  period,
  onChange,
  onPeriod,
  className,
}: {
  values: FilterValues
  names: ListFilters | null
  period: PeriodChoice
  onChange: (values: FilterValues) => void
  onPeriod: (choice: PeriodChoice) => void
  className?: string
}) {
  const { t } = useTranslation()
  const empty = useEmptyFilters()
  const [sheet, setSheet] = useState<{ open: boolean; tab: FilterScreen }>({
    open: false,
    tab: 'kinds',
  })
  const chosen = FILTER_TABS.some((tab) => values[FILTER_KEYS[tab]].length > 0)
  return (
    <aside
      aria-label={t('transactions.list.filters')}
      className={cn('flex flex-col gap-2', className)}
    >
      <FilterRoot
        screens={FILTER_TABS}
        values={values}
        names={names}
        period={period}
        empty={empty}
        countOnly
        onTab={(tab) => setSheet({ open: true, tab })}
      />
      {chosen && (
        <Button
          variant="ghost"
          size="sm"
          className="self-end"
          onClick={() => onChange(NO_FILTERS)}
        >
          {t('transactions.list.clearAll')}
        </Button>
      )}
      <FilterSheet
        open={sheet.open}
        side="left"
        tab={sheet.tab}
        canGoBack={false}
        names={names}
        period={period}
        empty={empty}
        values={values}
        onOpenChange={(open) => setSheet({ ...sheet, open })}
        onTab={(tab) => tab && setSheet({ ...sheet, tab })}
        onChange={onChange}
        onPeriod={onPeriod}
      />
    </aside>
  )
}
