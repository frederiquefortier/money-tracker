import { fromMinor, toMinor } from '#/lib/shared/money'
import { HOLDING_KINDS } from '#/lib/holdings/holding'
import { isOneOf } from '#/lib/shared/collections'
import type { HoldingKind } from '#/lib/holdings/holding'
import type {
  ChartItem,
  FlowRow,
  SeriesRow,
} from '#/lib/net-worth/net-worth-series'

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
  /** Null when a rate is missing. */
  total: string | null
  /** Some of it is in another currency (CUR-09). */
  converted: boolean
  /** The chart's figures per item per date (ADR-057) and the items it can leave out. */
  series: Array<SeriesRow>
  items: Array<ChartItem>
  /** Each investment's deposits and withdrawals, for its return (ADR-062). */
  flows: Array<FlowRow>
}

const isKind = isOneOf<HoldingKind>(HOLDING_KINDS)

/**
 * Today's net worth as the hub shows it: the open accounts' balances and the open
 * holdings' latest values. The dashboard uses it too, so both pages show one figure.
 */
export function todayTotal({
  balances,
  accounts,
  holdings,
  totals,
}: {
  balances: ReadonlyArray<{
    account_id: string | null
    display_balance: string | null
  }>
  accounts: ReadonlyArray<{ id: string; closed_on: string | null }>
  holdings: ReadonlyArray<{
    id: string
    kind: string
    closed_on: string | null
  }>
  totals: ReadonlyArray<{
    holding_id: string | null
    latest_on: string | null
    display_value: string | null
  }>
}): string | null {
  const open = new Set(
    accounts.filter((a) => a.closed_on === null).map((a) => a.id),
  )
  const accountTotal = sumAmounts(
    balances
      .filter((b) => b.account_id !== null && open.has(b.account_id))
      .map((b) => b.display_balance),
  )
  const byHolding = new Map(totals.map((t) => [t.holding_id, t]))
  const summary = summarizeHoldings(
    holdings
      .filter((h) => h.closed_on === null)
      .flatMap((h) => {
        if (!isKind(h.kind)) return []
        const row = byHolding.get(h.id)
        return [
          {
            kind: h.kind,
            latestOn: row?.latest_on ?? null,
            displayValue: row?.display_value ?? null,
          },
        ]
      }),
  )
  return sumAmounts([accountTotal, summary.total])
}
