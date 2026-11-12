import { fromMinor, toMinor } from '#/lib/shared/money'
import { HOLDING_KINDS } from '#/lib/holdings/holding'
import type { HoldingKind } from '#/lib/holdings/holding'

// The hub's figures (NW-10, spec 20). Converted amounts come from the database with four
// decimals whatever the currency, so sums are made at four.
const DIGITS = 4

/** The sum, or null when any amount is null: a missing rate never gives a partial sum (ADR-004). */
export function sumAmounts(
  amounts: ReadonlyArray<string | null>,
): string | null {
  let total = 0n
  for (const amount of amounts) {
    const minor = amount === null ? null : toMinor(amount, DIGITS)
    if (minor === null) return null
    total += minor
  }
  return fromMinor(total, DIGITS)
}

/** What a holding adds to the total: its value in the display currency, debts negative. */
export type HoldingFigure = {
  kind: HoldingKind
  /** Null when no value was recorded yet. */
  latestOn: string | null
  /** Null with no value, or when a rate is missing. */
  displayValue: string | null
}

export type HoldingsSummary = {
  /** Null when a rate is missing. Zero with no holding. */
  total: string | null
  counts: Record<HoldingKind, number>
  /** The most recent value date; null with no value. */
  updatedOn: string | null
}

/** The open holdings that count toward net worth, in the display currency. */
export function summarizeHoldings(
  figures: ReadonlyArray<HoldingFigure>,
): HoldingsSummary {
  const counts = Object.fromEntries(
    HOLDING_KINDS.map((kind) => [
      kind,
      figures.filter((f) => f.kind === kind).length,
    ]),
  ) as Record<HoldingKind, number>
  const signed = figures
    // A holding with no value yet adds nothing.
    .filter((f) => f.latestOn !== null)
    .map((f) =>
      f.displayValue !== null && f.kind === 'debt'
        ? `-${f.displayValue}`
        : f.displayValue,
    )
  const dates = figures.flatMap((f) => (f.latestOn ? [f.latestOn] : []))
  return {
    total: sumAmounts(signed),
    counts,
    updatedOn:
      dates.length > 0 ? dates.reduce((a, b) => (a > b ? a : b)) : null,
  }
}

export type NetWorth = {
  displayCurrency: string
  /** `converted`: some of it is in another currency (CUR-09). */
  accounts: { total: string | null; count: number; converted: boolean }
  holdings: HoldingsSummary & { converted: boolean }
  /** Null when either part has a missing rate. */
  total: string | null
  converted: boolean
}
