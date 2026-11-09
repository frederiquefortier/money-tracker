import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { loaded } from '#/lib/server/db.server'
import { groupInputSchema, personInputSchema } from '#/lib/people/person'
import type { Person, PersonGroup, PeopleError } from '#/lib/people/person'
import { failureFor } from '#/lib/shared/result'
import type { Result } from '#/lib/shared/result'
import { idInput } from '#/lib/shared/validation'
import { getSupabase } from '#/lib/server/supabase.server'

type PeopleResult<T = object> = Result<PeopleError, T>

const KNOWN: Partial<Record<string, PeopleError>> = {
  '23505': 'nameTaken',
  // save_person and save_person_group raise it for a row the user cannot see.
  P0002: 'notFound',
  // A membership naming another user's person or group.
  '23503': 'notFound',
  // Raised by the alias triggers (PPL-06).
  alias_taken: 'aliasTaken',
  name_is_alias: 'nameTaken',
}

const failure = failureFor('people', KNOWN)

const TABLES = { person: 'people', group: 'person_groups' } as const
const kindInput = idInput.extend({ kind: z.enum(['person', 'group']) })

export const getPeople = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{
    people: Array<Person>
    groups: Array<PersonGroup>
  }> => {
    const supabase = getSupabase()
    const [people, groups, members, aliases, usage] = loaded(
      'People',
      ...(await Promise.all([
        supabase.from('people').select('id, name, archived_on'),
        supabase.from('person_groups').select('id, name, archived_on'),
        supabase.from('person_group_members').select('group_id, person_id'),
        supabase.from('person_aliases').select('person_id, alias'),
        supabase.from('person_usage').select('person_id, transaction_count'),
      ])),
    )
    return {
      people: people.map((p) => ({
        id: p.id,
        name: p.name,
        archivedOn: p.archived_on,
        groupIds: members
          .filter((m) => m.person_id === p.id)
          .map((m) => m.group_id),
        aliases: aliases
          .filter((a) => a.person_id === p.id)
          .map((a) => a.alias),
        transactionCount:
          usage.find((u) => u.person_id === p.id)?.transaction_count ?? 0,
      })),
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        archivedOn: g.archived_on,
        memberIds: members
          .filter((m) => m.group_id === g.id)
          .map((m) => m.person_id),
      })),
    }
  },
)

/** The person, their groups and aliases in one SQL function (ADR-012). */
export const savePerson = createServerFn({ method: 'POST' })
  .validator(personInputSchema)
  .handler(async ({ data }): Promise<PeopleResult<{ id: string }>> => {
    const { data: id, error } = await getSupabase().rpc('save_person', {
      person_id: data.id ?? null,
      name: data.name,
      group_ids: data.groupIds,
      aliases: data.aliases,
    })
    return error ? failure('save person', error) : { ok: true, id }
  })

export const saveGroup = createServerFn({ method: 'POST' })
  .validator(groupInputSchema)
  .handler(async ({ data }): Promise<PeopleResult<{ id: string }>> => {
    const { data: id, error } = await getSupabase().rpc('save_person_group', {
      group_id: data.id ?? null,
      name: data.name,
      person_ids: data.memberIds,
    })
    return error ? failure('save group', error) : { ok: true, id }
  })

/** PPL-02. A null date reactivates. */
export const archivePeopleRow = createServerFn({ method: 'POST' })
  .validator(kindInput.extend({ archivedOn: z.iso.date().nullable() }))
  .handler(async ({ data }): Promise<PeopleResult> => {
    const { error } = await getSupabase()
      .from(TABLES[data.kind])
      .update({ archived_on: data.archivedOn })
      .eq('id', data.id)
    return error ? failure('archive', error) : { ok: true }
  })

/** Deleting a group never deletes its members; memberships go with either. */
export const deletePeopleRow = createServerFn({ method: 'POST' })
  .validator(kindInput)
  .handler(async ({ data }): Promise<PeopleResult> => {
    const { error } = await getSupabase()
      .from(TABLES[data.kind])
      .delete()
      .eq('id', data.id)
    return error ? failure('delete', error) : { ok: true }
  })
