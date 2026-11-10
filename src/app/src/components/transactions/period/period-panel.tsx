import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DateRangeField } from '#/components/forms/date-range-field'
import { InlineRangeCalendar } from '#/components/forms/inline-range-calendar'
import { TabList } from '#/components/lists/tab-list'
import {
  MonthGrid,
  YearGrid,
} from '#/components/transactions/period/period-grids'
import { todayIso } from '#/lib/shared/format'
import { PERIOD_UNITS } from '#/lib/transactions/transaction-list'
import type {
  PeriodChoice,
  PeriodUnit,
} from '#/lib/transactions/transaction-list'

/**
 * A custom period's range (ADR-029): the typed dates, which apply as they change, over a
 * calendar whose second pick applies and closes. It cannot go past today, and the field
 * always holds two days, so the range never turns around.
 */
function DateRangeFields({
  choice,
  onChange,
  onApply,
}: {
  choice: PeriodChoice
  onChange: (choice: PeriodChoice) => void
  onApply: (next: Partial<PeriodChoice>) => void
}) {
  const { t } = useTranslation()
  const range = { start: choice.start, end: choice.end }
  return (
    <>
      <DateRangeField
        label={t('transactions.list.dates')}
        value={range}
        maxValue={todayIso()}
        calendar={false}
        onChange={(next) => {
          if (next) onChange({ ...choice, ...next })
        }}
      />
      <InlineRangeCalendar
        label={t('transactions.list.dates')}
        value={range}
        maxValue={todayIso()}
        onChange={(next) => onApply({ period: 'custom', ...next })}
      />
    </>
  )
}

/**
 * The four periods over the year grid, the month grid or the dates. A pick in a grid or
 * the calendar applies and closes (`onApply`); Tout applies at once, typed dates as they change.
 */
export function PeriodPanel({
  choice,
  onChange,
  onApply,
}: {
  choice: PeriodChoice
  onChange: (choice: PeriodChoice) => void
  onApply: (next: Partial<PeriodChoice>) => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const [view, setView] = useState<PeriodUnit>(choice.period)
  const select = (period: PeriodUnit) => {
    setView(period)
    if (period === 'all') onApply({ period })
    if (period === 'custom') onChange({ ...choice, period })
  }
  return (
    <>
      <TabList
        label={t('transactions.list.periodsLabel')}
        tabs={PERIOD_UNITS}
        value={view}
        labelOf={(p) => t(`transactions.list.periodsShort.${p}`)}
        panelId={`${id}-panel`}
        idPrefix={id}
        fit
        onSelect={select}
      />
      <div
        id={`${id}-panel`}
        role="tabpanel"
        className="flex flex-col gap-4 empty:hidden"
      >
        {view === 'month' && (
          <MonthGrid
            choice={choice}
            onChoose={(month) => onApply({ period: 'month', month })}
          />
        )}
        {view === 'year' && (
          <YearGrid
            choice={choice}
            onChoose={(year) => onApply({ period: 'year', year })}
          />
        )}
        {view === 'custom' && (
          <DateRangeFields
            choice={choice}
            onChange={onChange}
            onApply={onApply}
          />
        )}
      </div>
    </>
  )
}
