import type { FieldErrors } from '#/lib/form'
import {
  fromMinor,
  isHundred,
  minorDigits,
  parseAmount,
  percentOf,
  splitMinor,
  toMinor,
} from '#/lib/money'
import type {
  SplitMode,
  Transaction,
  TransactionKind,
} from '#/lib/transactions'

// The people on a transaction while the form is filled (PPL-03, 04, spec 20): who an
// expense was shared with, or who an income came from, and each one's part. Computed like
// the splits; the server recomputes and the database checks.

export const PERSON_ROLES = ['me', 'invited', 'owes', 'from'] as const
export type PersonRole = (typeof PERSON_ROLES)[number]

/**
 * One line as typed. Moi has no person; a line without a name has none either and counts
 * its people (`headCount`). `key` keeps React rows stable.
 */
export type PersonLine = {
  key: number
  role: PersonRole
  personId: string | null
  headCount: number
  value: string
}

type People = {
  kind: TransactionKind
  people: Array<PersonLine>
  peopleMode: SplitMode
}

type Changes = Partial<Pick<People, 'people' | 'peopleMode'>>

/** In Parts, every line starts at one per person; Montant and % start empty. */
function startValue(
  line: Pick<PersonLine, 'role' | 'headCount'>,
  mode: SplitMode,
) {
  if (mode !== 'share') return ''
  return String(line.role === 'me' ? 1 : line.headCount)
}

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
  draft: People,
  personIds: ReadonlyArray<string | null>,
): Changes {
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
function kept(lines: ReadonlyArray<PersonLine>): Changes {
  return { people: lines.some((l) => l.role !== 'me') ? [...lines] : [] }
}

export function withoutPeople(
  draft: People,
  personIds: ReadonlyArray<string>,
): Changes {
  return kept(
    draft.people.filter(
      (l) => l.personId === null || !personIds.includes(l.personId),
    ),
  )
}

export function withoutLine(draft: People, key: number): Changes {
  return kept(draft.people.filter((l) => l.key !== key || l.role === 'me'))
}

/** A new mode starts every line over, as for the splits. */
export function withPeopleMode(draft: People, peopleMode: SplitMode): Changes {
  return {
    peopleMode,
    people: draft.people.map((l) => ({
      ...l,
      value: startValue(l, peopleMode),
    })),
  }
}

/** Invité and Me doit switch on a tap. */
export function withRoleSwitched(draft: People, key: number): Changes {
  return {
    people: draft.people.map((l) =>
      l.key === key && (l.role === 'invited' || l.role === 'owes')
        ? { ...l, role: l.role === 'invited' ? 'owes' : 'invited' }
        : l,
    ),
  }
}

/** In Parts, a line still at one part per person follows its count. */
export function withHeadCount(
  draft: People,
  key: number,
  headCount: number,
): Changes {
  return {
    people: draft.people.map((l) => {
      if (l.key !== key) return l
      const follows =
        draft.peopleMode === 'share' && l.value === String(l.headCount)
      return { ...l, headCount, value: follows ? String(headCount) : l.value }
    }),
  }
}

/** An income's one source (decided 2026-11-05): their line takes the whole amount. */
export function withSource(personId: string | null): Changes {
  if (personId === null) return { people: [] }
  return {
    peopleMode: 'share',
    people: [{ key: 1, role: 'from', personId, headCount: 1, value: '1' }],
  }
}

/** The person an income came from, if any. */
export const sourceOf = (draft: Pick<People, 'people'>) =>
  draft.people.find((l) => l.role === 'from')?.personId ?? null

/**
 * An expense becoming an income keeps its first named person as the source; an income
 * becoming an expense gets Moi back and its source invited.
 */
export function peopleForKind(draft: People, kind: TransactionKind): Changes {
  if (draft.people.length === 0 || kind === draft.kind) return {}
  if (kind === 'income')
    return withSource(draft.people.find((l) => l.personId)?.personId ?? null)
  const source = sourceOf(draft)
  return source ? withPeople({ ...draft, kind, people: [] }, [source]) : {}
}

/** A typed part: Moi can be zero, anyone else must be above it. */
function typedPart(value: string, line: PersonLine): string | null {
  const decimal = parseAmount(value)
  if (decimal === null || decimal.startsWith('-')) return null
  return line.role === 'me' || /[1-9]/.test(decimal) ? decimal : null
}

/**
 * Each line's amount in the account's minor units and what is left to share, as for the
 * splits: Montant lines are typed; Parts and % are computed, the last line taking the
 * rounding. Percentages leave something only when they do not reach 100.
 */
export function peoplePreview(
  draft: Pick<People, 'people' | 'peopleMode'>,
  total: bigint | null,
  accountCurrency: string,
) {
  const parts = draft.people.map((l) => typedPart(l.value, l))
  if (draft.peopleMode === 'amount') {
    const digits = minorDigits(accountCurrency)
    const amounts = parts.map((p) => (p === null ? null : toMinor(p, digits)))
    const sum = amounts.reduce<bigint>((a, b) => a + (b ?? 0n), 0n)
    return { amounts, remaining: total === null ? null : total - sum }
  }
  if (total === null || parts.some((p) => p === null))
    return { amounts: parts.map(() => null), remaining: null }
  const known = parts.filter((p): p is string => p !== null)
  if (draft.peopleMode === 'percent' && !isHundred(known)) {
    const amounts = known.map((p) => percentOf(total, p))
    return { amounts, remaining: total - amounts.reduce((a, b) => a + b, 0n) }
  }
  return { amounts: splitMinor(total, known), remaining: 0n }
}

/** SET-07: every part typed, and the parts covering the whole amount. */
export function peopleErrors(
  draft: People,
  accountCurrency: string | null,
  total: bigint | null,
): FieldErrors {
  if (draft.people.length === 0 || accountCurrency === null || total === null)
    return {}
  const { amounts, remaining } = peoplePreview(draft, total, accountCurrency)
  if (amounts.some((a) => a === null)) return { people: 'amount' }
  if (remaining === 0n) return {}
  return {
    people: draft.peopleMode === 'percent' ? 'percentTotal' : 'splitsSum',
  }
}

/** What saveTransaction takes: Montant parts in the account's currency, others as typed. */
export function peopleInput(draft: People, accountCurrency: string) {
  const digits = minorDigits(accountCurrency)
  return draft.people.map((l) => {
    const part = typedPart(l.value, l) ?? '0'
    return {
      role: l.role,
      personId: l.personId,
      headCount: l.headCount,
      value:
        draft.peopleMode === 'amount'
          ? fromMinor(toMinor(part, digits) ?? 0n, digits)
          : part,
    }
  })
}

/** A saved transaction's lines for the form; Montant parts are in the account's currency. */
export function linesFromTransaction(
  transaction: Pick<Transaction, 'people' | 'peopleMode'>,
  forInput: (value: string, inAccountCurrency: boolean) => string,
): Array<PersonLine> {
  return transaction.people.map((p, key) => ({
    ...p,
    key,
    value: forInput(p.value, transaction.peopleMode === 'amount'),
  }))
}
