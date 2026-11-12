import type { Category } from '#/lib/categories/category'
import type { FormHolding } from '#/lib/holdings/holding'
import type { EventItem, EventType } from '#/lib/events/event'
import type { Merchant } from '#/lib/merchants/merchant'
import type { Person, PersonGroup } from '#/lib/people/person'
import type { FormAccount } from '#/lib/transactions/transaction'

// The filters of the transactions list: the tabs and what each one holds.

export type FilterValues = {
  accountIds: Array<string>
  categoryIds: Array<string>
  merchantIds: Array<string>
  personIds: Array<string>
  eventIds: Array<string>
  holdingIds: Array<string>
}

export const NO_FILTERS: FilterValues = {
  accountIds: [],
  categoryIds: [],
  merchantIds: [],
  personIds: [],
  eventIds: [],
  holdingIds: [],
}

export const FILTER_TABS = [
  'accounts',
  'categories',
  'merchants',
  'people',
  'events',
  'holdings',
] as const
export type FilterTab = (typeof FILTER_TABS)[number]

/** What the filters' sheet can show: a filter, or the period (ADR-030). */
export type FilterScreen = FilterTab | 'period'

export const FILTER_KEYS = {
  accounts: 'accountIds',
  categories: 'categoryIds',
  merchants: 'merchantIds',
  people: 'personIds',
  events: 'eventIds',
  holdings: 'holdingIds',
} as const satisfies Record<FilterTab, keyof FilterValues>

/** What each filter can offer. */
export type FilterOptions = {
  accounts: Array<FormAccount>
  categories: Array<Category>
  merchants: Array<Merchant>
  people: Array<Person>
  groups: Array<PersonGroup>
  events: Array<EventItem>
  eventTypes: Array<EventType>
  holdings: Array<FormHolding>
}

type IdSearch = Partial<
  Record<
    'account' | 'category' | 'merchant' | 'person' | 'event' | 'holding',
    Array<string>
  >
>

/** The ticked ids of each filter, none when the filter is not in the address. */
export const idFilters = (search: IdSearch) => ({
  accountIds: search.account ?? [],
  categoryIds: search.category ?? [],
  merchantIds: search.merchant ?? [],
  personIds: search.person ?? [],
  eventIds: search.event ?? [],
  holdingIds: search.holding ?? [],
})
