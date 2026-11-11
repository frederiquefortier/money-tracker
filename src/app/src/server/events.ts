import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { deleteRow, loaded } from '#/lib/server/db.server'
import { eventInputSchema, eventTypeInputSchema } from '#/lib/events/event'
import type { EventError, EventItem, EventType } from '#/lib/events/event'
import { failureFor } from '#/lib/shared/result'
import type { Result } from '#/lib/shared/result'
import { idInput } from '#/lib/shared/validation'
import { getSupabase } from '#/lib/server/supabase.server'

type EventResult<T = object> = Result<EventError, T>

const KNOWN: Partial<Record<string, EventError>> = {
  '23505': 'nameTaken',
  // save_event, save_event_type and delete_event raise it for a row the user cannot see.
  P0002: 'notFound',
  // A person or type of another user.
  '23503': 'notFound',
}

const failure = failureFor('events', KNOWN)

/** Events and types with their people and counts (spec 22). */
export const getEvents = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ events: Array<EventItem>; types: Array<EventType> }> => {
    const supabase = getSupabase()
    const [events, types, people, usage] = loaded(
      'Events',
      ...(await Promise.all([
        supabase.from('events').select('id, name, type_id, starts_on, ends_on, auto_link'),
        supabase.from('event_types').select('id, name, color'),
        supabase.from('event_people').select('event_id, person_id'),
        supabase.from('event_usage').select('event_id, transaction_count'),
      ])),
    )
    return {
      events: events.map((e) => ({
        id: e.id,
        name: e.name,
        typeId: e.type_id,
        startsOn: e.starts_on,
        endsOn: e.ends_on,
        autoLink: e.auto_link,
        personIds: people
          .filter((p) => p.event_id === e.id)
          .map((p) => p.person_id),
        transactionCount:
          usage.find((u) => u.event_id === e.id)?.transaction_count ?? 0,
      })),
      types: types.map((type) => ({
        ...type,
        eventCount: events.filter((e) => e.type_id === type.id).length,
      })),
    }
  },
)

/** The event and its people in one SQL function (ADR-012). */
export const saveEvent = createServerFn({ method: 'POST' })
  .validator(eventInputSchema)
  .handler(async ({ data }): Promise<EventResult<{ id: string }>> => {
    const { data: id, error } = await getSupabase().rpc('save_event', {
      event_id: data.id ?? null,
      name: data.name,
      type_id: data.typeId,
      starts_on: data.startsOn,
      ends_on: data.endsOn,
      person_ids: data.personIds,
      auto_link: data.autoLink,
    })
    return error ? failure('save event', error) : { ok: true, id }
  })

export const saveEventType = createServerFn({ method: 'POST' })
  .validator(eventTypeInputSchema)
  .handler(async ({ data }): Promise<EventResult<{ id: string }>> => {
    const { data: id, error } = await getSupabase().rpc('save_event_type', {
      type_id: data.id ?? null,
      name: data.name,
      color: data.color,
    })
    return error ? failure('save type', error) : { ok: true, id }
  })

/** Detaches its transactions, which the rule then offers to other events. */
export const deleteEvent = createServerFn({ method: 'POST' })
  .validator(idInput)
  .handler(async ({ data }): Promise<EventResult> => {
    const { error } = await getSupabase().rpc('delete_event', {
      event_id: data.id,
    })
    return error ? failure('delete event', error) : { ok: true }
  })

/** Its events keep everything but the type. */
export const deleteEventType = createServerFn({ method: 'POST' })
  .validator(idInput)
  .handler(async ({ data }): Promise<EventResult> => {
    const error = await deleteRow('event_types', data.id)
    return error ? failure('delete type', error) : { ok: true }
  })

const matchInput = z.object({
  occurredOn: z.iso.date(),
  kind: z.enum(['expense', 'income']),
  transactionId: z.uuid().optional(),
})

/**
 * The event the rule gives a transaction as it is typed: the same SQL function that
 * save_transaction uses, so the form and the saved row agree.
 */
export const getMatchingEvent = createServerFn({ method: 'GET' })
  .validator(matchInput)
  .handler(async ({ data }): Promise<string | null> => {
    const { data: id, error } = await getSupabase().rpc('matching_event', {
      on_date: data.occurredOn,
      tx_kind: data.kind,
      for_transaction: data.transactionId,
    })
    if (error) throw new Error(`The event could not be matched (${error.code})`)
    return id
  })
