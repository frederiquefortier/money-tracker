import type {
  PersonRole,
  SplitMode,
  TransactionKind,
} from '#/lib/transactions/transaction'

// The people on a transaction while the form is filled (PPL-03, 04, spec 20): who an
// expense was shared with, or who an income came from, and each one's part. Computed like
// the splits; the server recomputes and the database checks.

/**
 * One line as typed. Moi has no person; a line without a name has none either and counts
 * its people (`headCount`). `key` keeps React rows stable.
 */
export type PersonLine = {
  key: number
  role: PersonRole
  personId: string | null
  headCount: number
  /** Empty on a Me doit line: not known yet, or in Montant what the others leave. */
  value: string
  /** What came back for a saved owed line, for its sheet; never sent. */
  back?: Array<{ amount: string; date: string }>
}

export type TransactionPeople = {
  kind: TransactionKind
  people: Array<PersonLine>
  peopleMode: SplitMode
}

export type PeopleChanges = Partial<
  Pick<TransactionPeople, 'people' | 'peopleMode'>
>

/**
 * In Parts, every line starts at one per person; Montant and % start empty. A Me doit
 * line always starts empty: its part is not known until typed (spec 21).
 */
function startValue(
  line: Pick<PersonLine, 'role' | 'headCount'>,
  mode: SplitMode,
) {
  if (mode !== 'share' || line.role === 'owes' || line.role === 'with')
    return ''
  return String(line.role === 'me' ? 1 : line.headCount)
}

/**
 * An empty field means not known yet (decided 2026-11-08). An empty Me doit part is set
 * by its reimbursement, in every mode; empty Moi or Invité lines take what is left.
 */
export const isUnknown = (line: PersonLine) =>
  line.role === 'owes' && line.value.trim() === ''

const nextKey = (lines: ReadonlyArray<PersonLine>) =>
  Math.max(0, ...lines.map((l) => l.key)) + 1

const defaultRole = (kind: TransactionKind): PersonRole =>
  kind === 'expense' ? 'invited' : 'from'

const meLine = (key: number, mode: SplitMode): PersonLine => ({
  key,
  role: 'me',
  personId: null,
  headCount: 1,
  value: startValue({ role: 'me', headCount: 1 }, mode),
})

/** Lines for `personIds` not on the transaction yet; Moi comes first on an expense. */
export function withPeople(
  draft: TransactionPeople,
  personIds: ReadonlyArray<string | null>,
): PeopleChanges {
  let lines =
    draft.people.length === 0 && draft.kind === 'expense'
      ? [meLine(1, draft.peopleMode)]
      : draft.people
  for (const personId of personIds) {
    if (personId !== null && lines.some((l) => l.personId === personId))
      continue
    const line = { role: defaultRole(draft.kind), headCount: 1 }
    lines = [
      ...lines,
      {
        ...line,
        key: nextKey(lines),
        personId,
        value: startValue(line, draft.peopleMode),
      },
    ]
  }
  return { people: lines }
}

/** Removing down to Moi alone removes the section. */
function kept(lines: ReadonlyArray<PersonLine>): PeopleChanges {
  return { people: lines.some((l) => l.role !== 'me') ? [...lines] : [] }
}

export function withoutPeople(
  draft: TransactionPeople,
  personIds: ReadonlyArray<string>,
): PeopleChanges {
  return kept(
    draft.people.filter(
      (l) => l.personId === null || !personIds.includes(l.personId),
    ),
  )
}

export function withoutPersonLine(
  draft: TransactionPeople,
  key: number,
): PeopleChanges {
  return kept(draft.people.filter((l) => l.key !== key || l.role === 'me'))
}

/** A new mode starts every line over, as for the splits. */
export function withPeopleMode(
  draft: TransactionPeople,
  peopleMode: SplitMode,
): PeopleChanges {
  return {
    peopleMode,
    people: draft.people.map((l) => ({
      ...l,
      value: startValue(l, peopleMode),
    })),
  }
}

function nextRole(line: PersonLine): PersonRole {
  if (line.role === 'invited') return 'owes'
  return line.role === 'owes' && line.personId !== null ? 'with' : 'invited'
}

/** The roles of a line that is not Moi nor a source, in the order of the menu. */
export const GUEST_ROLES = ['invited', 'owes', 'with'] as const

/** A line takes another role. A line without a name cannot be with me: it counts people. */
export function withRole(
  draft: TransactionPeople,
  key: number,
  role: PersonRole,
): PeopleChanges {
  return {
    people: draft.people.map((l) => {
      if (l.key !== key || l.role === 'me' || l.role === 'from') return l
      if (role === 'with' && l.personId === null) return l
      return {
        ...l,
        role,
        headCount: role === 'with' ? 1 : l.headCount,
        value: startValue({ ...l, role }, draft.peopleMode),
      }
    }),
  }
}

/** Invité, Me doit and Avec moi go round, as in the tests. */
export function withRoleSwitched(
  draft: TransactionPeople,
  key: number,
): PeopleChanges {
  const line = draft.people.find((l) => l.key === key)
  return line ? withRole(draft, key, nextRole(line)) : { people: draft.people }
}

/** In Parts, a line still at one part per person follows its count. */
export function withHeadCount(
  draft: TransactionPeople,
  key: number,
  headCount: number,
): PeopleChanges {
  return {
    people: draft.people.map((l) => {
      if (l.key !== key) return l
      const follows =
        draft.peopleMode === 'share' && l.value === String(l.headCount)
      return { ...l, headCount, value: follows ? String(headCount) : l.value }
    }),
  }
}
