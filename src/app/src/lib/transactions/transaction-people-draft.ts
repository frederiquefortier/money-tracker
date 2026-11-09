import type { FieldErrors } from '#/lib/forms/form-state'
import {
  fromMinor,
  isHundred,
  minorDigits,
  parseAmount,
  percentOf,
  splitMinor,
  toMinor,
} from '#/lib/shared/money'
import { isUnknown } from '#/lib/transactions/transaction-people'
import type {
  TransactionPeople,
  PersonLine,
} from '#/lib/transactions/transaction-people'
import type { Transaction } from '#/lib/transactions/transaction'

// What the people's lines come to (spec 20, 21): an empty field filled, each line's
// amount, the errors, and what saveTransaction takes. The server recomputes.

/** A typed part: Moi can be zero, anyone else must be above it. */
function typedPart(value: string, line: PersonLine): string | null {
  const decimal = parseAmount(value)
  if (decimal === null || decimal.startsWith('-')) return null
  return line.role === 'me' || /[1-9]/.test(decimal) ? decimal : null
}

/**
 * What each line counts for, so an empty field never stops the save (decided
 * 2026-11-08): an empty Me doit is not known yet; an empty Moi or Invité takes what is
 * left: 1 part in Parts, an equal share of what the typed lines leave in Montant and %.
 * In Montant, with a part not known yet and nothing else empty, Moi takes what is left.
 * `filled` holds the lines counted that way; `over` is set when the typed lines already
 * take everything.
 */
function filledLines(
  draft: Pick<TransactionPeople, 'people' | 'peopleMode'>,
  total: bigint | null,
  accountCurrency: string,
): { lines: Array<PersonLine>; filled: Set<number>; over: boolean } {
  const mode = draft.peopleMode
  const blanks = draft.people.filter(
    (l) => l.value.trim() === '' && !isUnknown(l),
  )
  const fill =
    blanks.length === 0 && mode === 'amount' && draft.people.some(isUnknown)
      ? draft.people.filter((l) => l.role === 'me')
      : blanks
  const filled = new Set(fill.map((l) => l.key))
  const none = { lines: draft.people, filled, over: false }
  if (fill.length === 0) return none
  if (mode === 'share')
    return {
      ...none,
      lines: draft.people.map((l) =>
        filled.has(l.key) ? { ...l, value: '1' } : l,
      ),
    }
  // 100 % at four places, or the amount in the account's minor units.
  const digits = mode === 'amount' ? minorDigits(accountCurrency) : 4
  const whole = mode === 'amount' ? total : 1000000n
  if (whole === null) return none
  const typed = draft.people
    .filter((l) => !filled.has(l.key) && !isUnknown(l))
    .reduce((sum, l) => {
      const part = typedPart(l.value, l)
      return sum + (part === null ? 0n : (toMinor(part, digits) ?? 0n))
    }, 0n)
  const left = whole - typed
  if (left <= 0n) return { ...none, over: true }
  const shares = splitMinor(
    left,
    fill.map(() => '1'),
  )
  let i = 0
  return {
    ...none,
    lines: draft.people.map((l) =>
      filled.has(l.key) ? { ...l, value: fromMinor(shares[i++], digits) } : l,
    ),
  }
}

/**
 * Each line's amount in the account's minor units and what is left to share, as for the
 * splits: Montant lines are typed; Parts and % are computed, the last line taking the
 * rounding. Percentages leave something only when they do not reach 100. Empty lines
 * count as `filledLines` says.
 */
