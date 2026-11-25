import { describe, expect, it } from 'vitest'
import { withOptionNames } from '#/lib/transactions/transaction-filters'
import type { FilterOptions } from '#/lib/transactions/transaction-filters'
import type { ListFilters } from '#/lib/transactions/transaction-list'

const none: ListFilters = {
  accounts: [],
  categories: [],
  merchants: [],
  people: [],
  events: [],
}

const options = {
  accounts: [],
  categories: [],
  merchants: [
    { id: 'm1', name: 'Fruiterie Lune' },
    { id: 'm2', name: 'Café Ardoise' },
  ],
  people: [],
  groups: [],
  events: [],
  eventTypes: [],
} as unknown as FilterOptions

describe('withOptionNames', () => {
  it('keeps the list names when the sheet has not loaded', () => {
    expect(withOptionNames(none, null)).toBe(none)
  })

  it('names a tick from the sheet, the list name first', () => {
    const names = {
      ...none,
      merchants: [{ id: 'm1', name: 'Fruiterie Lune (renamed)' }],
    }
    expect(withOptionNames(names, options)?.merchants).toEqual([
      { id: 'm1', name: 'Fruiterie Lune (renamed)' },
      { id: 'm2', name: 'Café Ardoise' },
    ])
  })
})
