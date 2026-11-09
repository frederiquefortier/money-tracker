import type { FieldErrors } from '#/lib/forms/form-state'
import type { Locale } from '#/i18n/locales'
import {
  amountForInput,
  convertBackMinor,
  convertMinor,
  fromMinor,
  minorDigits,
} from '#/lib/shared/money'
import { typedMinor } from '#/lib/transactions/transaction-preview'
import type { Transfer, TransferInput } from '#/lib/transfers/transfer'

// What the transfer form holds while it is being filled (spec 16) and its validation.
// The server recomputes and the database checks.

export type TransferDraft = {
  amount: string
  fromId: string | null
  toId: string | null
  received: string
  receivedByHand: boolean
  fee: string
  occurredOn: string
  note: string
  fromPending: boolean
  toPending: boolean
}

/** The two accounts' currencies, once chosen. */
export type TransferCurrencies = { from: string | null; to: string | null }

/** A new transfer keeps what the transaction form already had (spec 15). */
export function emptyTransfer(carry: {
  amount: string
  accountId: string | null
  occurredOn: string
}): TransferDraft {
  return {
    amount: carry.amount,
    fromId: carry.accountId,
    toId: null,
    received: '',
    receivedByHand: false,
    fee: '',
    occurredOn: carry.occurredOn,
    note: '',
    fromPending: false,
    toPending: false,
  }
}

export function draftFromTransfer(
  transfer: Transfer,
  currencies: { from: string; to: string },
  locale: Locale,
): TransferDraft {
  const foreign = currencies.from !== currencies.to
  return {
    amount: amountForInput(transfer.amount, currencies.from, locale),
    fromId: transfer.fromAccountId,
    toId: transfer.toAccountId,
    received: foreign
      ? amountForInput(transfer.received, currencies.to, locale)
      : '',
    receivedByHand: foreign,
    fee: transfer.fee
      ? amountForInput(transfer.fee, currencies.from, locale)
      : '',
    occurredOn: transfer.occurredOn,
    note: transfer.note ?? '',
    fromPending: transfer.fromPending,
    toPending: transfer.toPending,
  }
}

/**
 * TRX-11: between two currencies, what arrived is prefilled at `rate` (from → to) until
 * typed by hand. The conversion cost is what was sent minus what arrived, valued back in
 * the departure currency at the same rate.
 */
export function transferPreview(
  draft: Pick<TransferDraft, 'amount' | 'received' | 'receivedByHand'>,
  currencies: { from: string; to: string },
  rate: string | null,
) {
  const digits = {
    from: minorDigits(currencies.from),
    to: minorDigits(currencies.to),
  }
  const sent = typedMinor(draft.amount, currencies.from)
  const market =
    sent !== null && rate !== null ? convertMinor(sent, rate, digits) : null
  const received = draft.receivedByHand
    ? typedMinor(draft.received, currencies.to)
    : market
  let cost: bigint | null = null
  if (sent !== null && received !== null && rate !== null)
    // At the market value exactly, rounding the way back would show a cent of cost.
    cost =
      received === market ? 0n : sent - convertBackMinor(received, rate, digits)
  const value =
    received === null || rate === null
      ? null
      : convertBackMinor(received, rate, digits)
  return {
    received,
    prefill: market === null ? '' : fromMinor(market, digits.to),
    value: value === null ? null : fromMinor(value, digits.from),
    cost: cost === null ? null : fromMinor(cost, digits.from),
  }
}

type Valid = { input: TransferInput; errors: null }
type Invalid = { input: null; errors: FieldErrors }

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function accountErrors(
  draft: TransferDraft,
  { from, to }: TransferCurrencies,
): FieldErrors {
  const errors: FieldErrors = {}
  if (!draft.fromId || from === null) errors.fromId = 'required'
  if (!draft.toId || to === null) errors.toId = 'required'
  else if (draft.toId === draft.fromId) errors.toId = 'sameAccount'
  return errors
}

/** TRX-04: the fee goes to the category set in Réglages, which has to exist. */
function feeErrors(
  draft: TransferDraft,
  from: string | null,
  feeCategorySet: boolean,
): FieldErrors {
  if (!draft.fee.trim()) return {}
  if (typedMinor(draft.fee, from ?? '') === null) return { fee: 'amount' }
  return feeCategorySet ? {} : { fee: 'feeCategoryUnset' }
}

function fieldErrors(
  draft: TransferDraft,
  currencies: TransferCurrencies,
  received: bigint | null,
): FieldErrors {
  const errors: FieldErrors = {}
  const { from, to } = currencies
  if (typedMinor(draft.amount, from ?? '') === null)
    errors.amount = draft.amount.trim() ? 'amount' : 'required'
  if (!ISO_DATE.test(draft.occurredOn)) errors.occurredOn = 'date'
  if (from && to && from !== to && received === null && !errors.amount)
    errors.received =
      draft.received.trim() || !draft.receivedByHand ? 'amount' : 'required'
  return {
    ...errors,
    ...accountErrors(draft, currencies),
  }
}

/** SET-07: what the form shows under each field, or the input for saveTransfer. */
export function validateTransfer(
  draft: TransferDraft,
  {
    id,
    currencies,
    rate,
    feeCategorySet = true,
  }: {
    id?: string
    currencies: TransferCurrencies
    rate: string | null
    feeCategorySet?: boolean
  },
): Valid | Invalid {
  const { from, to } = currencies
  const foreign = from !== null && to !== null && from !== to
  const received = foreign
    ? transferPreview(draft, { from, to }, rate).received
    : null
  const errors = {
    ...fieldErrors(draft, currencies, received),
    ...feeErrors(draft, from, feeCategorySet),
  }
  if (Object.keys(errors).length > 0 || !from || !to)
    return { input: null, errors }
  const fromDigits = minorDigits(from)
  const fee = draft.fee.trim() ? typedMinor(draft.fee, from) : null
  return {
    errors: null,
    input: {
      id,
      fromAccountId: draft.fromId ?? '',
      toAccountId: draft.toId ?? '',
      occurredOn: draft.occurredOn,
      amount: fromMinor(typedMinor(draft.amount, from) ?? 0n, fromDigits),
      received:
        foreign && received !== null
          ? fromMinor(received, minorDigits(to))
          : null,
      fee: fee === null ? null : fromMinor(fee, fromDigits),
      note: draft.note.trim(),
      fromPending: draft.fromPending,
      toPending: draft.toPending,
    },
  }
}
