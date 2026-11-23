import { useTranslation } from 'react-i18next'
import { FLOW_COLORS } from '#/components/dashboard/chart-parts'
import { Figure } from '#/components/dashboard/dashboard-card'
import { ChangeText } from '#/components/display/change-text'
import { Percent } from '#/components/display/percent'
import { cardSurface } from '#/components/styles'
import type { Flows } from '#/lib/dashboard/money-flows'
import { changeBetween } from '#/lib/shared/change'
import { ratio, toMinor } from '#/lib/shared/money'
import { cn } from '#/lib/utils'

type FlowKey = keyof Flows

/** Percent points of income, when there was income. */
function shareOfIncome(flows: Flows, key: FlowKey): string | null {
  const part = flows[key]
  const earned = flows.earned === null ? null : toMinor(flows.earned, 4)
  if (part === null || earned === null || earned <= 0n) return null
  const minor = toMinor(part, 4)
  return minor === null ? null : ratio(minor * 100n, earned)
}

function Label({ flow, children }: { flow: FlowKey; children: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        aria-hidden="true"
        className="size-2.5 shrink-0 rounded-sm"
        style={{ backgroundColor: FLOW_COLORS[flow] }}
      />
      {children}
    </span>
  )
}

/** "▲ 4 % vs 2025": the change from the same stretch a year earlier. */
function VersusLastYear({
  flow,
  flows,
  before,
  currency,
}: {
  flow: FlowKey
  flows: Flows
  before: { flows: Flows; year: string } | null
  currency: string
}) {
  const { t } = useTranslation()
  const now = flows[flow]
  const then = before?.flows[flow]
  if (!before || now === null || then == null) return null
  const change = changeBetween(then, now)
  if (!change || change.percent === null) return null
  return (
    <span className="flex flex-wrap items-baseline gap-x-1 text-xs">
      <ChangeText
        change={change}
        currency={currency}
        percentOnly
        lowerIsBetter={flow === 'spent'}
      />
      <span className="text-muted-foreground">
        {t('dashboard.flows.versus', { year: before.year })}
      </span>
    </span>
  )
}

/** Income as the whole, cut into what was spent, invested and what remains. */
function IncomeBar({ flows }: { flows: Flows }) {
  const parts = (['spent', 'invested', 'remaining'] as const).map((key) => ({
    key,
    size: Math.max(Number(flows[key] ?? 0), 0),
  }))
  const whole = Math.max(
    Number(flows.earned ?? 0),
    parts.reduce((sum, p) => sum + p.size, 0),
  )
  if (whole <= 0) return null
  return (
    <div
      aria-hidden="true"
      className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-secondary"
    >
      {parts.map(({ key, size }) =>
        size > 0 ? (
          <span
            key={key}
            style={{
              width: `${(size / whole) * 100}%`,
              backgroundColor: FLOW_COLORS[key],
            }}
          />
        ) : null,
      )}
    </div>
  )
}

function FlowFigure({
  flow,
  flows,
  before,
  currency,
}: {
  flow: FlowKey
  flows: Flows
  before: { flows: Flows; year: string } | null
  currency: string
}) {
  const { t } = useTranslation()
  const share = shareOfIncome(flows, flow)
  return (
    // Four rows shared across the figures, so each change sits on one line even where a
    // share of income wraps (author, 2026-11-19).
    <li className="row-span-4 grid min-w-0 grid-rows-subgrid gap-y-0.5">
      <Label flow={flow}>{t(`dashboard.flows.${flow}`)}</Label>
      <Figure
        amount={flows[flow]}
        currency={currency}
        className="text-lg font-semibold"
      />
      {share !== null && (
        <span className="text-xs text-muted-foreground">
          <Percent points={share} /> {t('dashboard.flows.ofIncome')}
        </span>
      )}
      <span className="row-start-4">
        <VersusLastYear
          flow={flow}
          flows={flows}
          before={before}
          currency={currency}
        />
      </span>
    </li>
  )
}

/** Each flow per month (or year) over the months counted, at the card's foot. */
function AverageBand({
  average,
  yearly,
  currency,
}: {
  average: { flows: Flows; count: number }
  yearly: boolean
  currency: string
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-2 border-t pt-3">
      <p className="text-xs font-semibold text-muted-foreground">
        {t(
          yearly
            ? 'dashboard.table.columns.averageYear'
            : 'dashboard.table.columns.averageMonth',
        )}
        {' · '}
        {t(
          yearly ? 'dashboard.flows.overYears' : 'dashboard.table.overMonths',
          {
            count: average.count,
          },
        )}
      </p>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
        {(['earned', 'spent', 'invested', 'remaining'] as const).map((flow) => (
          <li key={flow} className="flex min-w-0 flex-col gap-0.5">
            <Label flow={flow}>{t(`dashboard.flows.${flow}`)}</Label>
            <Figure
              amount={average.flows[flow]}
              currency={currency}
              className="font-semibold"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * The period at a glance: income as the headline and as the whole bar, cut into what was
 * spent, invested and what remains (author, 2026-11-19: the full bar reads as income), each
 * with its share of income and its change from the same stretch a year earlier; then each
 * flow per month or per year at the foot (author, 2026-11-20).
 */
export function FlowSummary({
  flows,
  before,
  average,
  yearly,
  currency,
}: {
  flows: Flows
  before: { flows: Flows; year: string } | null
  average: { flows: Flows; count: number }
  yearly: boolean
  currency: string
}) {
  const { t } = useTranslation()
  return (
    // Beside a chart from `xl`: as tall, the averages at its foot.
    <section
      className={cn(
        cardSurface,
        'flex min-w-0 flex-col justify-between gap-4 px-5 py-4',
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <Label flow="earned">{t('dashboard.flows.earned')}</Label>
          <Figure
            amount={flows.earned}
            currency={currency}
            className="text-3xl font-semibold"
          />
          <VersusLastYear
            flow="earned"
            flows={flows}
            before={before}
            currency={currency}
          />
        </div>
        <IncomeBar flows={flows} />
        <ul className="grid grid-cols-3 gap-x-3 gap-y-0.5">
          {(['spent', 'invested', 'remaining'] as const).map((flow) => (
            <FlowFigure
              key={flow}
              flow={flow}
              flows={flows}
              before={before}
              currency={currency}
            />
          ))}
        </ul>
      </div>
      <AverageBand average={average} yearly={yearly} currency={currency} />
    </section>
  )
}
