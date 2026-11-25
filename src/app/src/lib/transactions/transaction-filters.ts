import type { Category } from '#/lib/categories/category'
import type { EventItem, EventType } from '#/lib/events/event'
import type { Merchant } from '#/lib/merchants/merchant'
import type { Person, PersonGroup } from '#/lib/people/person'
import type { FormAccount } from '#/lib/transactions/transaction'
import type { ListFilters } from '#/lib/transactions/transaction-list'

// The filters of the transactions list: the tabs and what each one holds.

/** The kinds the list can be narrowed to; an adjustment is in none of them. */
export const FILTER_KINDS = ['expense', 'income', 'transfer'] as const
export type FilterKind = (typeof FILTER_KINDS)[number]

export type FilterValues = {
  kinds: Array<FilterKind>
  accountIds: Array<string>
  categoryIds: Array<string>
  merchantIds: Array<string>
  personIds: Array<string>
  eventIds: Array<string>
}

export const NO_FILTERS: FilterValues = {
  kinds: [],
  accountIds: [],
  categoryIds: [],
  merchantIds: [],
  personIds: [],
  eventIds: [],
}

export const FILTER_TABS = [
  'kinds',
  'accounts',
  'categories',
  'merchants',
  'people',
  'events',
] as const
export type FilterTab = (typeof FILTER_TABS)[number]

/** What the filters' sheet can show: a filter, or the period (ADR-030). */
export type FilterScreen = FilterTab | 'period'

export const FILTER_KEYS = {
  kinds: 'kinds',
  accounts: 'accountIds',
  categories: 'categoryIds',
  merchants: 'merchantIds',
  people: 'personIds',
  events: 'eventIds',
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
}

type IdSearch = Partial<
  Record<
    'account' | 'category' | 'merchant' | 'person' | 'event',
    Array<string>
  > & { kind: Array<FilterKind> }
>

/** The ticked ids of each filter, none when the filter is not in the address. */
export const idFilters = (search: IdSearch) => ({
  kinds: search.kind ?? [],
  accountIds: search.account ?? [],
  categoryIds: search.category ?? [],
  merchantIds: search.merchant ?? [],
  personIds: search.person ?? [],
  eventIds: search.event ?? [],
})

/**
 * The chips' names: the list's, then the sheet's choices for what was ticked since the
 * list last loaded, so a new chip shows before the reload.
 */
export function withOptionNames(
  names: ListFilters | null,
  options: FilterOptions | null,
): ListFilters | null {
  if (!options) return names
  const add = <T extends { id: string }>(
    known: Array<T> | undefined,
    more: Array<T>,
  ): Array<T> => {
    const ids = new Set((known ?? []).map((one) => one.id))
    return [...(known ?? []), ...more.filter((one) => !ids.has(one.id))]
  }
  return {
    accounts: add(names?.accounts, options.accounts),
    categories: add(names?.categories, options.categories),
    merchants: add(names?.merchants, options.merchants),
    people: add(names?.people, options.people),
    events: add(names?.events, options.events),
  }
}
