import type { FieldErrors } from '#/lib/form'
import { fromMinor, minorDigits, toMinor } from '#/lib/money'
import {
  bookedMinor,
  splitPreview,
  typedMinor,
  typedWeight,
} from '#/lib/transaction-preview'
import type {
  FormAccount,
  SplitMode,
  Transaction,
  TransactionInput,
  TransactionKind,
} from '#/lib/transactions'

// What the transaction form holds while it is being filled (spec 15) and its validation.
// The server recomputes and the database checks.

/** One split line as typed; `key` keeps React rows stable while lines come and go. */
export type Line = { key: number; categoryId: string | null; value: string }

/** Everything the form holds. `splitMode` null is the single category field. */
export type Draft = {
  kind: TransactionKind
  amount: string
  currency: string
  paid: string
  paidByHand: boolean
  accountId: string | null
  occurredOn: string
  merchantId: string | null
  categoryId: string | null
  categoryByHand: boolean
  splitMode: SplitMode | null
  lines: Array<Line>
  note: string
  pending: boolean
}

export function emptyDraft(
  account: FormAccount | undefined,
  today: string,
): Draft {
  return {
    kind: 'expense',
    amount: '',
    currency: account?.currency ?? '',
    paid: '',
    paidByHand: false,
    accountId: account?.id ?? null,
    occurredOn: today,
    merchantId: null,
    categoryId: null,
    categoryByHand: false,
    splitMode: null,
    lines: [],
    note: '',
    pending: false,
  }
}

// 100 % in units of 0.0001, the precision a percentage is stored with.
const HUNDRED = 1000000n

/**
 * TRX-06: percentages never total more than 100 (spec 15). A typed value above what the
 * other lines leave is cut to it; anything not yet a number is kept as typed.
 */
export function capPercent(
  lines: ReadonlyArray<Line>,
  { key, value: typed }: Pick<Line, 'key' | 'value'>,
  locale: string,
): string {
  const weight = typedWeight(typed)
  const value = weight === null ? null : toMinor(weight, 4)
  if (value === null) return typed
  const others = lines
    .filter((l) => l.key !== key)
    .reduce((sum, l) => {
      const w = typedWeight(l.value)
      return sum + (w === null ? 0n : (toMinor(w, 4) ?? 0n))
    }, 0n)
  const left = HUNDRED - others
  if (value <= left) return typed
  return forInput(fromMinor(left > 0n ? left : 0n, 4), null, locale)
}

/**
 * A stored decimal ("84.1200") as typed in this locale, unsigned: "84,12" with the
 * currency's decimals, or "1,5" for a share (`currency` null).
 */
export function forInput(
  amount: string,
  currency: string | null,
  locale: string,
) {
  const digits = currency === null ? 0 : minorDigits(currency)
  const minor = toMinor(amount.replace('-', ''), 4)
  const text = minor === null ? amount : fromMinor(minor, 4)
  const [int = '0', frac = ''] = text.split('.')
  const kept = frac.replace(/0+$/, '').padEnd(digits, '0')
  return kept ? `${int}${locale === 'fr' ? ',' : '.'}${kept}` : int
}

export function draftFromTransaction(
  transaction: Transaction,
  accountCurrency: string,
  locale: string,
): Draft {
  const { originalAmount, originalCurrency } = transaction
  const booked = forInput(transaction.amount, accountCurrency, locale)
  const single =
    transaction.splitMode === 'amount' && transaction.splits.length === 1
  return {
    kind: transaction.kind,
    amount:
      originalAmount && originalCurrency
        ? forInput(originalAmount, originalCurrency, locale)
        : booked,
    currency: originalCurrency ?? accountCurrency,
    paid: originalCurrency ? booked : '',
    paidByHand: originalCurrency !== null,
    accountId: transaction.accountId,
    occurredOn: transaction.occurredOn,
    merchantId: transaction.merchantId,
    categoryId: single ? (transaction.splits[0]?.categoryId ?? null) : null,
    categoryByHand: true,
    splitMode: single ? null : transaction.splitMode,
    lines: single
      ? []
      : transaction.splits.map((s, key) => ({
          key,
          categoryId: s.categoryId,
          // Montant lines are in the account's currency; shares and percentages are plain.
          value:
            transaction.splitMode === 'amount'
              ? forInput(s.value, accountCurrency, locale)
              : forInput(s.value, null, locale),
        })),
    note: transaction.note ?? '',
    pending: transaction.pending,
  }
}

