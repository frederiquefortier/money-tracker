import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DateRangeField } from '#/components/forms/date-range-field'
import { Icon } from '#/components/display/icon'
import { inAriaOverlay } from '#/components/ui/overlay-container'
import { IconButton } from '#/components/display/icon-button'
import {
  MonthGrid,
  YearGrid,
} from '#/components/transactions/period/period-grids'
import { TabList } from '#/components/lists/tab-list'
import { chipSurface } from '#/components/styles'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { formatDate, formatMonth, todayIso } from '#/lib/shared/format'
import {
  PERIOD_UNITS,
  monthOf,
  shiftMonth,
} from '#/lib/transactions/transaction-list'
import type {
  PeriodChoice,
  PeriodUnit,
} from '#/lib/transactions/transaction-list'
import { useLocale } from '#/hooks/app/use-locale'

/**
 * A custom period's range (ADR-027). It cannot go past today, and the field always holds
 * two days, so the range never turns around.
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
    <DateRangeField
      label={t('transactions.list.dates')}
      value={{ start: choice.start, end: choice.end }}
      maxValue={todayIso()}
      onChange={(range) => {
        if (range) onChange({ ...choice, ...range })
      }}
    />
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
          className={chipSurface}
        >
          <Icon name="calendar" className="size-4" />
          <span className="first-letter:uppercase">{shown}</span>
          <Icon name="chevron-down" className="size-4" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-4"
          // The date range's calendar is portalled outside this panel (ADR-027): a tap or
          // an Escape in it is not this panel's.
          onInteractOutside={(event) => {
            if (inAriaOverlay(event.target)) event.preventDefault()
          }}
          onEscapeKeyDown={(event) => {
            if (inAriaOverlay(document.activeElement)) event.preventDefault()
          }}
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
