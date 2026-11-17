import { useTranslation } from 'react-i18next'
import { Money } from '#/components/display/money'
import { Percent } from '#/components/display/percent'
import { absDecimal } from '#/lib/shared/money'
import { cn } from '#/lib/utils'
import type { Change } from '#/lib/net-worth/net-worth-range'

/** The unsigned amount and percent, or the percent alone, then "par an" on Tout. */
function Figures({
  change,
  currency,
  percentOnly,
}: {
  change: Change
  currency: string
  percentOnly: boolean
}) {
  const { t } = useTranslation()
  const percent = change.percent === null ? null : absDecimal(change.percent)
  const perYear = change.perYearFrom
    ? t(
        percentOnly
          ? 'netWorth.change.perYearShort'
          : 'netWorth.change.perYear',
      )
    : null
  if (percentOnly)
    return (
      <>
        {percent !== null && <Percent points={percent} />}
        {perYear}
      </>
    )
  return (
    <>
      <Money amount={absDecimal(change.amount)} currency={currency} />
      {percent !== null && (
        <>
          {' ('}
          <Percent points={percent} />
          {')'}
        </>
      )}
      {perYear}
    </>
  )
}

/**
 * A change as an arrow for its direction and a colour for good or bad: a debt going down is
 * ▼ in green (author, 2026-11-17). Amounts and percents are shown unsigned; on Tout both
 * are per year.
 */
export function ChangeText({
  change,
  currency,
  lowerIsBetter = false,
  percentOnly = false,
}: {
  change: Change
  currency: string
  /** A debt: down is good. */
  lowerIsBetter?: boolean
  percentOnly?: boolean
}) {
  const { t } = useTranslation()
  const zero = /^-?0(\.0+)?$/.test(change.amount)
  const up = !change.amount.startsWith('-')
  const good = up !== lowerIsBetter
  // From 0 there is no percent, and an arrow alone says nothing.
  if (percentOnly && change.percent === null) return null
  return (
    <span
      className={cn(
        'text-xs font-semibold whitespace-nowrap',
        zero && 'text-muted-foreground',
        !zero && (good ? 'text-income' : 'text-destructive'),
      )}
    >
      {!zero && (
        <span role="img" aria-label={t(up ? 'netWorth.up' : 'netWorth.down')}>
          {up ? '▲ ' : '▼ '}
        </span>
      )}
      <Figures change={change} currency={currency} percentOnly={percentOnly} />
    </span>
  )
}
