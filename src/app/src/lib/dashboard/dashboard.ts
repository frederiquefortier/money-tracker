import type { Category, CategoryKind } from '#/lib/categories/category'
import { fromMinor, toMinor } from '#/lib/shared/money'

// What the dashboard counts: my_monthly, my share net of repayments per month and
// category in the display currency (ADR-063).

export const DIGITS = 4

export type MonthAmount = {
  /** "2026-03" */
  month: string
  categoryId: string
  /** Signed like the transactions; null when a rate is missing. */
  amount: string | null
}

export type Dashboard = {
  displayCurrency: string
  /** The year of the first transaction, where Tout and the year menu start. */
  firstYear: number
  months: Array<MonthAmount>
  categories: Array<Category>
}

/** A running sum that turns null at the first missing figure and stays null. */
export class Sum {
  minor: bigint | null = 0n
  add(amount: string | null, sign: bigint = 1n) {
    if (this.minor === null) return
    const minor = amount === null ? null : toMinor(amount, DIGITS)
    this.minor = minor === null ? null : this.minor + minor * sign
  }
  plus(other: Sum) {
    if (this.minor === null || other.minor === null) this.minor = null
    else this.minor += other.minor
  }
  get value(): string | null {
    return this.minor === null ? null : fromMinor(this.minor, DIGITS)
  }
}

/** Expenses and investments read as positive outflows, incomes as received. */
export function readSign(kind: CategoryKind): bigint {
  return kind === 'income' ? 1n : -1n
}
