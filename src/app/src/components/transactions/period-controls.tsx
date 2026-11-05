import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormField } from '#/components/form-field'
import { Icon } from '#/components/icon'
import { IconButton } from '#/components/icon-button'
import { MonthGrid, YearGrid } from '#/components/transactions/period-grids'
import { TabList } from '#/components/tab-list'
import { chip } from '#/components/chip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { formatDate, formatMonth, todayIso } from '#/lib/format'
import { PERIODS, monthOf, shiftMonth } from '#/lib/transaction-list'
import type { Period } from '#/lib/transaction-list'
import { useLocale } from '#/lib/use-locale'

export type PeriodChoice = {
  period: Period
  month: string
  year: string
  /** A custom period's first and last days. */
  start: string
  end: string
}

/**
 * A custom period's two days (ADR-024's native date fields). Neither goes past today,
 * and each keeps the other's side, so the range never turns around.
 */
function DateRangeFields({
  choice,
  onChange,
}: {
  choice: PeriodChoice
  onChange: (choice: PeriodChoice) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-2 gap-3">
      <FormField
        name="start"
        label={t('transactions.list.start')}
        type="date"
        value={choice.start}
        max={choice.end}
        onChange={(event) => {
          if (event.target.value)
            onChange({ ...choice, start: event.target.value })
        }}
      />
      <FormField
        name="end"
        label={t('transactions.list.end')}
        type="date"
        value={choice.end}
        min={choice.start}
        max={todayIso()}
        onChange={(event) => {
          if (event.target.value)
            onChange({ ...choice, end: event.target.value })
        }}
      />
    </div>
  )
}

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
 * The four periods over the year grid, the month grid or the two dates. A pick in a
 * grid applies and closes (`onApply`); Tout applies at once, the dates as they change.
 */
function PeriodPanel({
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
  const [view, setView] = useState<Period>(choice.period)
  const select = (period: Period) => {
    setView(period)
    if (period === 'all') onApply({ period })
    if (period === 'custom') onChange({ ...choice, period })
  }
  return (
    <>
      <TabList
        label={t('transactions.list.periodsLabel')}
        tabs={PERIODS}
        value={view}
        labelOf={(p) => t(`transactions.list.periodsShort.${p}`)}
        panelId={`${id}-panel`}
        idPrefix={id}
        fit
        onSelect={select}
      />
      <div id={`${id}-panel`} role="tabpanel" className="empty:hidden">
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
          <DateRangeFields choice={choice} onChange={onChange} />
        )}
      </div>
    </>
  )
}

/**
 * The period, first in the row under the search (spec 14): ‹ Novembre 2026 › for a month
 * or a year, "Toutes les dates" or the custom days otherwise. The bubble opens the panel.
 */
export function PeriodPicker({
  choice,
  disabled,
  onChange,
}: {
  choice: PeriodChoice
  disabled: boolean
  onChange: (choice: PeriodChoice) => void
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const steps = useSteps(choice, onChange)
  const shown = {
    all: t('transactions.list.allDates'),
    year: choice.year,
    month: formatMonth(choice.month, locale),
    custom: `${formatDate(choice.start, locale, 'medium')} – ${formatDate(choice.end, locale, 'medium')}`,
  }[choice.period]
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {steps && (
        <IconButton
          icon="chevron-left"
          disabled={disabled}
          {...steps.previous}
        />
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          aria-label={t('transactions.list.periodLabel', { period: shown })}
          title={t('transactions.list.periodLabel', { period: shown })}
          className={chip}
        >
          <Icon name="calendar" className="size-4" />
          <span className="first-letter:uppercase">{shown}</span>
          <Icon name="chevron-down" className="size-4" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-4"
        >
          <PeriodPanel
            choice={choice}
            onChange={onChange}
            onApply={(next) => {
              setOpen(false)
              onChange({ ...choice, ...next })
            }}
          />
        </PopoverContent>
      </Popover>
      {steps && (
        <IconButton icon="chevron-right" disabled={disabled} {...steps.next} />
      )}
    </div>
  )
}
