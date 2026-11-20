import { describe, expect, it } from 'vitest'
import type { EventItem } from '#/lib/events/event'
import {
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

  it('compares one type over every year, the costliest first', () => {
    expect(typeComparison(summaries, 'trip').map((s) => s.event.id)).toEqual([
      'lisbon',
      'cabin',
    ])
  })
})
