import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'
import { usePeriodLabel } from '#/hooks/transactions/use-period-label'
import { todayIso } from '#/lib/shared/format'
import {
  PERIOD_PRESETS,
  presetChoice,
  presetMonths,
  presetOf,
} from '#/lib/transactions/transaction-list'
import type {
  PeriodChoice,
  PeriodPreset,
} from '#/lib/transactions/transaction-list'

const CUSTOM = 'custom'

/**
 * The list's period as tabs, as the net worth hub's range: the last
 * 1, 3 or 6 months or the last year (1A) to today, Tout, and the calendar for any other period, which then
 * names it.
 */
export function PeriodTabs({
  choice,
  onChange,
  onPickDates,
}: {
  choice: PeriodChoice
  onChange: (choice: PeriodChoice) => void
  onPickDates: () => void
}) {
  const { t } = useTranslation()
  const periodLabel = usePeriodLabel()
  const today = todayIso()
  const preset = presetOf(choice, today)
  const labelOf = (one: PeriodPreset) => {
    if (one === 'all') return { short: t('transactions.list.all') }
    const count = presetMonths(one)
    // Twelve months read as a year, as on the net worth hub's tabs.
    if (count === 12)
      return {
        short: t('transactions.list.yearShort'),
        full: t('transactions.list.lastYear'),
      }
    return {
      short: t('transactions.list.monthsShort', { count }),
      full: t('transactions.list.lastMonths', { count }),
    }
  }
  return (
    <ToggleGroup
      type="single"
      value={preset ?? CUSTOM}
      onValueChange={(next) => {
        const picked = PERIOD_PRESETS.find((one) => one === next)
        if (picked) onChange(presetChoice(picked, choice, today))
      }}
      aria-label={t('transactions.list.periodTabs')}
      className="w-full gap-0.5 sm:w-fit"
    >
      {PERIOD_PRESETS.map((one) => {
        const { short, full } = labelOf(one)
        return (
          <ToggleGroupItem
            key={one}
            value={one}
            aria-label={full}
            className="flex-1 px-1.5 sm:px-2.5"
          >
            {short}
          </ToggleGroupItem>
        )
      })}
      <ToggleGroupItem
        value={CUSTOM}
        aria-label={
          preset === null
            ? periodLabel(choice)
            : t('transactions.list.pickDates')
        }
        title={t('transactions.list.pickDates')}
        onClick={onPickDates}
        className="flex flex-1 items-center justify-center gap-1.5 px-1.5 sm:px-2.5"
      >
        <Icon name="calendar" className="size-4 shrink-0" />
        {preset === null && (
          <span className="max-w-40 truncate first-letter:uppercase">
            {periodLabel(choice)}
          </span>
        )}
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
