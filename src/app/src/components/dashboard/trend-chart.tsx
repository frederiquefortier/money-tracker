import { useTranslation } from 'react-i18next'
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'recharts'
import {
  CHART_MARGIN,
  bucketTick,
  bucketTitle,
  drawn,
  moneyAxis,
  progressCells,
  tooltipFor,
} from '#/components/dashboard/chart-parts'
import type { ChartSeries } from '#/components/dashboard/chart-parts'
import { ChartContainer, ChartTooltip } from '#/components/ui/chart'
import { useLocale } from '#/hooks/app/use-locale'
import { cn } from '#/lib/utils'

// Grey, so the line reads over bars of any colour.
const LAST_YEAR_COLOR = 'var(--muted-foreground)'

// Paler than the bars, so the year shown stays first (author, 2026-11-20).
const LAST_YEAR_LINE = {
  type: 'linear',
  stroke: LAST_YEAR_COLOR,
  strokeWidth: 2,
  strokeDasharray: '4 4',
  strokeOpacity: 0.45,
  dot: false,
  isAnimationActive: false,
} as const

type LastYear = { values: ReadonlyArray<string | null>; label: string }

/** The series, each key's figures for the tooltip, and the drawn rows. */
function trendData({
  keys,
  values,
  lastYear,
  label,
  color,
}: {
  keys: ReadonlyArray<string>
  values: ReadonlyArray<string | null>
  lastYear: LastYear | null
  label: string
  color: string
}) {
  const series: Array<ChartSeries> = [
    { key: 'value', label, color },
    ...(lastYear
      ? [
          {
            key: 'lastYear',
            label: lastYear.label,
            color: LAST_YEAR_COLOR,
            dashed: true,
          },
        ]
      : []),
  ]
  const byKey = new Map(
    keys.map((key, i) => [
      key,
      {
        value: values[i] ?? null,
        ...(lastYear ? { lastYear: lastYear.values[i] ?? null } : {}),
      },
    ]),
  )
  const rows = keys.map((key, i) => ({
    key,
    value: drawn(values[i]),
    lastYear: drawn(lastYear?.values[i]),
  }))
  return { series, byKey, rows }
}

/**
 * One series over the table's months (or years), opened from its trend: a bar each, in
 * its colour, the one not over yet lighter. On a year, the same months a year earlier as a
 * dashed line (author, 2026-11-20).
 */
export function TrendChart({
  keys,
  values,
  lastYear = null,
  label,
  color,
  current,
  currency,
  className,
}: {
  /** "2026-03" or "2026", oldest first, one per value. */
  keys: ReadonlyArray<string>
  values: ReadonlyArray<string | null>
  /** One per key, a year earlier; its label is that year. */
  lastYear?: LastYear | null
  label: string
  color: string
  current: string
  currency: string
  className?: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const { series, byKey, rows } = trendData({
    keys,
    values,
    lastYear,
    label,
    color,
  })
  return (
    <ChartContainer
      config={Object.fromEntries(series.map((s) => [s.key, s]))}
      className={cn('aspect-auto h-44 w-full', className)}
    >
      <ComposedChart data={rows} margin={CHART_MARGIN}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="key"
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={4}
          tickFormatter={bucketTick(locale, current)}
        />
        <YAxis
          {...moneyAxis(
            rows.flatMap((r) => [r.value, r.lastYear]),
            currency,
            locale,
          )}
        />
        <ChartTooltip
          cursor={{ fill: 'var(--secondary)' }}
          content={tooltipFor({
            series,
            currency,
            titleOf: bucketTitle(locale, current, t),
            figuresOf: (key) => byKey.get(key),
          })}
        />
        <Bar
          dataKey="value"
          fill={color}
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
          isAnimationActive={false}
        >
          {progressCells(rows, current)}
        </Bar>
        {lastYear && <Line dataKey="lastYear" {...LAST_YEAR_LINE} />}
      </ComposedChart>
    </ChartContainer>
  )
}
