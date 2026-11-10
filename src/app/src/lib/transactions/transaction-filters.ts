// The filters of the transactions list (spec 14): the tabs and what each one holds.

export type FilterValues = {
  accountIds: Array<string>
  categoryIds: Array<string>
  merchantIds: Array<string>
  personIds: Array<string>
  eventIds: Array<string>
}

export const NO_FILTERS: FilterValues = {
  accountIds: [],
  categoryIds: [],
  merchantIds: [],
  personIds: [],
  eventIds: [],
}

export const FILTER_TABS = [
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
  accounts: 'accountIds',
  categories: 'categoryIds',
  merchants: 'merchantIds',
  people: 'personIds',
  events: 'eventIds',
} as const satisfies Record<FilterTab, keyof FilterValues>
