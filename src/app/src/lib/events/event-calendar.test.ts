import { describe, expect, it } from 'vitest'
import type { EventItem } from '#/lib/events/event'
import {
  comparableTypes,
  sortCompared,
  eventSummaries,
  eventsByDay,
  monthWeeks,
  monthsOf,
  summariesIn,
  typeComparison,
} from '#/lib/events/event-calendar'

const event = (
  id: string,
  [startsOn, endsOn]: [string | null, string | null],
  typeId: string | null = 'trip',
): EventItem => ({
  id,
  name: id,
  typeId,
  startsOn,
  endsOn,
  personIds: [],
  autoLink: true,
  skipCategoryIds: null,
  transactionCount: 0,
})

const events = [
  event('lisbon', ['2026-05-10', '2026-05-14']),
  event('party', ['2026-05-12', null], 'party'),
  event('cabin', ['2025-12-30', '2026-01-02']),
  event('undated', [null, null]),
]
const types = [
  { id: 'trip', name: 'Voyage', color: '#2255aa', eventCount: 2 },
  { id: 'party', name: 'Fête', color: '#aa3322', eventCount: 1 },
]
const summaries = eventSummaries(events, types, [
  { eventId: 'lisbon', total: '-1000.0000', transactionCount: 12 },
  { eventId: 'cabin', total: null, transactionCount: 3 },
])

describe('event calendar', () => {
  it('leaves undated events off and counts what each cost, per day', () => {
    expect(summaries.map((s) => s.event.id)).toEqual([
      'lisbon',
      'party',
      'cabin',
    ])
    expect(summaries[0]).toMatchObject({
      days: 5,
      spent: '1000.0000',
      perDay: '200.0000',
      color: '#2255aa',
    })
    expect(summaries[1]).toMatchObject({
      days: 1,
      spent: '0',
      transactionCount: 0,
    })
    expect(summaries[2]).toMatchObject({ spent: null, perDay: null })
  })

  it('keeps the events overlapping a range, in date order', () => {
    expect(
      summariesIn(summaries, { from: '2026-01-01', to: '2026-12-31' }).map(
        (s) => s.event.id,
      ),
    ).toEqual(['cabin', 'lisbon', 'party'])
  })

  it('tints each day of an event inside the range', () => {
    const days = eventsByDay(summaries, {
      from: '2026-01-01',
      to: '2026-12-31',
    })
    expect(days.get('2026-05-12')?.map((s) => s.event.id)).toEqual([
      'lisbon',
      'party',
    ])
    expect(days.has('2025-12-31')).toBe(false)
    expect(days.has('2026-01-02')).toBe(true)
  })

  it('lists the months of a range and lays a month out in weeks', () => {
    expect(monthsOf({ from: '2025-11-19', to: '2026-02-03' })).toEqual([
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
    ])
    // November 2026 starts on a Sunday.
    expect(monthWeeks('2026-11', 7)[0][0]).toBe('2026-11-01')
    expect(monthWeeks('2026-11', 1)[0].slice(5)).toEqual([null, '2026-11-01'])
    expect(monthWeeks('2026-11', 1).flat().filter(Boolean)).toHaveLength(30)
  })
})

describe('type comparison', () => {
  it('compares one type over every year, newest first, with its mean per day', () => {
    const trips = [
      event('a', ['2023-03-01', '2023-03-04']),
      event('b', ['2024-06-01', '2024-06-02']),
      event('c', ['2025-07-01', '2025-07-01']),
      event('d', ['2026-01-10', '2026-01-10']),
      event('e', ['2026-02-01', '2026-02-01']),
    ]
    const compared = typeComparison(
      eventSummaries(trips, types, [
        { eventId: 'a', total: '-400.0000', transactionCount: 4 }, // 100 a day
        { eventId: 'b', total: '-300.0000', transactionCount: 2 }, // 150 a day
        { eventId: 'c', total: '-200.0000', transactionCount: 1 },
        { eventId: 'd', total: null, transactionCount: 1 },
        { eventId: 'e', total: '50.0000', transactionCount: 1 }, // brought money in
      ]),
      'trip',
    )
    expect(compared.events.map((c) => c.event.id)).toEqual([
      'e',
      'd',
      'c',
      'b',
      'a',
    ])
    expect(compared.usual).toBe('150.0000')
  })

  it('compares only the types with two dated events or more', () => {
    expect(comparableTypes(summaries, types).map((t) => t.id)).toEqual(['trip'])
  })

  it('sorts by cost per day, an event without a figure last', () => {
    const trips = [
      event('a', ['2023-03-01', '2023-03-04']),
      event('b', ['2024-06-01', '2024-06-01']),
      event('c', ['2025-07-01', '2025-07-01']),
    ]
    const compared = typeComparison(
      eventSummaries(trips, types, [
        { eventId: 'a', total: '-400.0000', transactionCount: 4 },
        { eventId: 'b', total: null, transactionCount: 1 },
        { eventId: 'c', total: '-200.0000', transactionCount: 1 },
      ]),
      'trip',
    ).events
    const ids = (sort: Parameters<typeof sortCompared>[1]) =>
      sortCompared(compared, sort, 'fr-CA').map((c) => c.event.id)
    expect(ids('amountDesc')).toEqual(['c', 'a', 'b'])
    expect(ids('amountAsc')).toEqual(['a', 'c', 'b'])
    expect(ids('dateAsc')).toEqual(['a', 'b', 'c'])
  })
})