export function peoplePreview(
  draft: Pick<TransactionPeople, 'people' | 'peopleMode'>,
  total: bigint | null,
  accountCurrency: string,
): {
  /** Undefined for a part not known yet; null for one not typed right. */
  amounts: Array<bigint | null | undefined>
  remaining: bigint | null
  /** The typed lines take everything, leaving the empty ones nothing. */
  over: boolean
  /** The lines counted as what is left, which show what they come to. */
  filled: Set<number>
} {
  const mode = draft.peopleMode
  const filled = filledLines(draft, total, accountCurrency)
  const people = filled.lines
  if (people.some((l) => isUnknown(l))) {
    // Spec 21: the others share the whole amount until the reimbursement says the rest.
    const known = people.filter((l) => !isUnknown(l))
    const preview = peoplePreview(
      { ...draft, people: known },
      total,
      accountCurrency,
    )
    let i = 0
    return {
      amounts: people.map((l) =>
        isUnknown(l) ? undefined : preview.amounts[i++],
      ),
      remaining: preview.remaining,
      over: filled.over || preview.over,
      filled: filled.filled,
    }
  }
  const parts = people.map((l) => typedPart(l.value, l))
  if (mode === 'amount') {
    const digits = minorDigits(accountCurrency)
    const amounts = parts.map((p) => (p === null ? null : toMinor(p, digits)))
    const sum = amounts.reduce<bigint>((a, b) => a + (b ?? 0n), 0n)
    return {
      amounts,
      remaining: total === null ? null : total - sum,
      over: filled.over,
      filled: filled.filled,
    }
  }
  if (total === null || parts.some((p) => p === null))
    return {
      amounts: parts.map(() => null),
      remaining: null,
      over: filled.over,
      filled: filled.filled,
    }
  const known = parts.filter((p): p is string => p !== null)
  if (mode === 'percent' && !isHundred(known)) {
    const amounts = known.map((p) => percentOf(total, p))
    return {
      amounts,
      remaining: total - amounts.reduce((a, b) => a + b, 0n),
      over: filled.over,
      filled: filled.filled,
    }
  }
  return {
    amounts: splitMinor(total, known),
    remaining: 0n,
    over: false,
    filled: filled.filled,
  }
}

/**
 * What the typed lines leave of the amount, empty lines counting nothing: the people's
 * remaining line in Montant, as the splits' and as % counts from the typed values.
 */
export function typedLeft(
  draft: Pick<TransactionPeople, 'people'>,
  total: bigint | null,
  accountCurrency: string,
): bigint | null {
  if (total === null) return null
  const digits = minorDigits(accountCurrency)
  return draft.people.reduce((left, l) => {
    const part = l.value.trim() === '' ? null : typedPart(l.value, l)
    return left - (part === null ? 0n : (toMinor(part, digits) ?? 0n))
  }, total)
}

/** SET-07: every part typed, and the parts covering the whole amount. */
export function peopleErrors(
  draft: TransactionPeople,
  accountCurrency: string | null,
  total: bigint | null,
): FieldErrors {
  if (draft.people.length === 0 || accountCurrency === null || total === null)
    return {}
  const { amounts, remaining, over } = peoplePreview(
    draft,
    total,
    accountCurrency,
  )
  // Empty lines left with nothing: the typed ones already take it all.
  if (over)
    return {
      people: draft.peopleMode === 'percent' ? 'percentTotal' : 'splitsSum',
    }
  if (amounts.some((a) => a === null)) return { people: 'amount' }
  if (remaining === 0n) return {}
  return {
    people: draft.peopleMode === 'percent' ? 'percentTotal' : 'splitsSum',
  }
}

/**
 * What saveTransaction takes: Montant parts in the account's currency, others as their
 * weights, an empty line as it was filled, an unknown part flagged.
 */
export function peopleInput(
  draft: TransactionPeople,
  accountCurrency: string,
  total: bigint,
) {
  const digits = minorDigits(accountCurrency)
  const { amounts } = peoplePreview(draft, total, accountCurrency)
  const { lines } = filledLines(draft, total, accountCurrency)
  return lines.map((l, i) => {
    // Left empty: recomputed by the database when a reimbursement comes (Montant).
    const fillsRest = draft.people[i].value.trim() === '' && !isUnknown(l)
    const unknown = isUnknown(l)
    const value = () => {
      if (unknown) return '0'
      if (draft.peopleMode !== 'amount') return typedPart(l.value, l) ?? '0'
      const minor = amounts[i] ?? 0n
      return fromMinor(minor < 0n ? -minor : minor, digits)
    }
    return {
      role: l.role,
      personId: l.personId,
      headCount: l.headCount,
      amountUnknown: unknown,
      fillsRest,
      value: value(),
    }
  })
}

/** A saved transaction's lines for the form; Montant parts are in the account's currency. */
export function linesFromTransaction(
  transaction: Pick<Transaction, 'people' | 'peopleMode'>,
  forInput: (value: string, inAccountCurrency: boolean) => string,
): Array<PersonLine> {
  return transaction.people.map(({ amountUnknown, fillsRest, ...p }, key) => ({
    ...p,
    key,
    value:
      amountUnknown || fillsRest
        ? ''
        : forInput(p.value, transaction.peopleMode === 'amount'),
  }))
}
