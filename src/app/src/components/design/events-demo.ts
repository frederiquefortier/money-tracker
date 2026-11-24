import { demoDays } from '#/components/design/dashboard-demo'
import type { YearActivity } from '#/lib/dashboard/year-activity'
import type { EventItem } from '#/lib/events/event'
import type { EventsOverview } from '#/lib/events/event-calendar'

// Invented events, people and transactions for the Événements gallery section.

const PEOPLE = [
  { id: 'alex', name: 'Alex' },
  { id: 'robin', name: 'Robin' },
  { id: 'sasha', name: 'Sasha' },
  { id: 'noa', name: 'Noa' },
]

const TYPES = [
  { id: 'trip', name: 'Voyage', color: '#2f7fd8', eventCount: 10 },
  { id: 'party', name: 'Fête', color: '#d8572f', eventCount: 2 },
  { id: 'outing', name: 'Sortie', color: '#8a5cd6', eventCount: 2 },
]

const event = (
  [id, name, typeId]: [string, string, string],
  [startsOn, endsOn]: [string, string],
  personIds: Array<string>,
): EventItem => ({
  id,
  name,
  typeId,
  startsOn,
  endsOn,
  personIds,
  autoLink: true,
  skipCategoryIds: null,
  transactionCount: 6,
})

// Older trips, so Comparer has a history to set this year's against.
const PAST_TRIPS: Array<[string, string, number, number]> = [
  ['islands', 'Island hopping', 2, 9],
  ['ski', 'Ski weekend', 2, 2],
  ['north', 'Northern lights', 3, 6],
  ['vineyard', 'Vineyard tour', 4, 3],
  ['desert', 'Desert road', 5, 7],
  ['family', 'Family visit', 5, 4],
  ['harbour', 'Harbour town', 6, 2],
]

function events(year: string): Array<EventItem> {
  const last = String(Number(year) - 1)
  const past = PAST_TRIPS.map(([id, name, back, days], i) => {
    const start = `${Number(year) - back}-0${(i % 9) + 1}-05`
    return event(
      [id, name, 'trip'],
      [start, start.slice(0, 8) + String(4 + days).padStart(2, '0')],
      ['alex'],
    )
  })
  return [
    ...past,
    event(
      ['coast', 'Road trip coast', 'trip'],
      [`${last}-08-02`, `${last}-08-09`],
      ['alex', 'robin'],
    ),
    event(
      ['lake', 'Lake cabin', 'trip'],
      [`${year}-02-14`, `${year}-02-16`],
      ['alex'],
    ),
    event(
      ['city', 'City break', 'trip'],
      [`${year}-05-10`, `${year}-05-17`],
      ['alex', 'sasha'],
    ),
    event(
      ['bday', 'Robin’s birthday', 'party'],
      [`${year}-05-14`, `${year}-05-14`],
      ['robin', 'alex', 'noa'],
    ),
    event(
      ['nye', 'New Year', 'party'],
      [`${last}-12-31`, `${year}-01-01`],
      ['sasha', 'noa'],
    ),
    event(
      ['concert', 'Concert', 'outing'],
      [`${year}-03-21`, `${year}-03-21`],
      ['sasha'],
    ),
    event(
      ['museum', 'Museum day', 'outing'],
      [`${year}-06-07`, `${year}-06-07`],
      ['noa', 'alex'],
    ),
  ]
}

const TOTALS: Record<string, string> = {
  coast: '-1480.0000',
  lake: '-390.0000',
  city: '-2210.0000',
  bday: '-160.0000',
  nye: '-240.0000',
  concert: '-95.0000',
  museum: '-48.0000',
  islands: '-1850.0000',
  ski: '-520.0000',
  north: '-1610.0000',
  vineyard: '-430.0000',
  desert: '-1290.0000',
  family: '-310.0000',
  harbour: '-260.0000',
}

// Each invented event's total cut over the demo's categories (dashboard-demo), in shares
// that vary by event so the stacked columns differ.
const SHARES: Array<[string, number]> = [
  ['travel', 0.45],
  ['restaurants', 0.3],
  ['transport', 0.15],
  ['outings', 0.1],
]

function demoParts(eventId: string, total: string) {
  const shift = (eventId.length % 4) * 0.05
  return SHARES.map(([categoryId, share], i) => ({
    eventId,
    categoryId,
    total: (
      Number(total) * (i === 0 ? share - shift : share + shift / 3)
    ).toFixed(4),
  }))
}

export function demoEventsOverview(today: string): EventsOverview {
  const list = events(today.slice(0, 4))
  return {
    events: list,
    types: TYPES,
    totals: list.map((e) => ({
      eventId: e.id,
      total: TOTALS[e.id] ?? '0',
      transactionCount: 6,
    })),
    categoryTotals: list.flatMap((e) => demoParts(e.id, TOTALS[e.id] ?? '0')),
    people: PEOPLE,
    balances: {
      robin: { amounts: [{ amount: '42.5000', currency: 'CAD' }], unknown: 0 },
      sasha: { amounts: [], unknown: 1 },
    },
  }
}

const MERCHANTS = ['grocer', 'bakery', 'fuel', 'books', null]
const CATEGORIES = ['groceries', 'restaurants', 'transport', 'outings']

/** A year's days as on Argent, each cut into one to four invented transactions. */
export function demoActivity(year: string, today: string): YearActivity {
  const days = demoDays(year, today)
  const transactions = days.flatMap((day, i) => {
    const count = 1 + (i % 4)
    const total = Number(day.spent ?? 0)
    return Array.from({ length: count }, (_, k) => ({
      id: `${day.day}-${k}`,
      day: day.day,
      kind: 'expense' as const,
      merchantId: MERCHANTS[(i + k) % MERCHANTS.length] ?? null,
      categoryId: CATEGORIES[(i * 3 + k) % CATEGORIES.length] ?? null,
      eventId: null,
      amount: (-(total * (k === 0 ? 0.5 : 0.5 / (count - 1)))).toFixed(4),
      personIds: (i + k) % 5 === 0 ? [PEOPLE[(i + k) % PEOPLE.length].id] : [],
    }))
  })
  return { days, transactions }
}
