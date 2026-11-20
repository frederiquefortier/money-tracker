import type { TFunction } from 'i18next'
import { Cell } from 'recharts'
import { Figure } from '#/components/dashboard/dashboard-card'
import { axisTicks } from '#/lib/dashboard/axis-ticks'
import { formatAxisMoney, formatMonth } from '#/lib/shared/format'
import type { Locale } from '#/i18n/locales'
import { cn } from '#/lib/utils'

export const CHART_MARGIN = { top: 8, right: 4, bottom: 0, left: 4 }

/** The money flows' colours, the same in every card (author, 2026-11-19). */
export const FLOW_COLORS = {
  earned: 'var(--flow-earned)',
  spent: 'var(--flow-spent)',
  invested: 'var(--flow-invested)',
  remaining: 'var(--flow-remaining)',
} as const

/** The month (or year) not over yet: drawn lighter, named so in the tooltip. */
const IN_PROGRESS_OPACITY = 0.45

/** A bar's cells, the bucket not over yet lighter. Called, not rendered, for Recharts. */
export function progressCells(
  rows: ReadonlyArray<{ key: string }>,
  current: string,
) {
  return rows.map((r) => (
    <Cell
      key={r.key}
      fillOpacity={r.key === current ? IN_PROGRESS_OPACITY : 1}
    />
  ))
}

/** A series as the legend and the tooltip name it. */
export type ChartSeries = {
  key: string
  label: string
  color: string
  dashed?: boolean
}

/** "janv." for a month of a year, "2024" for a year of everything. */
export function bucketLabel(bucket: string, locale: Locale): string {
  return bucket.length === 4 ? bucket : formatMonth(bucket, locale, 'short')
}

/** The axis label; a month still to come keeps its slot without a name. */
export function bucketTick(locale: Locale, current: string) {
  return (bucket: string) =>
    bucket > current ? '' : bucketLabel(bucket, locale)
}

/** The tooltip's title: the month or year, marked while it is not over. */
export function bucketTitle(locale: Locale, current: string, t: TFunction) {
  return (bucket: string) => {
    const name = bucket.length === 4 ? bucket : formatMonth(bucket, locale)
    return bucket === current
      ? `${name} · ${t('dashboard.flows.inProgress')}`
      : name
  }
}

/** A money axis in round steps over the values drawn. */
export function moneyAxis(
  values: ReadonlyArray<number | null>,
  currency: string,
  locale: Locale,
) {
  const ticks = axisTicks(values.filter((v): v is number => v !== null))
  return {
    width: 60,
    tickLine: false,
    axisLine: false,
    ticks,
    domain: [ticks[0], ticks[ticks.length - 1]] as [number, number],
    interval: 0 as const,
    tickFormatter: (v: number) => formatAxisMoney(v, currency, locale),
  }
}

function Swatch({ series }: { series: ChartSeries }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'shrink-0',
        series.dashed
          ? 'h-0 w-3 border-t-2 border-dashed'
          : 'size-2.5 rounded-sm',
      )}
      style={
        series.dashed
          ? { borderColor: series.color }
          : { backgroundColor: series.color }
      }
    />
  )
}

/** The swatches under a chart: identity never rests on colour alone (dataviz rule). */
export function ChartLegendRow({
  series,
}: {
  series: ReadonlyArray<ChartSeries>
}) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <Swatch series={s} />
          {s.label}
        </li>
      ))}
    </ul>
  )
}

/**
 * Recharts' tooltip, showing each series' figure as its string, never the drawn number.
 * `figuresOf` gives a point's figures by series key.
 */
export function tooltipFor({
  series,
  currency,
  titleOf,
  figuresOf,
}: {
  series: ReadonlyArray<ChartSeries>
  currency: string
  titleOf: (key: string) => string
  figuresOf: (key: string) => Partial<Record<string, string | null>> | undefined
}) {
  return function Content({
    active,
    payload,
  }: {
    active?: boolean
    payload?: ReadonlyArray<{ payload?: unknown }>
  }) {
    const key = (payload?.[0]?.payload as { key?: string } | undefined)?.key
    const figures = key === undefined ? undefined : figuresOf(key)
    if (!active || key === undefined || !figures) return null
    const shown = series.filter((s) => s.key in figures)
    return (
      <div className="grid gap-1 rounded-lg border bg-background px-3 py-2 text-xs shadow-xl">
        <p className="font-semibold first-letter:uppercase">{titleOf(key)}</p>
        {shown.map((s) => (
          <p key={s.key} className="flex items-center gap-2">
            <Swatch series={s} />
            <span className="flex-1 text-muted-foreground">{s.label}</span>
            <Figure amount={figures[s.key] ?? null} currency={currency} />
          </p>
        ))}
      </div>
    )
  }
}

/** A figure for drawing; a missing one draws nothing. */
export const drawn = (amount: string | null | undefined) =>
  amount === null || amount === undefined ? null : Number(amount)
