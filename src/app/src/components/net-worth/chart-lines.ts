import { MONTHLY_UP_TO } from '#/lib/net-worth/net-worth-range'
import { formatMonth } from '#/lib/shared/format'
import type { Locale } from '#/i18n/locales'
import type { ItemGroup, SeriesPoint } from '#/lib/net-worth/net-worth-series'

// The hub's colours, shared by the charts, the composition and the item list.

export const TOTAL_COLOR = 'var(--chart-1)'

export const GROUP_COLORS: Record<ItemGroup, string> = {
  accounts: 'oklch(0.72 0.11 230)',
  investments: 'var(--income)',
  assets: 'oklch(0.78 0.12 85)',
  debts: 'var(--destructive)',
}

/** A legend entry: what a colour stands for. */
export type ChartLine = { key: string; label: string; color: string }

/** Over a year and a half, one tick at each year's first point; under it, months. */
export function xTicks(points: ReadonlyArray<SeriesPoint>, locale: Locale) {
  const byYear = points.length > MONTHLY_UP_TO
  const yearOf = (i: number) => points[i]?.date.slice(0, 4)
  return {
    ticks: byYear
      ? points
          .filter((_, i) => i === 0 || yearOf(i) !== yearOf(i - 1))
          .map((p) => p.date)
      : undefined,
    tick: (date: string) =>
      byYear ? date.slice(0, 4) : formatMonth(date, locale, 'short'),
  }
}
