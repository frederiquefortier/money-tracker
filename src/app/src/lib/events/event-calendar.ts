import { EVENT_SORTS, sortEvents } from '#/lib/events/event'
import type { EventItem, EventType } from '#/lib/events/event'
import type { Balance } from '#/lib/people/owed'
import {
  addDays,
  daysIn,
  monthEnd,
  monthOf,
  shiftMonth,
} from '#/lib/shared/months'
import type { DayRange } from '#/lib/shared/months'
import {
  compareDecimal,
  divideRounded,
  fromMinor,
  negateDecimal,
  toMinor,
} from '#/lib/shared/money'

// EVT-04, EVT-05: the events of a period on month grids with what each cost, and the
// events of one type side by side.

const DIGITS = 4

/** An event's total at my share, net (event_totals), signed like a transaction. */
export type EventTotal = {
  eventId: string
  total: string | null
  transactionCount: number
}

/** An event's total in one category at my share, signed like a transaction. */
export type EventCategoryTotal = {
  eventId: string
  categoryId: string
  total: string | null
}

/** What the Événements tab loads with the page. */
export type EventsOverview = {
  events: Array<EventItem>
  types: Array<EventType>
  totals: Array<EventTotal>
  /** EVT-05: each event's total per leaf category (event_category_totals). */
  categoryTotals: Array<EventCategoryTotal>
  people: Array<{ id: string; name: string }>
  /** PPL-05: what each person still owes me today, by person id. */
  balances: Record<string, Balance>
}

export type EventSummary = {
  event: EventItem
  color: string | null
  from: string
  to: string
  days: number
  /** What it cost me, positive; an event that brought money in is negative. Null with a missing rate. */
  spent: string | null
  perDay: string | null
  transactionCount: number
}

function perDayOf(spent: string | null, days: number): string | null {
  if (spent === null) return null
  const minor = toMinor(spent, DIGITS)
  return minor === null
    ? null
    : fromMinor(divideRounded(minor, BigInt(days)), DIGITS)
}

/** Every dated event with its figures. An event with no dates has no place on a calendar. */
export function eventSummaries(
  events: ReadonlyArray<EventItem>,
  types: ReadonlyArray<EventType>,
  totals: ReadonlyArray<EventTotal>,
): Array<EventSummary> {
  const colorOf = new Map(types.map((t) => [t.id, t.color]))
  const totalOf = new Map(totals.map((t) => [t.eventId, t]))
  return events.flatMap((event) => {
    if (event.startsOn === null) return []
    const from = event.startsOn
    const to = event.endsOn ?? event.startsOn
    const days = daysIn(from, to)
    const total = totalOf.get(event.id)
    let spent: string | null = '0'
    if (total) spent = total.total === null ? null : negateDecimal(total.total)
    return [
      {
        event,
        color: event.typeId ? (colorOf.get(event.typeId) ?? null) : null,
        from,
        to,
        days,
        spent,
        perDay: perDayOf(spent, days),
        transactionCount: total?.transactionCount ?? 0,
      },
    ]
  })
}

/** Those overlapping the range, in date order. */
export function summariesIn(
  summaries: ReadonlyArray<EventSummary>,
  range: DayRange,
): Array<EventSummary> {
  return summaries
    .filter((s) => s.from <= range.to && s.to >= range.from)
    .sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to))
}

export function monthsOf(range: DayRange): Array<string> {
  const months: Array<string> = []
  for (
    let month = monthOf(range.from);
    month <= monthOf(range.to);
    month = shiftMonth(month, 1)
  )
    months.push(month)
  return months
}

export function yearsOf(range: DayRange): Array<string> {
  const years: Array<string> = []
  for (
    let year = Number(range.from.slice(0, 4));
    year <= Number(range.to.slice(0, 4));
    year++
  )
    years.push(String(year))
  return years
}

/**
 * A month as weeks of seven days, `firstDay` 1 (Monday) to 7 (Sunday) as Intl gives it;
 * null pads the days outside the month.
 */
