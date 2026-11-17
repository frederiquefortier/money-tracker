import { useTranslation } from 'react-i18next'
import { FilterPanel } from '#/components/transactions/filters/filter-panel'
import { Sheet, SheetContent } from '#/components/ui/sheet'
import { useFilterOptions } from '#/hooks/transactions/use-filter-options'
import { FILTER_TABS } from '#/lib/transactions/transaction-filters'
import type {
  FilterScreen,
  FilterTab,
  FilterValues,
} from '#/lib/transactions/transaction-filters'
import type {
  ListFilters,
  PeriodChoice,
} from '#/lib/transactions/transaction-list'

/**
 * The filters' sheet (TRX-14), opened on one of `tabs` or the period, or on their list: checkboxes for accounts,
 * categories (a category keeps its sub-categories) merchants, people or events, several at
 * once. Each tick applies at once. The choices load the first time it opens.
 */
export function FilterSheet({
  open,
  side = 'right',
  tabs = FILTER_TABS,
  tab,
  canGoBack = tabs.length > 1,
  names = null,
  period = null,
  empty = null,
  values,
  onOpenChange,
  onTab,
  onChange,
  onPeriod = () => {},
}: {
  open: boolean
  /** From the left beside the desktop sidebar. */
  side?: 'right' | 'left'
  tabs?: ReadonlyArray<FilterTab>
  /** The open screen; null shows the list of `tabs`, and the period when there is one. */
  tab: FilterScreen | null
  /** A back arrow to the list; off when a bubble opened the filter itself. */
  canGoBack?: boolean
  /** The ticked ones' names, for the list's summaries. */
  names?: ListFilters | null
  /** The period (ADR-030), shown as the list's first row. */
  period?: PeriodChoice | null
  /** The filters with nothing to choose from; their rows cannot open. */
  empty?: ReadonlySet<FilterTab> | null
  values: FilterValues
  onOpenChange: (open: boolean) => void
  onTab: (tab: FilterScreen | null) => void
  onChange: (values: FilterValues) => void
  onPeriod?: (choice: PeriodChoice) => void
}) {
  const { t } = useTranslation()
  const options = useFilterOptions(open, tabs)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={t('transactions.list.filters')}
        closeLabel={t('common.close')}
        side={side}
      >
        <FilterPanel
          tabs={tabs}
          tab={tab}
          canGoBack={canGoBack}
          options={options}
          names={names}
          period={period}
          empty={empty}
          values={values}
          onTab={onTab}
          onChange={onChange}
          onPeriod={onPeriod}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
