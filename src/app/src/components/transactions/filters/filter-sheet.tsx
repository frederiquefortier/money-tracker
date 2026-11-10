import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { FilterOptions } from '#/components/transactions/filters/filter-lists'
import { FilterPanel } from '#/components/transactions/filters/filter-panel'
import { Sheet, SheetContent } from '#/components/ui/sheet'
import { getCategories } from '#/server/categories'
import { getEvents } from '#/server/events'
import { getMerchants } from '#/server/merchants'
import { getPeople } from '#/server/people'
import { getFormAccounts } from '#/server/transactions'
import { useToast } from '#/hooks/app/use-toast'
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

/** Only what the open tabs need is fetched. */
function useOptions(open: boolean, tabs: ReadonlyArray<FilterTab>) {
  const { t } = useTranslation()
  const toast = useToast()
  const [options, setOptions] = useState<FilterOptions | null>(null)
  useEffect(() => {
    if (!open || options) return
    const has = (tab: FilterTab) => tabs.includes(tab)
    Promise.all([
      has('accounts') ? getFormAccounts() : [],
      has('categories') ? getCategories() : [],
      has('merchants') ? getMerchants() : [],
      has('people') ? getPeople() : { people: [], groups: [] },
      has('events') ? getEvents() : { events: [], types: [] },
    ])
      .then(([accounts, categories, merchants, people, events]) =>
        setOptions({
          accounts,
          categories,
          merchants,
          ...people,
          events: events.events,
          eventTypes: events.types,
        }),
      )
      .catch(() => toast({ text: t('common.genericError') }))
  }, [open, options, tabs, toast, t])
  return options
}

/**
 * The filters' sheet (spec 14, TRX-14), opened on one of `tabs` or the period, or on their list: checkboxes for accounts,
 * categories (a category keeps its sub-categories) merchants, people or events, several at
 * once. Each tick applies at once. The choices load the first time it opens.
 */
export function FilterSheet({
  open,
  tabs = FILTER_TABS,
  tab,
  canGoBack = tabs.length > 1,
  names = null,
  period = null,
  values,
  total,
  onOpenChange,
  onTab,
  onChange,
  onPeriod = () => {},
}: {
  open: boolean
  tabs?: ReadonlyArray<FilterTab>
  /** The open screen; null shows the list of `tabs`, and the period when there is one. */
  tab: FilterScreen | null
  /** A back arrow to the list; off when a bubble opened the filter itself. */
  canGoBack?: boolean
  /** The ticked ones' names, for the list's summaries. */
  names?: ListFilters | null
  /** The period (ADR-030), shown as the list's first row. */
  period?: PeriodChoice | null
  values: FilterValues
  /** How many rows the list matches; null while the next one loads. */
  total: number | null
  onOpenChange: (open: boolean) => void
  onTab: (tab: FilterScreen | null) => void
  onChange: (values: FilterValues) => void
  onPeriod?: (choice: PeriodChoice) => void
}) {
  const { t } = useTranslation()
  const options = useOptions(open, tabs)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={t('transactions.list.filters')}
        closeLabel={t('common.close')}
      >
        <FilterPanel
          tabs={tabs}
          tab={tab}
          canGoBack={canGoBack}
          options={options}
          names={names}
          period={period}
          values={values}
          total={total}
          onTab={onTab}
          onChange={onChange}
          onPeriod={onPeriod}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