type Valid = { input: TransactionInput; errors: null }
type Invalid = { input: null; errors: FieldErrors }

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** The single category, or the split lines: complete, each category once, summing up. */
function categoryErrors(
  draft: Draft,
  accountCurrency: string | null,
  total: bigint | null,
): FieldErrors {
  if (draft.splitMode === null)
    return draft.categoryId ? {} : { categoryId: 'required' }
  if (draft.lines.some((l) => !l.categoryId)) return { splits: 'required' }
  if (new Set(draft.lines.map((l) => l.categoryId)).size !== draft.lines.length)
    return { splits: 'duplicateCategory' }
  if (accountCurrency === null || total === null) return {}
  const { amounts, remaining } = splitPreview(draft, total, accountCurrency)
  if (amounts.some((a) => a === null)) return { splits: 'amount' }
  if (remaining === 0n) return {}
  return {
    splits: draft.splitMode === 'percent' ? 'percentTotal' : 'splitsSum',
  }
}

function fieldErrors(
  draft: Draft,
  accountCurrency: string | null,
  total: bigint | null,
): FieldErrors {
  const errors: FieldErrors = {}
  if (typedMinor(draft.amount, draft.currency) === null)
    errors.amount = draft.amount.trim() ? 'amount' : 'required'
  if (!draft.accountId || accountCurrency === null)
    errors.accountId = 'required'
  if (!ISO_DATE.test(draft.occurredOn)) errors.occurredOn = 'date'
  const foreign = accountCurrency !== null && draft.currency !== accountCurrency
  if (foreign && total === null && !errors.amount)
    errors.paid = draft.paid.trim() || !draft.paidByHand ? 'amount' : 'required'
  return { ...errors, ...categoryErrors(draft, accountCurrency, total) }
}

function splitValues(draft: Draft, accountCurrency: string, total: bigint) {
  const digits = minorDigits(accountCurrency)
  if (draft.splitMode === null)
    return [
      { categoryId: draft.categoryId ?? '', value: fromMinor(total, digits) },
    ]
  return draft.lines.map((l) => ({
    categoryId: l.categoryId ?? '',
    value:
      draft.splitMode === 'amount'
        ? fromMinor(typedMinor(l.value, accountCurrency) ?? 0n, digits)
        : (typedWeight(l.value) ?? ''),
  }))
}

/** SET-07: what the form shows under each field, or the input for saveTransaction. */
export function validateDraft(
  draft: Draft,
  {
    id,
    accountCurrency,
    rate,
  }: { id?: string; accountCurrency: string | null; rate: string | null },
): Valid | Invalid {
  const total =
    accountCurrency === null ? null : bookedMinor(draft, accountCurrency, rate)
  const errors = fieldErrors(draft, accountCurrency, total)
  if (
    Object.keys(errors).length > 0 ||
    accountCurrency === null ||
    total === null
  )
    return { input: null, errors }
  const foreign = draft.currency !== accountCurrency
  const original = foreign ? typedMinor(draft.amount, draft.currency) : null
  return {
    errors: null,
    input: {
      id,
      accountId: draft.accountId ?? '',
      kind: draft.kind,
      occurredOn: draft.occurredOn,
      amount: fromMinor(total, minorDigits(accountCurrency)),
      originalAmount:
        original === null
          ? null
          : fromMinor(original, minorDigits(draft.currency)),
      originalCurrency: foreign ? draft.currency : null,
      pending: draft.pending,
      merchantId: draft.merchantId,
      note: draft.note.trim(),
      splitMode: draft.splitMode ?? 'amount',
      splits: splitValues(draft, accountCurrency, total),
    },
  }
}
