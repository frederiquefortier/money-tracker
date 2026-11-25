import { useTranslation } from 'react-i18next'
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CHART_MARGIN,
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
import { usePrivacy } from '#/hooks/app/use-privacy'
import type { CumulativePoint } from '#/lib/dashboard/money-flows'

type Points = ReadonlyArray<CumulativePoint>
type Row = Record<
  'income' | 'spent' | 'lastIncome' | 'lastSpent',
  number | null
>

// The plot's height in pixels, near enough to keep two end labels apart.
const CHART_HEIGHT = 256
const PLOT_HEIGHT = CHART_HEIGHT - 40
const LABEL_GAP = 14
// Room at the right for last year's labels, past December.
const GUTTER = 44

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

/** The last month a series draws, and its value there. */
function lineEnd(rows: ReadonlyArray<Row>, key: keyof Row) {
  for (let i = rows.length - 1; i >= 0; i--) {
    const value = rows[i]?.[key]
    if (value != null) return { index: i, value }
  }
  return null
}

/**
 * Last year's two labels sit at December past the plot; when their lines end close, each
 * moves half the missing room away from the other, in pixels.
 */
function gutterShifts(rows: ReadonlyArray<Row>, domain: [number, number]) {
  const income = lineEnd(rows, 'lastIncome')
  const spent = lineEnd(rows, 'lastSpent')
  if (!income || !spent) return { lastIncome: 0, lastSpent: 0 }
  const perUnit = PLOT_HEIGHT / (domain[1] - domain[0] || 1)
  const apart = Math.abs(income.value - spent.value) * perUnit
  const push = apart >= LABEL_GAP ? 0 : (LABEL_GAP - apart) / 2
  const incomeUp = income.value >= spent.value
  return {
    lastIncome: incomeUp ? -push : push,
    lastSpent: incomeUp ? push : -push,
  }
}

/**
 * A line's name at its end, drawn by its last point: this year's at its head, income
 * above and spending below; last year's by the year, past December.
 */
function endLabel(
  s: ChartSeries,
  {
    rows,
    shifts,
    year,
  }: {
    rows: ReadonlyArray<Row>
    shifts: Record<'lastIncome' | 'lastSpent', number>
    year: string
  },
) {
  const end = lineEnd(rows, s.key as keyof Row)
  if (!end) return null
  return function EndLabel(props: {
    x?: number | string
    y?: number | string
    index?: number
  }) {
    if (props.index !== end.index) return null
    const x = Number(props.x)
    const y = Number(props.y)
    if (s.dashed)
      return (
        <text
          x={x + 6}
          y={y + shifts[s.key as 'lastIncome' | 'lastSpent']}
          dominantBaseline="middle"
          fill={s.color}
          className="text-xs"
        >
          {Number(year) - 1}
        </text>
      )
    return (
      <text
        x={x}
        y={s.key === 'income' ? y - 8 : y + 22}
        textAnchor="end"
        fill={s.color}
        className="text-xs font-semibold"
      >
        {s.label}
      </text>
    )
  }
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
 * dashed across the whole year: the pace to compare with. Each line is named where it
 * ends, in place of a legend (author, 2026-11-20).
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
  const { figuresHidden } = usePrivacy()
  const series = useSeries(Number(year), lastYear !== null)
  const { rows, figuresOf } = chartData(points, lastYear, year)
  const axis = moneyAxis(
    rows.flatMap((r) => [r.income, r.spent, r.lastIncome, r.lastSpent]),
    { currency, locale, figuresHidden },
  )
  const shifts = gutterShifts(rows, axis.domain)
  return (
    <DashboardCard title={t('dashboard.flows.cumulative')}>
      <ChartContainer
        config={Object.fromEntries(series.map((s) => [s.key, s]))}
        className="aspect-auto h-64 w-full"
      >
        <LineChart
          data={rows}
          margin={{
            ...CHART_MARGIN,
            right: lastYear ? GUTTER : 16,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="key"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={4}
            tickFormatter={(key: string) => bucketLabel(key, locale)}
          />
          <YAxis {...axis} />
          <ChartTooltip
            content={tooltipFor({
              series,
              currency,
              titleOf: bucketTitle(locale, current, t),
              figuresOf,
            })}
          />
          {series.map((s) => {
            const label = endLabel(s, { rows, shifts, year })
            return (
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
              >
                {label && <LabelList dataKey={s.key} content={label} />}
              </Line>
            )
          })}
        </LineChart>
      </ChartContainer>
    </DashboardCard>
  )
}
