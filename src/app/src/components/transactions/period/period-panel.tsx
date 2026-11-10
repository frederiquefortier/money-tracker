import { useTranslation } from 'react-i18next'
import { DateRangeField } from '#/components/forms/date-range-field'
import { InlineRangeCalendar } from '#/components/forms/inline-range-calendar'
import { todayIso } from '#/lib/shared/format'
import type { PeriodChoice } from '#/lib/transactions/transaction-list'

/**
 * The period (ADR-032): one range, the typed dates over a calendar open in the panel, both
 * applying as they change while the sheet stays open. Nothing is selected while the period
 * is Tout; Effacer, in the sheet's footer, goes back to it. The range cannot go past today,
 * and the field always holds two days, so it never turns around.
 */
export function PeriodPanel({
  choice,
  onChange,
}: {
  choice: PeriodChoice
  onChange: (choice: PeriodChoice) => void
}) {
  const { t } = useTranslation()
  const range =
    choice.period === 'all' ? null : { start: choice.start, end: choice.end }
  return (
    <div className="flex flex-col gap-4">
      <DateRangeField
        label={t('transactions.list.dates')}
        value={range}
        maxValue={todayIso()}
        calendar={false}
        onChange={(next) => {
          if (next) onChange({ ...choice, period: 'custom', ...next })
        }}
      />
      <InlineRangeCalendar
        label={t('transactions.list.dates')}
        value={range}
        maxValue={todayIso()}
        onChange={(next) => onChange({ ...choice, period: 'custom', ...next })}
      />
    </div>
  )
}
