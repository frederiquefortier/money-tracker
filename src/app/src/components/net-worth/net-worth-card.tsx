import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { ChangeBars } from '#/components/net-worth/change-bars'
import { TOTAL_COLOR } from '#/components/net-worth/chart-lines'
import { ChangeText } from '#/components/net-worth/change-text'
import { Total } from '#/components/net-worth/hub-cards'
import { NetWorthChart } from '#/components/net-worth/net-worth-chart'
import { RangeTabs } from '#/components/net-worth/range-tabs'
import { cardSurface } from '#/components/styles'
import { rangeChange, rangeMonths } from '#/lib/net-worth/net-worth-range'
import { cn } from '#/lib/utils'
import type { NetWorthChartState } from '#/hooks/net-worth/use-net-worth-chart'
import type { SeriesRange } from '#/lib/net-worth/net-worth-range'

/** "sur 3 mois", "sur 5 ans", or "depuis 2019" for Tout. */
function rangeText(
  range: SeriesRange,
  first: string | undefined,
  t: TFunction,
): string {
  const months = rangeMonths(range)
  if (months === null)
    return t('netWorth.change.since', { year: first?.slice(0, 4) ?? '' })
  const period =
    months % 12 === 0
      ? t('netWorth.chart.years', { count: months / 12 })
      : t('netWorth.chart.months', { count: months })
  return t('netWorth.change.over', { period })
}

/** The net worth without the hidden items (ADR-058) and its change over the range. */
function Headline({
  chart,
  total,
  currency,
  converted,
}: {
  chart: NetWorthChartState
  /** Today's total with everything, as the hub computes it. */
  total: string | null
  currency: string
  converted: boolean
}) {
  const { t } = useTranslation()
  const shown =
    chart.leftOut > 0 ? (chart.totals.at(-1)?.values.total ?? null) : total
  const change = rangeChange(chart.points, 'total', chart.range)
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-sm text-muted-foreground">
        {t('netWorth.chart.lines.total')}
      </h2>
      <Total
        total={shown}
        currency={currency}
        converted={converted}
        className="text-3xl font-bold"
      />
      {change && (
        <p className="flex flex-wrap items-baseline gap-x-1.5">
          <ChangeText change={change} currency={currency} />
          <span className="text-xs text-muted-foreground">
            {rangeText(
              chart.range,
              change.perYearFrom ?? chart.points[0]?.date,
              t,
            )}
          </span>
        </p>
      )}
    </div>
  )
}

/**
 * The hub's main card (NW-04): the net worth and its change over the range, the range's
 * tabs, then its line on its own scale and what moved it, month by month or year by year.
 */
export function NetWorthCard({
  chart,
  total,
  currency,
  converted,
}: {
  chart: NetWorthChartState
  total: string | null
  currency: string
  converted: boolean
}) {
  const { t } = useTranslation()
  return (
    <section className={cn(cardSurface, 'flex flex-col gap-5 px-5 py-5')}>
      <Headline
        chart={chart}
        total={total}
        currency={currency}
        converted={converted}
      />
      {chart.points.length > 1 && (
        <>
          <div className="flex flex-col gap-3">
            <RangeTabs range={chart.range} onChange={chart.setRange} />
            <NetWorthChart
              points={chart.points}
              dataKey="total"
              color={TOTAL_COLOR}
              label={t('netWorth.chart.lines.total')}
              currency={currency}
              className="h-64"
            />
          </div>
          <ChangeBars
            points={chart.points}
            groups={chart.groups}
            currency={currency}
          />
        </>
      )}
    </section>
  )
}
