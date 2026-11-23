import { useTranslation } from 'react-i18next'
import { Figure } from '#/components/dashboard/dashboard-card'
import { ChangeText } from '#/components/display/change-text'
import { Icon } from '#/components/display/icon'
import { Sparkline } from '#/components/display/sparkline'
import { focusRing } from '#/components/styles'
import type { Change } from '#/lib/shared/change'
import { cn } from '#/lib/utils'

const UP = '▲'

export type Fold = { folds: boolean; open: boolean; onToggle: () => void }

/**
 * A group's chevron, or the same room for a row that does not fold. With `panel`, it opens
 * a chart under the row and says so, as the categories' trend does.
 */
export function FoldButton({
  fold,
  name,
  panel,
}: {
  fold: Fold
  name: string
  panel?: string
}) {
  const { t } = useTranslation()
  if (!fold.folds)
    return <span aria-hidden="true" className="size-6 shrink-0" />
  const labels = panel
    ? (['dashboard.table.showChart', 'dashboard.table.hideChart'] as const)
    : (['common.expandName', 'common.collapseName'] as const)
  const label = labels[fold.open ? 1 : 0]
  return (
    <button
      type="button"
      aria-expanded={fold.open}
      aria-controls={panel}
      aria-label={t(label, { name })}
      onClick={fold.onToggle}
      className={cn(
        'grid size-6 shrink-0 place-items-center rounded-md hover:bg-secondary',
        focusRing,
      )}
    >
      <Icon
        name="chevron-down"
        className={cn(
          'size-4 transition-transform',
          !fold.open && '-rotate-90',
        )}
      />
    </button>
  )
}

export function Cell({
  amount,
  above,
  currency,
}: {
  amount: string | null
  above: boolean
  currency: string
}) {
  const { t } = useTranslation()
  const zero = amount !== null && /^-?0(\.0+)?$/.test(amount)
  return (
    <span className={cn(above && 'text-destructive')}>
      {above && (
        <span
          role="img"
          aria-label={t('dashboard.table.aboveAverage')}
          title={t('dashboard.table.aboveAverage')}
          className="mr-1 text-xs"
        >
          {UP}
        </span>
      )}
      <Figure
        amount={amount}
        currency={currency}
        className={zero ? 'text-muted-foreground' : undefined}
      />
    </span>
  )
}

/** A row's line, a button that opens its chart under the row. */
export function TrendButton({
  name,
  color,
  open,
  panel,
  values,
  onToggle,
}: {
  name: string
  color: string
  open: boolean
  panel: string
  values: ReadonlyArray<number | null>
  onToggle: () => void
}) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={panel}
      aria-label={t(
        open ? 'dashboard.table.hideChart' : 'dashboard.table.showChart',
        { name },
      )}
      onClick={onToggle}
      className={cn(
        'ml-auto flex w-full max-w-sm min-w-20 rounded-md p-0.5 hover:bg-secondary',
        open && 'bg-secondary',
        focusRing,
      )}
    >
      <Sparkline values={values} color={color} className="h-5 w-full" />
    </button>
  )
}

/** The change against a year earlier, empty without one. */
export function ChangeCell({
  change,
  lowerIsBetter,
  currency,
}: {
  change: Change | null
  lowerIsBetter: boolean
  currency: string
}) {
  return (
    <td className="py-1.5 pl-6 text-right">
      {change && (
        <ChangeText
          change={change}
          currency={currency}
          percentOnly
          lowerIsBetter={lowerIsBetter}
        />
      )}
    </td>
  )
}
