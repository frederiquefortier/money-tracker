import { z } from 'zod'
import { byName } from '#/lib/shared/collections'
import { foldForSearch } from '#/lib/shared/search'
import { nameFormSchema } from '#/lib/shared/validation'

// Shared by the Proches screens and the server functions (spec 19).

export type Person = {
  id: string
  name: string
  archivedOn: string | null
  groupIds: Array<string>
  /** Other spellings, for the import (PPL-06). */
  aliases: Array<string>
  /** How many transactions name them (spec 20). */
  transactionCount: number
}

export type PersonGroup = {
  id: string
  name: string
  archivedOn: string | null
  memberIds: Array<string>
}

export const PEOPLE_TABS = ['people', 'groups'] as const
export type PeopleTab = (typeof PEOPLE_TABS)[number]

export const PEOPLE_SORTS = ['nameAsc', 'nameDesc'] as const
export type PeopleSort = (typeof PEOPLE_SORTS)[number]

export const personInputSchema = nameFormSchema.extend({
  id: z.uuid().optional(),
  groupIds: z.array(z.uuid()),
  aliases: z.array(z.string().trim().min(1).max(100)),
})
export type PersonInput = z.input<typeof personInputSchema>

export const groupInputSchema = nameFormSchema.extend({
  id: z.uuid().optional(),
  memberIds: z.array(z.uuid()),
})

/** A person's avatar for now: the first letter of the name (spec 19). */
export function initialOf(name: string, locale: string) {
  return ([...name.trim()][0] ?? '').toLocaleUpperCase(locale)
}

/**
 * The names and aliases a person's alias cannot take, folded: every other person's (an
 * import match must point to one person only, PPL-06).
 */
export function takenNames(
  people: ReadonlyArray<Person>,
  personId: string | undefined,
) {
  return new Set(
    people
      .filter((p) => p.id !== personId)
      .flatMap((p) => [p.name, ...p.aliases])
      .map(foldForSearch),
  )
}

/** Groups with their members' names, alphabetical, for their avatars. */
export function withMemberNames(
  groups: ReadonlyArray<PersonGroup>,
  people: ReadonlyArray<Person>,
  locale: string,
) {
  return groups.map((group) => ({
    ...group,
    memberNames: byName(
      people.filter((p) => group.memberIds.includes(p.id)),
      locale,
    ).map((p) => p.name),
  }))
}

/** The names of `ids` among `items`, alphabetical, joined for a row's second line. */
export function namesOf(
  ids: ReadonlyArray<string>,
  items: ReadonlyArray<{ id: string; name: string }>,
  locale: string,
) {
  return byName(
    items.filter((item) => ids.includes(item.id)),
    locale,
  )
    .map((item) => item.name)
    .join(', ')
}

export type PeopleError =
  'nameTaken' | 'aliasTaken' | 'notFound' | 'sharedTransaction' | 'failed'
