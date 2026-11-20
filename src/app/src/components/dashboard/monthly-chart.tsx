import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceArea,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CHART_MARGIN,
  ChartLegendRow,
  FLOW_COLORS,
  bucketTick,
  bucketTitle,
  drawn,
  moneyAxis,
  progressCells,
  tooltipFor,
} from '#/components/dashboard/chart-parts'
import type { ChartSeries } from '#/components/dashboard/chart-parts'
import { DashboardCard } from '#/components/dashboard/dashboard-card'
import { ChartContainer, ChartTooltip } from '#/components/ui/chart'
import { useLocale } from '#/hooks/app/use-locale'
import type { Flows } from '#/lib/dashboard/money-flows'
import { compareDecimal } from '#/lib/shared/money'

const DEFICIT_FILL = 'var(--flow-spent)'

const GAP_FILL = 'var(--muted-foreground)'

/** Earned and spent, then the deficit and gap shadings when the period has them. */
function useSeries({
  hasDeficit,
  hasGap,
}: {
  hasDeficit: boolean
  hasGap: boolean
}) {
  const { t } = useTranslation()
  const flows: Array<ChartSeries> = [
    {
      key: 'earned',
      label: t('dashboard.flows.earned'),
      color: FLOW_COLORS.earned,
    },
    {
      key: 'spent',
      label: t('dashboard.flows.spent'),
      color: FLOW_COLORS.spent,
    },
  ]
  const legend = [...flows]
  if (hasDeficit)
    legend.push({
      key: 'deficit',
      label: t('dashboard.flows.deficit'),
      color: 'color-mix(in oklch, var(--flow-spent) 18%, transparent)',
    })
  if (hasGap)
    legend.push({
      key: 'gap',
      label: t('dashboard.flows.gap'),
      color: 'color-mix(in oklch, var(--muted-foreground) 25%, transparent)',
    })
  return { flows, legend }
}

/** Called, not rendered: Recharts reads its own elements among the chart's children. */
function shadedAreas(buckets: ReadonlyArray<string>, fill: string) {
  return buckets.map((bucket) => (
    <ReferenceArea
      key={bucket}
      x1={bucket}
      x2={bucket}
      fill={fill}
      fillOpacity={0.12}
      ifOverflow="extendDomain"
    />
  ))
}

/** Each bucket's figures as strings for the tooltip, as numbers to draw. */
function chartData(buckets: ReadonlyArray<Flows & { bucket: string }>) {
  const byBucket = new Map(buckets.map((b) => [b.bucket, b]))
  return {
    rows: buckets.map((b) => ({
      key: b.bucket,
      earned: drawn(b.earned),
      spent: drawn(b.spent),
    })),
    figuresOf: (key: string) => {
      const b = byBucket.get(key)
      return b && { earned: b.earned, spent: b.spent }
    },
  }
}

/** The buckets shaded red (a deficit) and grey (a month without any transaction). */
function shadings(
  buckets: ReadonlyArray<Flows & { bucket: string }>,
  missing: ReadonlyArray<string>,
) {
  return {
    deficits: buckets.filter(isDeficit).map((b) => b.bucket),
    gaps: buckets
      .map((b) => b.bucket)
      .filter((b) => missing.some((m) => m === b || m.slice(0, 4) === b)),
  }
}

function isDeficit(b: Flows) {
  return (
    b.earned !== null &&
    b.spent !== null &&
    compareDecimal(b.spent, b.earned) > 0
  )
}

/**
 * Earned and spent side by side, per month of a year or per year of everything. A bucket
 * where spending passed income is shaded red, one with a month without any transaction
 * grey; the one not over yet is drawn lighter.
 */
export function MonthlyChart({
  buckets,
  missing,
  current,
  currency,
  yearly,
}: {
  buckets: ReadonlyArray<Flows & { bucket: string }>
  /** The months without any transaction ("2025-04"). */
  missing: ReadonlyArray<string>
  current: string
  currency: string
  yearly: boolean
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const { deficits, gaps } = shadings(buckets, missing)
  const { flows, legend } = useSeries({
    hasDeficit: deficits.length > 0,
    hasGap: gaps.length > 0,
  })
  const { rows, figuresOf } = chartData(buckets)
  return (
    <DashboardCard
      title={t(yearly ? 'dashboard.flows.byYear' : 'dashboard.flows.byMonth')}
    >
      <ChartContainer
        config={Object.fromEntries(flows.map((s) => [s.key, s]))}
        className="aspect-auto h-64 w-full"
      >
        <BarChart data={rows} margin={CHART_MARGIN} barGap={2}>
          <CartesianGrid vertical={false} />
          {shadedAreas(deficits, DEFICIT_FILL)}
          {shadedAreas(gaps, GAP_FILL)}
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
              rows.flatMap((r) => [r.earned, r.spent]),
              currency,
              locale,
            )}
          />
          <ChartTooltip
            cursor={{ fill: 'var(--secondary)' }}
            content={tooltipFor({
              series: flows,
              currency,
              titleOf: bucketTitle(locale, current, t),
              figuresOf,
            })}
          />
          {flows.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              fill={s.color}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            >
              {progressCells(rows, current)}
            </Bar>
          ))}
        </BarChart>
      </ChartContainer>
      <ChartLegendRow series={legend} />
    </DashboardCard>
  )
}
