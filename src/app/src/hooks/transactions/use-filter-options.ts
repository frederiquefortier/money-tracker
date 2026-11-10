import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '#/hooks/app/use-toast'
import { getCategories } from '#/server/categories'
import { getEvents } from '#/server/events'
import { getMerchants } from '#/server/merchants'
import { getPeople } from '#/server/people'
import { getFormAccounts } from '#/server/transactions'
import type {
  FilterOptions,
  FilterTab,
} from '#/lib/transactions/transaction-filters'

/** Fetches what `tabs` offer once `enabled`, and keeps it. */
export function useFilterOptions(
  enabled: boolean,
  tabs: ReadonlyArray<FilterTab>,
) {
  const { t } = useTranslation()
  const toast = useToast()
  const [options, setOptions] = useState<FilterOptions | null>(null)
  useEffect(() => {
    if (!enabled || options) return
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
  }, [enabled, options, tabs, toast, t])
  return options
}
