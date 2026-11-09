import { withPeople } from '#/lib/transactions/transaction-people'
import type {
  PeopleChanges,
  TransactionPeople,
} from '#/lib/transactions/transaction-people'
import type { TransactionKind } from '#/lib/transactions/transaction'

// An income's one source (spec 20, 21), and the people kept when the kind changes.

/**
 * An income's source when it came from someone without a name, so it can pay back the
 * owed lines without a name (spec 21).
 */
export const ANONYMOUS = 'anonymous'

/** An income's one source (decided 2026-11-05): their line takes the whole amount. */
export function withSource(source: string | null): PeopleChanges {
  if (source === null) return { people: [] }
  return {
    peopleMode: 'share',
    people: [
      {
        key: 1,
        role: 'from',
        personId: source === ANONYMOUS ? null : source,
        headCount: 1,
        value: '1',
      },
    ],
  }
}

/** The person an income came from, if any. */
export function sourceOf(
  draft: Pick<TransactionPeople, 'people'>,
): string | null {
  const line = draft.people.find((l) => l.role === 'from')
  if (!line) return null
  return line.personId ?? ANONYMOUS
}

/**
 * An expense becoming an income keeps its first named person as the source; an income
 * becoming an expense gets Moi back and its source invited.
 */
export function peopleForKind(
  draft: TransactionPeople,
  kind: TransactionKind,
): PeopleChanges {
  if (draft.people.length === 0 || kind === draft.kind) return {}
  if (kind === 'income')
    return withSource(draft.people.find((l) => l.personId)?.personId ?? null)
  const source = sourceOf(draft)
  if (!source) return {}
  return withPeople({ ...draft, kind, people: [] }, [
    source === ANONYMOUS ? null : source,
  ])
}
