import { useTranslation } from 'react-i18next'
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import {
  CHART_MARGIN,
  ChartLegendRow,
  FLOW_COLORS,
  bucketLabel,
  bucketTitle,
  drawn,
  moneyAxis,
  tooltipFor,
} from '#/components/dashboard/chart-parts'
import type { ChartSeries } from '#/components/dashboard/chart-parts'
import { DashboardCard } from '#/components/dashboard/dashboard-card'
import { ChartContainer, ChartTooltip } from '#/components/ui/chart'
import { useLocale } from '#/hooks/app/use-locale'
import type { CumulativePoint } from '#/lib/dashboard/money-flows'

type Points = ReadonlyArray<CumulativePoint>

function useSeries(year: number, hasLastYear: boolean): Array<ChartSeries> {
  const { t } = useTranslation()
  const now: Array<ChartSeries> = [
    {
      key: 'income',
      label: t('dashboard.flows.cumulativeIncome', { year: year - 1 }),
      color: FLOW_COLORS.earned,
    },
    {
      key: 'spent',
      label: t('dashboard.flows.cumulativeSpent'),
      color: FLOW_COLORS.spent,
    },
  ]
  if (!hasLastYear) return now
  return [
    ...now,
    {
      key: 'lastIncome',
      label: t('dashboard.flows.lastIncome', {
        year: year - 1,
        before: year - 2,
      }),
      color: FLOW_COLORS.earned,
      dashed: true,
    },
    {
      key: 'lastSpent',
      label: t('dashboard.flows.lastSpent', { year: year - 1 }),
      color: FLOW_COLORS.spent,
      dashed: true,
    },
  ]
}

/** Each month of the year: its figures as strings for the tooltip, as numbers to draw. */
function chartData(points: Points, lastYear: Points | null, year: string) {
  const byMonth = new Map(points.map((p) => [p.month, p]))
  const figuresOf = (month: string) => {
    const p = byMonth.get(month)
    const before = lastYear?.[Number(month.slice(5)) - 1]
    return {
      ...(p && { income: p.income, spent: p.spent }),
      ...(before && { lastIncome: before.income, lastSpent: before.spent }),
    }
  }
  const rows = Array.from({ length: 12 }, (_, i) => {
    const key = `${year}-${String(i + 1).padStart(2, '0')}`
    const f = figuresOf(key)
    return {
      key,
      income: drawn(f.income),
      spent: drawn(f.spent),
      lastIncome: drawn(f.lastIncome),
      lastSpent: drawn(f.lastSpent),
    }
  })
  return { rows, figuresOf }
}

/**
 * The year's income on top of what earlier years left, against what was spent, as two
 * lines that stop at this month (author, 2026-11-19: no fill), and last year's two lines
 * dashed across the whole year: the pace to compare with.
 */
export function CumulativeChart({
  points,
  lastYear,
  year,
  current,
  currency,
}: {
  points: Points
  /** Last year's 12 months, the same way; null before the first year. */
  lastYear: Points | null
  year: string
  current: string
  currency: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const series = useSeries(Number(year), lastYear !== null)
  const { rows, figuresOf } = chartData(points, lastYear, year)
  return (
    <DashboardCard title={t('dashboard.flows.cumulative')}>
      <ChartContainer
        config={Object.fromEntries(series.map((s) => [s.key, s]))}
        className="aspect-auto h-64 w-full"
      >
        <LineChart data={rows} margin={{ ...CHART_MARGIN, right: 16 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="key"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={4}
            tickFormatter={(key: string) => bucketLabel(key, locale)}
          />
          <YAxis
            {...moneyAxis(
              rows.flatMap((r) => [
                r.income,
                r.spent,
                r.lastIncome,
                r.lastSpent,
              ]),
              currency,
              locale,
            )}
          />
          <ChartTooltip
            content={tooltipFor({
              series,
              currency,
              titleOf: bucketTitle(locale, current, t),
              figuresOf,
            })}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              dataKey={s.key}
              type="linear"
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dashed ? '4 4' : undefined}
              strokeOpacity={s.dashed ? 0.7 : 1}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ChartContainer>
      <ChartLegendRow series={series} />
    </DashboardCard>
  )
}
