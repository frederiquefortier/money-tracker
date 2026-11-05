import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FilterList } from '#/components/transactions/filter-lists'
import type { Options } from '#/components/transactions/filter-lists'
import { SearchField } from '#/components/search-field'
import { TabList } from '#/components/tab-list'
import { useToast } from '#/components/toaster'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHead,
} from '#/components/ui/sheet'
import { formatCount } from '#/lib/format'
import { useLocale } from '#/lib/use-locale'
import { getCategories } from '#/server/categories'
import { getMerchants } from '#/server/merchants'
import { getPeople } from '#/server/people'
import { getFormAccounts } from '#/server/transactions'

export type FilterValues = {
  accountIds: Array<string>
  categoryIds: Array<string>
  merchantIds: Array<string>
  personIds: Array<string>
}

export const FILTER_TABS = [
  'accounts',
  'categories',
  'merchants',
  'people',
] as const
export type FilterTab = (typeof FILTER_TABS)[number]

export const FILTER_KEYS = {
  accounts: 'accountIds',
  categories: 'categoryIds',
  merchants: 'merchantIds',
  people: 'personIds',
} as const satisfies Record<FilterTab, keyof FilterValues>

function useOptions(open: boolean) {
  const { t } = useTranslation()
  const toast = useToast()
  const [options, setOptions] = useState<Options | null>(null)
  useEffect(() => {
    if (!open || options) return
    Promise.all([
      getFormAccounts(),
      getCategories(),
      getMerchants(),
      getPeople(),
    ])
      .then(([accounts, categories, merchants, people]) =>
        setOptions({ accounts, categories, merchants, ...people }),
      )
      .catch(() => toast({ text: t('common.genericError') }))
  }, [open, options, toast, t])
  return options
}

/** The filter's tab label, with how many are ticked in it: "Catégories · 2". */
export function useFilterLabel(values: FilterValues) {
  const { t } = useTranslation()
  return (tab: FilterTab) => {
    const name = t(`transactions.list.${tab}`)
    const count = values[FILTER_KEYS[tab]].length
    return count ? t('transactions.list.filterCount', { name, count }) : name
  }
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
  options: Options | null
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
