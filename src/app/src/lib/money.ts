// Previews in the browser count in integer minor units with BigInt (ADR-004, ADR-011).
// The server recomputes everything; these only have to agree with it, so rounding is half
// away from zero, like Postgres's round() on numeric.

import { FORMAT_LOCALE } from '#/i18n/locales'
import type { Locale } from '#/i18n/locales'

const TEN = 10n

/** Digits after the decimal point for a currency: 2 for CAD, 0 for JPY. */
export function minorDigits(currency: string): number {
  return (
    new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  )
}

/** "84.12" to 8412n; null when the amount has more decimals than the currency allows. */
export function toMinor(amount: string, digits: number): bigint | null {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(amount)
  if (!match) return null
  const [, sign = '', int = '0', frac = ''] = match
  const trimmed = frac.replace(/0+$/, '')
  if (trimmed.length > digits) return null
  const minor = BigInt(int + trimmed.padEnd(digits, '0'))
  return sign ? -minor : minor
}

/** 8412n to "84.12". */
export function fromMinor(minor: bigint, digits: number): string {
  const negative = minor < 0n
  const text = (negative ? -minor : minor).toString().padStart(digits + 1, '0')
  const int = text.slice(0, text.length - digits)
  const frac = digits ? `.${text.slice(text.length - digits)}` : ''
  return `${negative ? '-' : ''}${int}${frac}`
}

function divideRounded(numerator: bigint, denominator: bigint): bigint {
  const negative = numerator < 0n !== denominator < 0n
  const n = numerator < 0n ? -numerator : numerator
  const d = denominator < 0n ? -denominator : denominator
  const q = (n * 2n + d) / (d * 2n)
  return negative ? -q : q
}

/** A decimal string as an integer and its scale: "1.4952" is 14952n, 4. */
function scaled(decimal: string): { value: bigint; scale: number } {
  const [int = '0', frac = ''] = decimal.replace('-', '').split('.')
  const value = BigInt(int + frac)
  return { value: decimal.startsWith('-') ? -value : value, scale: frac.length }
}

/** An amount in minor units of one currency, converted at `rate` to another's. */
export function convertMinor(
  minor: bigint,
  rate: string,
  { from, to }: { from: number; to: number },
): bigint {
  const r = scaled(rate)
  return divideRounded(
    minor * r.value * TEN ** BigInt(to),
    TEN ** BigInt(from + r.scale),
  )
}

/**
 * TRX-06: `total` shared in proportion to `weights` (shares or percentages, decimal
 * strings); the last line takes what rounding left, so the lines always sum to the total.
 */
export function splitMinor(
  total: bigint,
  weights: ReadonlyArray<string>,
): Array<bigint> {
  const scale = Math.max(0, ...weights.map((w) => scaled(w).scale))
  const units = weights.map((w) => {
    const s = scaled(w)
    return s.value * TEN ** BigInt(scale - s.scale)
  })
  const sum = units.reduce((a, b) => a + b, 0n)
  if (sum === 0n) return weights.map(() => 0n)
  let done = 0n
  return units.map((unit, i) => {
    const share =
      i === units.length - 1 ? total - done : divideRounded(total * unit, sum)
    done += share
    return share
  })
}

/** Percentages (decimal strings) that total exactly 100. */
export function isHundred(percents: ReadonlyArray<string>): boolean {
  return percents.reduce((a, p) => a + (toMinor(p, 4) ?? 0n), 0n) === 1000000n
}

/** `percent` of `total`, rounded to the minor unit. */
export function percentOf(total: bigint, percent: string): bigint {
  const p = scaled(percent)
  return divideRounded(total * p.value, 100n * TEN ** BigInt(p.scale))
}

/** `part` as a fraction of `whole`, a decimal string to three places for Intl percent. */
export function ratio(part: bigint, whole: bigint): string | null {
  if (whole === 0n) return null
  return fromMinor(divideRounded(part * 1000n, whole), 3)
}

/** "1 250,50", "-500" or "1250.5" to a plain decimal string; null when not an amount. */
export function parseAmount(input: string): string | null {
  const cleaned = input.replace(/[\s\u00a0\u202f]/g, '').replace(',', '.')
  if (!/^-?\d{1,15}(\.\d{1,4})?$/.test(cleaned)) return null
  return cleaned
}

/** Compares decimal strings exactly, without going through a float (ADR-004). */
export function compareDecimal(a: string, b: string): number {
  const negA = a.startsWith('-')
  const negB = b.startsWith('-')
  if (negA !== negB) return negA ? -1 : 1
  const [intA = '', fracA = ''] = a.replace('-', '').split('.')
  const [intB = '', fracB = ''] = b.replace('-', '').split('.')
  const width = Math.max(fracA.length, fracB.length)
  const digitsA = intA.replace(/^0+(?=\d)/, '') + fracA.padEnd(width, '0')
  const digitsB = intB.replace(/^0+(?=\d)/, '') + fracB.padEnd(width, '0')
  const magnitude =
    digitsA.length - digitsB.length || digitsA.localeCompare(digitsB)
  const sign = Math.sign(magnitude)
  return negA ? -sign : sign
}

/** The sign dropped: the transaction form types amounts unsigned, the kind carries it. */
export function absDecimal(decimal: string): string {
  return decimal.replace(/^-/, '')
}

function decimalSeparator(locale: Locale): string {
  return (
    new Intl.NumberFormat(FORMAT_LOCALE[locale])
      .formatToParts(1.5)
      .find((part) => part.type === 'decimal')?.value ?? '.'
  )
}

/**
 * A stored decimal ("-84.1200") as typed in this locale: "-84,12" with the currency's
 * decimals at least, or "1,5" for a share or percentage (`currency` null).
 */
export function amountForInput(
  amount: string,
  currency: string | null,
  locale: Locale,
): string {
  const digits = currency === null ? 0 : minorDigits(currency)
  const minor = toMinor(amount, 4)
  const [int = '0', frac = ''] = (
    minor === null ? amount : fromMinor(minor, 4)
  ).split('.')
  const kept = frac.replace(/0+$/, '').padEnd(digits, '0')
  return kept ? `${int}${decimalSeparator(locale)}${kept}` : int
}
