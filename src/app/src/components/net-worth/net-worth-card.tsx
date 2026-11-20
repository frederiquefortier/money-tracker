import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { ChangeBars } from '#/components/net-worth/change-bars'
import { TOTAL_COLOR } from '#/components/net-worth/chart-lines'
import { ChangeText } from '#/components/display/change-text'
import { MissingRate, Money } from '#/components/display/money'
import { HideItemsButton } from '#/components/net-worth/hide-items-sheet'
import { NetWorthChart } from '#/components/net-worth/net-worth-chart'
import { cardSurface } from '#/components/styles'
import { rangeChange, rangeMonths } from '#/lib/net-worth/net-worth-range'
import { changeSinceStart } from '#/lib/net-worth/net-worth-since'
import { useFormatLocale } from '#/hooks/app/use-locale'
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

/**
 * Tout: "▲ 202 516 $ depuis 2018 · ×12,3", then "22 502 $ par an en moyenne" (author,
 * 2026-11-19: the compounded percent per year read as a return, and the multiple moved
 * here from the dashboard).
 */
function SinceStartLines({
  chart,
  currency,
}: {
  chart: NetWorthChartState
  currency: string
}) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const since = changeSinceStart(chart.points, 'total')
  if (!since) return null
  return (
    <>
      <p className="flex flex-wrap items-baseline gap-x-1.5">
        <ChangeText change={since.change} currency={currency} whole />
        <span className="text-xs text-muted-foreground">
          {t('netWorth.change.since', { year: since.since.slice(0, 4) })}
        </span>
        {since.multiple !== null && (
          <span className="text-xs font-semibold">
            {t('netWorth.change.multiple', {
              multiple: new Intl.NumberFormat(locale, {
                maximumFractionDigits: 1,
              }).format(Number(since.multiple)),
            })}
          </span>
        )}
      </p>
      {since.perYear !== null && (
        <p className="text-xs text-muted-foreground">
          <Money amount={since.perYear} currency={currency} whole />{' '}
          {t('netWorth.change.perYearAverage')}
        </p>
      )}
    </>
  )
}

/**
 * The net worth without the hidden items (ADR-058) and its change over the range. The page
 * title names it. A missing rate shows MissingRate, never a partial sum.
 */
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
      {shown === null ? (
        <MissingRate />
      ) : (
        <Money
          amount={shown}
          currency={currency}
          converted={converted}
          whole
          className="text-3xl font-bold"
        />
      )}
      {chart.range === 'all' && (
        <SinceStartLines chart={chart} currency={currency} />
      )}
      {change && chart.range !== 'all' && (
        <p className="flex flex-wrap items-baseline gap-x-1.5">
          <ChangeText change={change} currency={currency} whole />
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
 * The hub's main card (NW-04): the net worth and its change over the range with the eye
 * that hides items from it, then its line on its own scale and what moved it, month by
 * month or year by year.
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
      <div className="flex items-start justify-between gap-3">
        <Headline
          chart={chart}
          total={total}
          currency={currency}
          converted={converted}
        />
        {chart.counted.length + chart.leftOut > 0 && (
          <HideItemsButton chart={chart} />
        )}
      </div>
      {chart.points.length > 1 && (
        <>
          <NetWorthChart
            points={chart.points}
            dataKey="total"
            color={TOTAL_COLOR}
            label={t('netWorth.chart.lines.total')}
            currency={currency}
            className="h-64"
          />
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