export function monthWeeks(
  month: string,
  firstDay: number,
): Array<Array<string | null>> {
  const first = `${month}-01`
  const weekday = new Date(`${first}T00:00:00Z`).getUTCDay() || 7
  const lead = (weekday - firstDay + 7) % 7
  const cells: Array<string | null> = Array.from({ length: lead }, () => null)
  for (let day = first; day <= monthEnd(month); day = addDays(day, 1))
    cells.push(day)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: Array<Array<string | null>> = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/** The events overlapping a month ("2026-03"). */
export function eventsInMonth(
  summaries: ReadonlyArray<EventSummary>,
  month: string,
): Array<EventSummary> {
  return summaries.filter(
    (s) => s.from <= monthEnd(month) && s.to >= `${month}-01`,
  )
}

/** The events on each day, for the tints. */
export function eventsByDay(
  summaries: ReadonlyArray<EventSummary>,
  range: DayRange,
): Map<string, Array<EventSummary>> {
  const out = new Map<string, Array<EventSummary>>()
  for (const summary of summaries) {
    const from = summary.from > range.from ? summary.from : range.from
    const to = summary.to < range.to ? summary.to : range.to
    for (let day = from; day <= to; day = addDays(day, 1)) {
      const list = out.get(day) ?? []
      list.push(summary)
      out.set(day, list)
    }
  }
  return out
}

export type EventTypeComparison = {
  /** The mean cost per day of the type's events that cost something (author, 2026-11-23). */
  usual: string | null
  /** Newest first, so a drift over the years reads down the list. */
  events: Array<EventSummary>
}

const costs = (perDay: string | null): perDay is string =>
  perDay !== null && compareDecimal(perDay, '0') > 0

function meanOf(values: ReadonlyArray<string>): string | null {
  const minors = values
    .map((v) => toMinor(v, DIGITS))
    .filter((v): v is bigint => v !== null)
  if (minors.length === 0) return null
  const sum = minors.reduce((a, b) => a + b, 0n)
  return fromMinor(divideRounded(sum, BigInt(minors.length)), DIGITS)
}

/** The types with two dated events or more: one event has nothing to compare with. */
export function comparableTypes(
  summaries: ReadonlyArray<EventSummary>,
  types: ReadonlyArray<EventType>,
): Array<EventType> {
  return types.filter(
    (type) => summaries.filter((s) => s.event.typeId === type.id).length > 1,
  )
}

/** EVT-05: one type's events over every year and their mean cost per day. */
export function typeComparison(
  summaries: ReadonlyArray<EventSummary>,
  typeId: string,
): EventTypeComparison {
  const ofType = summaries
    .filter((s) => s.event.typeId === typeId)
    .sort((a, b) => b.from.localeCompare(a.from) || b.to.localeCompare(a.to))
  return {
    usual: meanOf(ofType.map((s) => s.perDay).filter(costs)),
    events: ofType,
  }
}

/** The event list's orders, plus the cost per day. */
export const COMPARE_SORTS = [
  ...EVENT_SORTS,
  'amountDesc',
  'amountAsc',
] as const
export type CompareSort = (typeof COMPARE_SORTS)[number]

/** The compared events in the chosen order; an event without a figure goes last. */
export function sortCompared(
  compared: ReadonlyArray<EventSummary>,
  sort: CompareSort,
  locale: string,
): Array<EventSummary> {
  if (sort === 'amountDesc' || sort === 'amountAsc') {
    const sign = sort === 'amountDesc' ? -1 : 1
    return [...compared].sort((a, b) => {
      const [x, y] = [a.perDay, b.perDay]
      if (x === null || y === null)
        return (x === null ? 1 : 0) - (y === null ? 1 : 0)
      return sign * compareDecimal(x, y)
    })
  }
  const byId = new Map(compared.map((c) => [c.event.id, c]))
  return sortEvents(
    compared.map((c) => c.event),
    sort,
    locale,
  ).flatMap((event) => byId.get(event.id) ?? [])
}
