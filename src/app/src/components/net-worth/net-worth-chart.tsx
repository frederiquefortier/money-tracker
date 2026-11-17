import { useId } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { MissingRate, Money } from '#/components/display/money'
import { ChartContainer, ChartTooltip } from '#/components/ui/chart'
import { xTicks } from '#/components/net-worth/chart-lines'
import { axisTicks, chartRows } from '#/lib/net-worth/net-worth-series'
import {
  formatAxisMoney,
  formatDate,
  formatMonth,
  todayIso,
} from '#/lib/shared/format'
import { useLocale } from '#/hooks/app/use-locale'
import { cn } from '#/lib/utils'
import type { Locale } from '#/i18n/locales'
import type { SeriesPoint } from '#/lib/net-worth/net-worth-series'

const MARGIN = { top: 8, right: 4, bottom: 0, left: 4 }

/** Recharts' tooltip, showing the point's figure as a string, never the drawn number. */
function tooltipFor({
  points,
  dataKey,
  currency,
  locale,
}: {
  points: ReadonlyArray<SeriesPoint>
  dataKey: string
  currency: string
  locale: Locale
}) {
  const byDate = new Map(points.map((p) => [p.date, p]))
  return function Content({
    active,
    payload,
  }: {
    active?: boolean
    payload?: ReadonlyArray<{ payload?: unknown }>
  }) {
    const row = payload?.[0]?.payload as { date?: string } | undefined
    const point = row?.date === undefined ? undefined : byDate.get(row.date)
    const value = point?.values[dataKey]
    if (!active || !point || value === undefined) return null
    return (
      <div className="grid gap-1 rounded-lg border bg-background px-3 py-2 text-xs shadow-xl">
        <p className="font-semibold capitalize">
          {point.date === todayIso()
            ? formatDate(point.date, locale, 'medium')
            : formatMonth(point.date, locale)}
        </p>
        {value === null ? (
          <MissingRate />
        ) : (
          <Money amount={value} currency={currency} />
        )}
      </div>
    )
  }
}

/**
 * One figure over time on its own scale, so its slope fills the chart: the net worth on the
 * hub, or an item opened in the list (NW-04). A missing rate leaves a gap.
 */
export function NetWorthChart({
  points,
  dataKey,
  color,
  label,
  currency,
  className,
}: {
  points: ReadonlyArray<SeriesPoint>
  dataKey: string
  color: string
  label: string
  currency: string
  className?: string
}) {
  const locale = useLocale()
  const gradient = useId()
  const { ticks, tick } = xTicks(points, locale)
  const rows = chartRows(points, [dataKey])
  const drawn = rows.flatMap((r) =>
    typeof r[dataKey] === 'number' ? [r[dataKey]] : [],
  )
  const y = drawn.length
    ? axisTicks(Math.min(...drawn), Math.max(...drawn))
    : undefined

  return (
    <ChartContainer
      config={{ [dataKey]: { label, color } }}
      className={cn('aspect-auto w-full', className)}
    >
      <AreaChart data={rows} margin={MARGIN}>
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          minTickGap={24}
          ticks={ticks}
          tickFormatter={tick}
        />
        <YAxis
          width={60}
          ticks={y}
          domain={y ? [y[0], y[y.length - 1]] : undefined}
          interval={0}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) =>
            formatAxisMoney(value, currency, locale)
          }
        />
        <ChartTooltip
          content={tooltipFor({ points, dataKey, currency, locale })}
        />
        <Area
          dataKey={dataKey}
          type="monotone"
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${gradient})`}
          connectNulls={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}
