import { useNavigate } from '@tanstack/react-router'
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
import { usePrivacy } from '#/hooks/app/use-privacy'
import type { Flows } from '#/lib/dashboard/money-flows'
import { useBarPointer } from '#/hooks/dashboard/use-bar-pointer'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { bucketSearch } from '#/lib/dashboard/drill-down'
import { compareDecimal } from '#/lib/shared/money'

const DEFICIT_FILL = 'var(--flow-spent)'

// The missing months notice's tint (`warningTint`), so the shading reads as that warning.
const GAP_FILL = 'var(--warning)'

/** Earned and spent, named by the summary beside the chart and in the tooltip. */
function useSeries(): Array<ChartSeries> {
  const { t } = useTranslation()
  return [
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
}

/** Called, not rendered: Recharts reads its own elements among the chart's children. */
function shadedAreas(
  buckets: ReadonlyArray<string>,
  fill: string,
  opacity = 0.12,
) {
  return buckets.map((bucket) => (
    <ReferenceArea
      key={bucket}
      x1={bucket}
      x2={bucket}
      fill={fill}
      fillOpacity={opacity}
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

/**
 * The buckets shaded red (a deficit) and grey (a month without any transaction). The one
 * not over yet is never a deficit: its spending may still catch up with its income.
 */
function shadings(
  buckets: ReadonlyArray<Flows & { bucket: string }>,
  missing: ReadonlyArray<string>,
  current: string,
) {
  return {
    deficits: buckets
      .filter((b) => b.bucket !== current && isDeficit(b))
      .map((b) => b.bucket),
    gaps: buckets
      .map((b) => b.bucket)
      .filter((b) => missing.some((m) => m === b || m.slice(0, 4) === b)),
  }
}

/** The tooltip's title, naming a deficit or a month without any transaction. */
function useNotedTitle({
  deficits,
  gaps,
  current,
}: {
  deficits: ReadonlyArray<string>
  gaps: ReadonlyArray<string>
  current: string
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const title = bucketTitle(locale, current, t)
  return (key: string) => {
    if (deficits.includes(key))
      return `${title(key)} · ${t('dashboard.flows.deficit')}`
    if (gaps.includes(key)) return `${title(key)} · ${t('dashboard.flows.gap')}`
    return title(key)
  }
}

/** A bar opens its month's (or year's) income or spending: its kind's categories. */
function useOpenBar(
  period: DashboardPeriod,
  categoryIds: Record<string, ReadonlyArray<string>>,
) {
  const navigate = useNavigate()
  return useBarPointer((series, key) => {
    void navigate({
      to: '/transactions',
      search: bucketSearch(period, key, categoryIds[series]),
    })
  })
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
 * grey, each named in the tooltip; the one not over yet is drawn lighter. A bar opens
 * its transactions.
 */
export function MonthlyChart({
  buckets,
  missing,
  current,
  currency,
  yearly,
  categoryIds,
  period,
}: {
  buckets: ReadonlyArray<Flows & { bucket: string }>
  /** The months without any transaction ("2025-04"). */
  missing: ReadonlyArray<string>
  current: string
  currency: string
  yearly: boolean
  /** The top-level income and expense categories, for a bar's transactions. */
  categoryIds: { earned: ReadonlyArray<string>; spent: ReadonlyArray<string> }
  period: DashboardPeriod
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const { figuresHidden } = usePrivacy()
  const { deficits, gaps } = shadings(buckets, missing, current)
  const flows = useSeries()
  const { rows, figuresOf } = chartData(buckets)
  const titleOf = useNotedTitle({ deficits, gaps, current })
  const { handlers, hoveredIn } = useOpenBar(period, categoryIds)
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
          {shadedAreas(gaps, GAP_FILL, 0.15)}
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
              { currency, locale, figuresHidden },
            )}
          />
          <ChartTooltip
            cursor={false}
            content={tooltipFor({
              series: flows,
              currency,
              titleOf,
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
              {...handlers(s.key)}
            >
              {progressCells(rows, current, hoveredIn(s.key))}
            </Bar>
          ))}
        </BarChart>
      </ChartContainer>
    </DashboardCard>
  )
}
