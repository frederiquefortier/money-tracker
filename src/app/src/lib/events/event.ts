import { z } from 'zod'
import { HEX_COLOR } from '#/lib/categories/category'
import { byName } from '#/lib/shared/collections'
import { nameFormSchema } from '#/lib/shared/validation'

// Shared by the Événements screens, the transaction form and the server functions.

export type EventType = {
  id: string
  name: string
  color: string
  /** How many events have this type. */
  eventCount: number
}

export type EventItem = {
  id: string
  name: string
  typeId: string | null
  /** Null leaves the event open at the start. */
  startsOn: string | null
  /** Null makes it one day with a start, open at the end without. */
  endsOn: string | null
  personIds: Array<string>
  /** False keeps the event out of the link by date (EVT-07): only links made by hand. */
  autoLink: boolean
  /** Categories its link by date leaves out; null follows the default list (ADR-056). */
  skipCategoryIds: Array<string> | null
  transactionCount: number
}

/** The event on a transaction: tag and link, as the list and the form read it. */
export type LinkedEvent = {
  id: string
  name: string
  /** Null with no type. */
  color: string | null
  source: EventSource
}

export type EventSource = 'manual' | 'auto'

export const EVENT_TABS = ['events', 'types'] as const
export type EventTab = (typeof EVENT_TABS)[number]

export const EVENT_SORTS = [
  'dateDesc',
  'dateAsc',
  'nameAsc',
  'nameDesc',
] as const
export type EventSort = (typeof EVENT_SORTS)[number]

export const TYPE_SORTS = ['nameAsc', 'nameDesc'] as const
export type TypeSort = (typeof TYPE_SORTS)[number]

/**
 * Soft colours for the types' quick picks, in rainbow order: pale enough that
 * the tag and the badge read as labels. Any other colour stays
 * available through the colour picker.
 */
export const EVENT_SWATCHES = [
  { key: 'rose', hex: '#fda4af' },
  { key: 'coral', hex: '#fdba9c' },
  { key: 'peach', hex: '#fed7aa' },
  { key: 'apricot', hex: '#fcd34d' },
  { key: 'butter', hex: '#fde68a' },
  { key: 'lemon', hex: '#f0f08c' },
  { key: 'lime', hex: '#d9f99d' },
  { key: 'mint', hex: '#a7f3d0' },
  { key: 'sage', hex: '#bbd8b3' },
  { key: 'seafoam', hex: '#99f6e4' },
  { key: 'aqua', hex: '#a5f3fc' },
  { key: 'sky', hex: '#bae6fd' },
  { key: 'periwinkle', hex: '#bfdbfe' },
  { key: 'powder', hex: '#c7d2fe' },
  { key: 'lavender', hex: '#ddd6fe' },
  { key: 'lilac', hex: '#e9d5ff' },
  { key: 'orchid', hex: '#f5d0fe' },
  { key: 'blush', hex: '#fbcfe8' },
  { key: 'sand', hex: '#e7d9c4' },
  { key: 'stone', hex: '#e2e8f0' },
  { key: 'mist', hex: '#cbd5e1' },
] as const
export const DEFAULT_EVENT_COLOR = '#bfdbfe'

export const eventTypeInputSchema = nameFormSchema.extend({
  id: z.uuid().optional(),
  color: z.string().regex(HEX_COLOR),
})

export const eventInputSchema = nameFormSchema
  .extend({
    id: z.uuid().optional(),
    typeId: z.uuid().nullable(),
    startsOn: z.iso.date().nullable(),
    endsOn: z.iso.date().nullable(),
    personIds: z.array(z.uuid()).max(200),
    autoLink: z.boolean(),
    skipCategoryIds: z.array(z.uuid()).max(500).nullable(),
  })
  .refine(
    (e) => e.startsOn === null || e.endsOn === null || e.endsOn >= e.startsOn,
  )

export type EventError = 'nameTaken' | 'notFound' | 'failed'

/** The last day it covers: null when it has no dates at all, so it is never over. */
export const lastDayOf = (event: Pick<EventItem, 'startsOn' | 'endsOn'>) =>
  event.endsOn ?? event.startsOn

/** Past once its last day is before today (EVT-02); with no dates, never. */
export const isPast = (
  event: Pick<EventItem, 'startsOn' | 'endsOn'>,
  today: string,
) => {
  const last = lastDayOf(event)
  return last !== null && last < today
}

export function sortEvents<T extends EventItem>(
  events: ReadonlyArray<T>,
  sort: EventSort,
  locale: string,
): Array<T> {
  if (sort === 'nameAsc' || sort === 'nameDesc') {
    const named = byName(events, locale)
    return sort === 'nameAsc' ? named : named.reverse()
  }
  // Events with no dates go last, whichever way the dates run.
  const dated = events.filter((e) => lastDayOf(e) !== null)
  const open = byName(
    events.filter((e) => lastDayOf(e) === null),
    locale,
  )
  const newest = [...dated].sort(
    (a, b) =>
      (lastDayOf(b) ?? '').localeCompare(lastDayOf(a) ?? '') ||
      (b.startsOn ?? '').localeCompare(a.startsOn ?? '') ||
      a.name.localeCompare(b.name, locale),
  )
  return [...(sort === 'dateDesc' ? newest : newest.reverse()), ...open]
}

/** The event picked for a transaction among the choices, with its type's colour. */
export function linkedEventOf(
  event: Pick<EventItem, 'id' | 'name' | 'typeId'>,
  types: ReadonlyArray<EventType>,
  source: EventSource,
): LinkedEvent {
  const type = types.find((t) => t.id === event.typeId)
  return {
    id: event.id,
    name: event.name,
    color: type?.color ?? null,
    source,
  }
}
