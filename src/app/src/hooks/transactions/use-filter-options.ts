import { useQuery } from '@tanstack/react-query'
import { useFailedToast } from '#/hooks/app/use-failed-toast'
import { getCategories } from '#/server/categories'
import { getEvents } from '#/server/events'
import { getMerchants } from '#/server/merchants'
import { getPeople } from '#/server/people'
import { getFormAccounts } from '#/server/transactions'
import {
  FILTER_TABS,
  withOptionNames,
} from '#/lib/transactions/transaction-filters'
import type {
  FilterOptions,
  FilterTab,
} from '#/lib/transactions/transaction-filters'
import type { ListFilters } from '#/lib/transactions/transaction-list'

async function fetchOptions(
  tabs: ReadonlyArray<FilterTab>,
): Promise<FilterOptions> {
  const has = (tab: FilterTab) => tabs.includes(tab)
  const [accounts, categories, merchants, people, events] = await Promise.all([
    has('accounts') ? getFormAccounts() : [],
    has('categories') ? getCategories() : [],
    has('merchants') ? getMerchants() : [],
    has('people') ? getPeople() : { people: [], groups: [] },
    has('events') ? getEvents() : { events: [], types: [] },
  ])
  return {
    accounts,
    categories,
    merchants,
    ...people,
    events: events.events,
    eventTypes: events.types,
  }
}

/** What `tabs` offer, fetched once `enabled`; null until then. */
export function useFilterOptions(
  enabled: boolean,
  tabs: ReadonlyArray<FilterTab>,
) {
  const query = useQuery({
    queryKey: ['filter-options', tabs.join(',')],
    queryFn: () => fetchOptions(tabs),
    enabled,
  })
  useFailedToast(query.isError)
  return query.data ?? null
}

/** The list's names, and the sheets' cached choices for a tick the list has not named yet. */
export function useFilterNames(names: ListFilters | null) {
  return withOptionNames(names, useFilterOptions(false, FILTER_TABS))
}
