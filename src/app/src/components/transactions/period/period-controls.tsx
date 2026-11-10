import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { IconButton } from '#/components/display/icon-button'
import { chipSurface } from '#/components/styles'
import { todayIso } from '#/lib/shared/format'
import { monthOf, shiftMonth } from '#/lib/transactions/transaction-list'
import type { PeriodChoice } from '#/lib/transactions/transaction-list'
import { usePeriodLabel } from '#/hooks/transactions/use-period-label'

/** ‹ and › around the period's bubble, a month or a year at a time; none past today. */
function useSteps(
  choice: PeriodChoice,
  onChange: (choice: PeriodChoice) => void,
) {
  const { t } = useTranslation()
  if (choice.period !== 'month' && choice.period !== 'year') return null
  const step = (by: number) =>
    choice.period === 'month'
      ? { month: shiftMonth(choice.month, by) }
      : { year: String(Number(choice.year) + by) }
  const last =
    choice.period === 'month'
      ? choice.month >= monthOf(todayIso())
      : choice.year >= todayIso().slice(0, 4)
  const unit = choice.period === 'month' ? 'Month' : 'Year'
  return {
    previous: {
      label: t(`transactions.list.previous${unit}`),
      onClick: () => onChange({ ...choice, ...step(-1) }),
    },
    next: {
      label: t(`transactions.list.next${unit}`),
      muted: last,
      onClick: () => {
        if (!last) onChange({ ...choice, ...step(1) })
      },
    },
  }
}

/**
 * The period, first in the row under the search (spec 14), from `md` up: ‹ Novembre 2026 ›
 * for a month or a year, "Toutes les dates" or the custom days otherwise. The bubble opens
 * the period in the filters' sheet (ADR-030).
 */
export function PeriodPicker({
  choice,
  disabled,
  onChange,
  onOpen,
}: {
  choice: PeriodChoice
  disabled: boolean
  onChange: (choice: PeriodChoice) => void
  onOpen: () => void
}) {
  const { t } = useTranslation()
  const shown = usePeriodLabel()(choice)
  const steps = useSteps(choice, onChange)
  const label = t('transactions.list.periodLabel', { period: shown })
  return (
    <div className="hidden shrink-0 items-center gap-0.5 md:flex">
      {steps && (
        <IconButton
          icon="chevron-left"
          disabled={disabled}
          {...steps.previous}
        />
      )}
      <button
        type="button"
        aria-haspopup="dialog"
        disabled={disabled}
        aria-label={label}
        title={label}
        onClick={onOpen}
        className={chipSurface}
      >
        <Icon name="calendar" className="size-4" />
        <span className="first-letter:uppercase">{shown}</span>
        <Icon name="chevron-down" className="size-4" />
      </button>
      {steps && (
        <IconButton icon="chevron-right" disabled={disabled} {...steps.next} />
      )}
    </div>
  )
}
