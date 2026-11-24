import { describe, expect, it } from 'vitest'
import type { CategoryKind } from '#/lib/categories/category'
import type { EventItem } from '#/lib/events/event'
import { eventSummaries } from '#/lib/events/event-calendar'
import {
  eventLanes,
  eventsWith,
  spentWith,
  topDays,
  transactionsByDay,
  yearActivity,
} from '#/lib/dashboard/year-activity'
import type { ActivityLine } from '#/lib/dashboard/year-activity'

const kindOf = new Map<string, CategoryKind>([
  ['food', 'expense'],
  ['fun', 'expense'],
  ['pay', 'income'],
])

const line = ([
  transactionId,
  occurredOn,
  categoryId,
  amount,
  kind = 'expense',
]: [string, string, string, string | null, string?]): ActivityLine => ({
  transactionId,
  occurredOn,
  kind,
  categoryId,
  eventId: null,
  amount,
})

const activity = yearActivity(
  [
    line(['a', '2026-03-02', 'food', '-10.0000']),
    line(['a', '2026-03-02', 'fun', '-30.0000']),
    line(['b', '2026-03-02', 'food', '-5.0000']),
    line(['c', '2026-03-04', 'food', null]),
    line(['d', '2026-03-05', 'pay', '100.0000', 'income']),
    line(['e', '2026-03-06', 'fun', '-80.0000']),
  ],
  [
    { id: 'a', merchantId: 'bistro', personIds: ['sam', 'lou'] },
    { id: 'b', merchantId: null, personIds: ['sam'] },
    { id: 'c', merchantId: null, personIds: ['lou'] },
    { id: 'e', merchantId: null, personIds: ['kim'] },
  ],
  kindOf,
)

describe('year activity', () => {
  it('sums each transaction and names it by its largest split', () => {
    const a = activity.transactions.find((t) => t.id === 'a')
    expect(a).toMatchObject({
      amount: '-40.0000',
      categoryId: 'fun',
      merchantId: 'bistro',
      personIds: ['sam', 'lou'],
    })
    expect(activity.transactions.find((t) => t.id === 'c')?.amount).toBeNull()
  })

  it('totals the days from expense categories only', () => {
    expect(activity.days).toEqual([
      { day: '2026-03-02', spent: '45.0000' },
      { day: '2026-03-04', spent: null },
      { day: '2026-03-06', spent: '80.0000' },
    ])
  })

  it('lists a day largest first', () => {
    expect(
      transactionsByDay(activity.transactions)
        .get('2026-03-02')
        ?.map((t) => t.id),
    ).toEqual(['a', 'b'])
  })

  it('ranks the costliest days, leaving a missing rate out', () => {
    expect(topDays(activity.days, 2).map((d) => d.day)).toEqual([
      '2026-03-06',
      '2026-03-02',
    ])
  })

  it('counts what each person cost me, never on a partial sum', () => {
    expect(spentWith(activity.transactions)).toEqual([
      { personId: 'kim', spent: '80.0000', count: 1 },
      { personId: 'sam', spent: '45.0000', count: 2 },
    ])
  })
})

const event = ([id, startsOn, endsOn, personIds]: [
  string,
  string,
  string,
  Array<string>,
]): EventItem => ({
  id,
  name: id,
  typeId: null,
  startsOn,
  endsOn,
  personIds,
  autoLink: true,
  skipCategoryIds: null,
  transactionCount: 0,
})

const summaries = eventSummaries(
  [
    event(['trip', '2026-05-10', '2026-05-14', ['sam', 'lou']]),
    event(['party', '2026-05-12', '2026-05-12', ['sam']]),
    event(['dinner', '2026-05-15', '2026-05-15', []]),
  ],
  [],
  [],
)

describe('events with people', () => {
  it('counts the events each person was on', () => {
    expect(eventsWith(summaries)).toEqual([
      { personId: 'sam', count: 2 },
      { personId: 'lou', count: 1 },
    ])
  })

  it('gives overlapping events their own lane and reuses a free one', () => {
    expect(Object.fromEntries(eventLanes(summaries))).toEqual({
      trip: 0,
      party: 1,
      dinner: 0,
    })
  })
})
