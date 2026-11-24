import { describe, expect, it } from 'vitest'
import type { Category } from '#/lib/categories/category'
import type { EventItem } from '#/lib/events/event'
import { eventSummaries } from '#/lib/events/event-calendar'
import { eventParts } from '#/lib/events/event-parts'

const category = (id: string, parentId: string | null = null): Category => ({
  id,
  parentId,
  name: id,
  kind: 'expense',
  icon: 'tag',
  iconIsAuto: false,
  color: '#888888',
  colorIsAuto: false,
  necessity: null,
  history: [],
  periods: [],
})

const event = (id: string, startsOn: string, endsOn: string): EventItem => ({
  id,
  name: id,
  typeId: 'trip',
  startsOn,
  endsOn,
  personIds: [],
  autoLink: true,
  skipCategoryIds: null,
  transactionCount: 0,
})

const categories = [
  category('food'),
  category('restaurants', 'food'),
  category('bars', 'food'),
  category('travel'),
  category('hotel', 'travel'),
]

describe('event parts', () => {
  it('folds leaf totals into their top category, per day, largest first', () => {
    const summaries = eventSummaries(
      [
        event('lisbon', '2026-05-10', '2026-05-13'),
        event('zurich', '2025-01-10', '2025-01-10'),
      ],
      [],
      [],
    )
    const parts = eventParts(
      summaries,
      [
        { eventId: 'lisbon', categoryId: 'restaurants', total: '-120.0000' },
        { eventId: 'lisbon', categoryId: 'bars', total: '-40.0000' },
        { eventId: 'lisbon', categoryId: 'hotel', total: '-400.0000' },
        { eventId: 'zurich', categoryId: 'hotel', total: '-90.0000' },
        { eventId: 'zurich', categoryId: 'restaurants', total: null },
      ],
      categories,
    )
    expect(parts.get('lisbon')).toEqual([
      { categoryId: 'travel', perDay: '100.0000' },
      { categoryId: 'food', perDay: '40.0000' },
    ])
    expect(parts.get('zurich')).toBeNull()
  })
})
