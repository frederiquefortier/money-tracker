import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  CHART_MARGIN,
  bucketTick,
  bucketTitle,
  drawn,
  moneyAxis,
  progressCells,
  tooltipFor,
} from '#/components/dashboard/chart-parts'
import { ChartContainer, ChartTooltip } from '#/components/ui/chart'
import { useLocale } from '#/hooks/app/use-locale'

/**
 * One category over the table's months (or years), opened from its trend: a bar each, in
 * the category's colour, the one not over yet lighter.
 */
export function TrendChart({
  keys,
  values,
  label,
  color,
  current,
  currency,
}: {
  /** "2026-03" or "2026", oldest first, one per value. */
  keys: ReadonlyArray<string>
  values: ReadonlyArray<string | null>
  label: string
  color: string
  current: string
  currency: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const series = [{ key: 'value', label, color }]
  const byKey = new Map(keys.map((key, i) => [key, values[i] ?? null]))
  const rows = keys.map((key, i) => ({ key, value: drawn(values[i]) }))
  return (
    <ChartContainer
      config={{ value: series[0] }}
      className="aspect-auto h-44 w-full"
    >
      <BarChart data={rows} margin={CHART_MARGIN}>
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
            rows.map((r) => r.value),
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
            figuresOf: (key) =>
              byKey.has(key) ? { value: byKey.get(key) ?? null } : undefined,
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
      </BarChart>
    </ChartContainer>
  )
}
