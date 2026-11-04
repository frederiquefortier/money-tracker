import { parseAmount } from '#/lib/accounts'
import {
  convertMinor,
  fromMinor,
  isHundred,
  minorDigits,
  percentOf,
  ratio,
  splitMinor,
  toMinor,
} from '#/lib/money'
import type { Draft } from '#/lib/transaction-draft'

// The transaction form's live figures in minor units (ADR-004): what was paid and its fee
// in another currency, and each split line's share.

/**
 * A typed amount in minor units, or null when it is not one above zero with at most the
 * currency's decimals. With no currency yet (no account), any amount of up to 4.
 */
export function typedMinor(input: string, currency: string): bigint | null {
  const decimal = parseAmount(input)
  if (decimal === null || decimal.startsWith('-')) return null
  const minor = toMinor(decimal, currency ? minorDigits(currency) : 4)
  return minor !== null && minor > 0n ? minor : null
}

/** A typed share or percentage as a plain decimal, or null. */
export function typedWeight(input: string): string | null {
  const decimal = parseAmount(input)
  return decimal !== null && !decimal.startsWith('-') && /[1-9]/.test(decimal)
    ? decimal
    : null
}

/**
 * CUR-08: in another currency, what was paid in the account's currency is prefilled at
 * `rate` until typed by hand; the fee is what was paid minus the market value.
 */
export function foreignPreview(
  draft: Pick<Draft, 'amount' | 'currency' | 'paid' | 'paidByHand'>,
  accountCurrency: string,
  rate: string | null,
) {
  const original = typedMinor(draft.amount, draft.currency)
  const digits = {
    from: minorDigits(draft.currency),
    to: minorDigits(accountCurrency),
  }
  const market =
    original !== null && rate !== null
      ? convertMinor(original, rate, digits)
      : null
  const paid = draft.paidByHand
    ? typedMinor(draft.paid, accountCurrency)
    : market
  const fee = paid !== null && market !== null ? paid - market : null
  return {
    paid,
    prefill: market === null ? '' : fromMinor(market, digits.to),
    fee: fee === null ? null : fromMinor(fee, digits.to),
    feeRatio: fee === null || market === null ? null : ratio(fee, market),
  }
}

/** The amount booked on the account, in its minor units: the paid field when foreign. */
export function bookedMinor(
  draft: Draft,
  accountCurrency: string,
  rate: string | null,
): bigint | null {
  if (draft.currency === accountCurrency)
    return typedMinor(draft.amount, accountCurrency)
  return foreignPreview(draft, accountCurrency, rate).paid
}

/**
 * TRX-06: each line's amount in the account's minor units and what is left to share.
 * Montant lines are typed; shares and percentages are computed, the last line taking the
 * rounding. Percentages leave something only when they do not reach 100.
 */
export function splitPreview(
  draft: Pick<Draft, 'splitMode' | 'lines'>,
  total: bigint | null,
  accountCurrency: string,
) {
  const mode = draft.splitMode ?? 'amount'
  if (mode === 'amount') {
    const amounts = draft.lines.map((l) => typedMinor(l.value, accountCurrency))
    const sum = amounts.reduce<bigint>((a, b) => a + (b ?? 0n), 0n)
    return { amounts, remaining: total === null ? null : total - sum }
  }
  const weights = draft.lines.map((l) => typedWeight(l.value))
  if (total === null || weights.some((w) => w === null))
    return { amounts: draft.lines.map(() => null), remaining: null }
  const known = weights.filter((w): w is string => w !== null)
  // Percentages that do not reach 100 leave the rest unshared, as the server refuses them.
  if (mode === 'percent' && !isHundred(known)) {
    const amounts = known.map((w) => percentOf(total, w))
    return { amounts, remaining: total - amounts.reduce((a, b) => a + b, 0n) }
  }
  return { amounts: splitMinor(total, known), remaining: 0n }
}

/**
 * In % mode, what the typed percentages leave of 100, in units of 0.0001 %; negative when
 * they go over. Lines not yet a number count as zero.
 */
export function percentLeft(values: ReadonlyArray<string>): bigint {
  const typed = values.reduce((sum, value) => {
    const weight = typedWeight(value)
    return sum + (weight === null ? 0n : (toMinor(weight, 4) ?? 0n))
  }, 0n)
  return 1000000n - typed
}
