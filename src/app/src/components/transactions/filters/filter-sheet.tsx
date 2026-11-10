import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FilterList } from '#/components/transactions/filters/filter-lists'
import type { FilterOptions } from '#/components/transactions/filters/filter-lists'
import { SearchField } from '#/components/forms/search-field'
import { TabList } from '#/components/lists/tab-list'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHead,
} from '#/components/ui/sheet'
import { formatCount } from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'
import { getCategories } from '#/server/categories'
import { getEvents } from '#/server/events'
import { getMerchants } from '#/server/merchants'
import { getPeople } from '#/server/people'
import { getFormAccounts } from '#/server/transactions'
import { useToast } from '#/hooks/app/use-toast'
import {
  FILTER_KEYS,
  FILTER_TABS,
} from '#/lib/transactions/transaction-filters'
import type {
  FilterTab,
  FilterValues,
} from '#/lib/transactions/transaction-filters'
import { useFilterLabel } from '#/hooks/transactions/use-filter-label'

function useOptions(open: boolean) {
  const { t } = useTranslation()
  const toast = useToast()
  const [options, setOptions] = useState<FilterOptions | null>(null)
  useEffect(() => {
    if (!open || options) return
    Promise.all([
      getFormAccounts(),
      getCategories(),
      getMerchants(),
      getPeople(),
      getEvents(),
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
  }, [open, options, toast, t])
  return options
}

/** "Voir 128 résultats", or "Voir les résultats" while the count loads. */
function ResultCount({ total }: { total: number | null }) {
  const { t } = useTranslation()
  const locale = useLocale()
  if (total === null) return t('transactions.list.showResults')
  if (total === 0) return t('transactions.list.noResults')
  return t('transactions.list.showCount', {
    count: total,
    shown: formatCount(total, locale),
  })
}

/**
 * Mounted while the sheet is open, so the search starts empty each time. The tabs and
 * the search stay put over the list; the footer clears the open tab or closes, saying how
 * many rows the list now shows.
 */
function FilterPanel({
  tab,
  options,
  values,
  total,
  onTab,
  onChange,
  onClose,
}: {
  tab: FilterTab
  options: FilterOptions | null
  values: FilterValues
  total: number | null
  onTab: (tab: FilterTab) => void
  onChange: (values: FilterValues) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const [query, setQuery] = useState('')
  const labelOf = useFilterLabel(values)
  const key = FILTER_KEYS[tab]
  return (
    <>
      <SheetHead>
        <TabList
          label={t('transactions.list.filters')}
          tabs={FILTER_TABS}
          value={tab}
          labelOf={labelOf}
          panelId={`${id}-panel`}
          idPrefix={id}
          onSelect={(next) => {
            setQuery('')
            onTab(next)
          }}
        />
        <SearchField
          value={query}
          onChange={setQuery}
          label={t(`transactions.list.search.${tab}`)}
        />
      </SheetHead>
      <SheetBody
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-${tab}`}
      >
        {options ? (
          <FilterList
            key={tab}
            tab={tab}
            query={query}
            options={options}
            values={values}
            onChange={onChange}
          />
        ) : (
          <p className="text-muted-foreground">{t('common.loading')}</p>
        )}
      </SheetBody>
      <SheetFooter className="justify-between">
        <Button
          variant="ghost"
          disabled={values[key].length === 0}
          onClick={() => onChange({ ...values, [key]: [] })}
        >
          {t('common.clear')}
        </Button>
        <Button onClick={onClose}>
          <ResultCount total={total} />
        </Button>
      </SheetFooter>
    </>
  )
}

/**
 * The filters' sheet (spec 14, TRX-14), opened on one tab by its button in the row under
 * the search: checkboxes for accounts, categories (a category keeps its sub-categories)
 * merchants or people, several at once. Each tick applies at once. The choices load the first
 * time it opens.
 */
export function FilterSheet({
  open,
  tab,
  values,
  total,
  onOpenChange,
  onTab,
  onChange,
}: {
  open: boolean
  tab: FilterTab
  values: FilterValues
  /** How many rows the list matches; null while the next one loads. */
  total: number | null
  onOpenChange: (open: boolean) => void
  onTab: (tab: FilterTab) => void
  onChange: (values: FilterValues) => void
}) {
  const { t } = useTranslation()
  const options = useOptions(open)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={t('transactions.list.filters')}
        closeLabel={t('common.close')}
      >
        <FilterPanel
          tab={tab}
          options={options}
          values={values}
          total={total}
          onTab={onTab}
          onChange={onChange}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
