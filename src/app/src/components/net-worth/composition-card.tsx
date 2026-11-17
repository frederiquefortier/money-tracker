import { useTranslation } from 'react-i18next'
import { MissingRate, Money } from '#/components/display/money'
import { GROUP_COLORS } from '#/components/net-worth/chart-lines'
import { ChangeText } from '#/components/net-worth/change-text'
import { cardSurface } from '#/components/styles'
import { rangeChange } from '#/lib/net-worth/net-worth-range'
import { STACK_KEYS } from '#/lib/net-worth/net-worth-series'
import { absDecimal } from '#/lib/shared/money'
import { cn } from '#/lib/utils'
import type { NetWorthChartState } from '#/hooks/net-worth/use-net-worth-chart'
import type { ItemGroup } from '#/lib/net-worth/net-worth-series'

type Segment = { group: ItemGroup; amount: string }

/** A bar of segments on the card's shared scale; numbers for the drawing only. */
function Bar({
  segments,
  scale,
}: {
  segments: ReadonlyArray<Segment>
  scale: number
}) {
  return (
    <div
      aria-hidden="true"
      className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted"
    >
      {segments.map(({ group, amount }) => (
        <span
          key={group}
          className="h-full"
          style={{
            width: `${(Math.max(0, Number(amount)) / scale) * 100}%`,
            background: GROUP_COLORS[group],
          }}
        />
      ))}
    </div>
  )
}

/** Actifs or Dettes: its figure and change over the range, its bar, its groups. */
function Side({
  chart,
  line,
  segments,
  scale,
  currency,
}: {
  chart: NetWorthChartState
  line: 'assets' | 'debts'
  segments: ReadonlyArray<Segment>
  scale: number
  currency: string
}) {
  const { t } = useTranslation()
  const value = chart.totals.at(-1)?.values[line] ?? null
  const change = rangeChange(chart.points, line, chart.range)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {t(`netWorth.chart.lines.${line}`)}
        </span>
        <span className="flex flex-col items-end">
          {value === null ? (
            <MissingRate />
          ) : (
            <Money
              amount={value}
              currency={currency}
              className={cn(
                'font-semibold',
                line === 'debts' && 'text-destructive',
              )}
            />
          )}
          {change && (
            <ChangeText
              change={change}
              currency={currency}
              lowerIsBetter={line === 'debts'}
            />
          )}
        </span>
      </div>
      {value !== null && <Bar segments={segments} scale={scale} />}
      {segments.length > 1 && (
        <ul className="flex flex-col gap-0.5 text-xs">
          {segments.map(({ group, amount }) => (
            <li key={group} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full"
                style={{ background: GROUP_COLORS[group] }}
              />
              <span className="flex-1 text-muted-foreground">
                {t(`netWorth.chart.groups.${group}`)}
              </span>
              <Money amount={amount} currency={currency} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * What the net worth is made of today: assets by group and debts, on one scale so the
 * share owed reads at a glance, each with its change over the range (as the spreadsheet's
 * three cards). Without the hidden items (ADR-058).
 */
export function CompositionCard({
  chart,
  currency,
}: {
  chart: NetWorthChartState
  currency: string
}) {
  const { t } = useTranslation()
  const today = chart.totals.at(-1)
  if (!today) return null
  const segments = (groups: ReadonlyArray<ItemGroup>) =>
    groups.flatMap((group) => {
      const amount = today.values[STACK_KEYS[group]]
      return typeof amount === 'string'
        ? [{ group, amount: group === 'debts' ? absDecimal(amount) : amount }]
        : []
    })
  const assets = segments(chart.groups.filter((g) => g !== 'debts'))
  const debts = segments(chart.groups.filter((g) => g === 'debts'))
  const scale =
    Math.max(
      ...[assets, debts].map((side) =>
        side.reduce((sum, s) => sum + Math.max(0, Number(s.amount)), 0),
      ),
    ) || 1

  return (
    <section className={cn(cardSurface, 'flex flex-col gap-5 px-5 py-5')}>
      <h2 className="font-bold">{t('netWorth.composition')}</h2>
      <Side
        chart={chart}
        line="assets"
        segments={assets}
        scale={scale}
        currency={currency}
      />
      {debts.length > 0 && (
        <Side
          chart={chart}
          line="debts"
          segments={debts}
          scale={scale}
          currency={currency}
        />
      )}
    </section>
  )
}
