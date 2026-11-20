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
import type { ChartSeries } from '#/components/dashboard/chart-parts'
import { ChartContainer, ChartTooltip } from '#/components/ui/chart'
import { useLocale } from '#/hooks/app/use-locale'
import type { CategoryStacks } from '#/lib/dashboard/category-stacks'

/** The height each bucket's stack reaches, and how far below zero it goes. */
function stackExtent(
  rows: ReadonlyArray<Record<string, number | string | null>>,
) {
  return rows.flatMap((r) => {
    const values = Object.values(r).filter(
      (v): v is number => typeof v === 'number',
    )
    const up = values.filter((v) => v > 0).reduce((a, b) => a + b, 0)
    const down = values.filter((v) => v < 0).reduce((a, b) => a + b, 0)
    return [up, down]
  })
}

/** Each bucket's bar, stacked by series; the tooltip reads the string figures. */
export function StackedBars({
  series,
  rows: stackRows,
  current,
  currency,
}: {
  series: ReadonlyArray<ChartSeries>
  rows: CategoryStacks['rows']
  current: string
  currency: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const byBucket = new Map(stackRows.map((r) => [r.bucket, r.values]))
  const rows = stackRows.map((r) => ({
    key: r.bucket,
    ...Object.fromEntries(series.map((s) => [s.key, drawn(r.values[s.key])])),
  }))
  return (
    <ChartContainer
      // Recharts stacks bars in the order they mounted; a new set of series remounts the
      // chart so the largest stays at the bottom.
      key={series.map((s) => s.key).join()}
      config={Object.fromEntries(series.map((s) => [s.key, s]))}
      className="aspect-auto h-64 w-full"
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
        <YAxis {...moneyAxis(stackExtent(rows), currency, locale)} />
        <ChartTooltip
          cursor={{ fill: 'var(--secondary)' }}
          content={tooltipFor({
            series,
            currency,
            titleOf: bucketTitle(locale, current, t),
            figuresOf: (key) => byBucket.get(key),
          })}
        />
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            stackId="stack"
            fill={s.color}
            stroke="var(--card)"
            strokeWidth={1}
            maxBarSize={48}
            isAnimationActive={false}
          >
            {progressCells(rows, current)}
          </Bar>
        ))}
      </BarChart>
    </ChartContainer>
  )
}
