import type { Category } from '#/lib/categories'
import type { FieldErrors } from '#/lib/form'
import type { Merchant } from '#/lib/merchants'
import type { Locale } from '#/i18n/locales'
import { absDecimal, amountForInput, fromMinor, minorDigits } from '#/lib/money'
import {
  linesFromTransaction,
  peopleErrors,
  peopleInput,
} from '#/lib/people-parts'
import type { PersonLine } from '#/lib/transaction-people'
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
  /** Empty when no one is on the transaction (spec 20). */
  people: Array<PersonLine>
  peopleMode: SplitMode
  /** An income's owed lines it pays back, in order (spec 21). */
  reimburses: Array<string>
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
    people: [],
    peopleMode: 'share',
    reimburses: [],
  }
}

/** A category chosen in the list, for the transaction (`main`) or a split line's key. */
export function withPicked(
  draft: Pick<Draft, 'lines'>,
  target: 'main' | number,
  categoryId: string,
): Partial<Draft> {
  if (target === 'main') return { categoryId, categoryByHand: true }
  return {
    lines: draft.lines.map((l) =>
      l.key === target ? { ...l, categoryId } : l,
    ),
  }
}

/** A merchant chosen in the form fills its default category, if still there (MER-01). */
export function withMerchant(
  merchant: Pick<Merchant, 'id' | 'defaultCategoryId'>,
  categories: ReadonlyArray<Pick<Category, 'id'>>,
): Partial<Draft> {
  const found = categories.some((c) => c.id === merchant.defaultCategoryId)
  return {
    merchantId: merchant.id,
    ...(found ? { categoryId: merchant.defaultCategoryId } : {}),
  }
}

export function draftFromTransaction(
  transaction: Transaction,
  accountCurrency: string,
  locale: Locale,
): Draft {
  const { originalAmount, originalCurrency } = transaction
  const forInput = (amount: string, currency: string | null) =>
    amountForInput(absDecimal(amount), currency, locale)
  const booked = forInput(transaction.amount, accountCurrency)
  const single =
    transaction.splitMode === 'amount' && transaction.splits.length === 1
  return {
    kind: transaction.kind,
    amount:
      originalAmount && originalCurrency
        ? forInput(originalAmount, originalCurrency)
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
              ? forInput(s.value, accountCurrency)
              : forInput(s.value, null),
        })),
    note: transaction.note ?? '',
    pending: transaction.pending,
    peopleMode: transaction.peopleMode,
    people: linesFromTransaction(transaction, (value, inAccount) =>
      forInput(value, inAccount ? accountCurrency : null),
    ),
    reimburses: transaction.reimburses,
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
  return {
    ...errors,
    ...categoryErrors(draft, accountCurrency, total),
    ...peopleErrors(draft, accountCurrency, total),
  }
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
      peopleMode: draft.peopleMode,
      people: peopleInput(draft, accountCurrency, total),
      reimburses: draft.kind === 'income' ? draft.reimburses : [],
    },
  }
}
