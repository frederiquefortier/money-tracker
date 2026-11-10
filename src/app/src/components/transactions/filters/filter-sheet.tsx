import { useEffect, useId, useRef, useState } from 'react'
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

function FilterFooter({
  cleared,
  total,
  onClear,
  onClose,
}: {
  cleared: boolean
  total: number | null
  onClear: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  return (
    <SheetFooter className="justify-between">
      <Button variant="ghost" disabled={cleared} onClick={onClear}>
        {t('common.clear')}
      </Button>
      <Button onClick={onClose}>
        <ResultCount total={total} />
      </Button>
    </SheetFooter>
  )
}

/**
 * Mounted while the sheet is open, so the search starts empty each time. The tabs and
 * the search stay put over the list; the footer clears the open tab or closes, saying how
 * many rows the list now shows. With one tab, there is no tab row.
 */
function FilterPanel({
  tabs,
  tab,
  options,
  values,
  total,
  onTab,
  onChange,
  onClose,
}: {
  tabs: ReadonlyArray<FilterTab>
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
  const [local, setLocal] = useLocalValues(values, onChange)
  const key = FILTER_KEYS[tab]
  return (
    <>
      <SheetHead>
        {tabs.length > 1 && (
          <TabList
            label={t('transactions.list.filters')}
            tabs={tabs}
            value={tab}
            labelOf={(next) => t(`transactions.list.${next}`)}
            count={(next) => local[FILTER_KEYS[next]].length}
            wrap
            panelId={`${id}-panel`}
            idPrefix={id}
            onSelect={(next) => {
              setQuery('')
              onTab(next)
            }}
          />
        )}
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
            values={local}
            onChange={setLocal}
          />
        ) : (
          <p className="text-muted-foreground">{t('common.loading')}</p>
        )}
      </SheetBody>
      <FilterFooter
        cleared={local[key].length === 0}
        total={total}
        onClear={() => setLocal({ ...local, [key]: [] })}
        onClose={onClose}
      />
    </>
  )
}

/**
 * The filters' sheet (spec 14, TRX-14), opened on one of `tabs`: checkboxes for accounts,
 * categories (a category keeps its sub-categories) merchants, people or events, several at
 * once. Each tick applies at once. The choices load the first time it opens.
 */
export function FilterSheet({
  open,
  tabs = FILTER_TABS,
  tab,
  values,
  total,
  onOpenChange,
  onTab,
  onChange,
}: {
  open: boolean
  tabs?: ReadonlyArray<FilterTab>
  tab: FilterTab
  values: FilterValues
  /** How many rows the list matches; null while the next one loads. */
  total: number | null
  onOpenChange: (open: boolean) => void
  onTab: (tab: FilterTab) => void
  onChange: (values: FilterValues) => void
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
