import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '#/components/display/icon-button'
import { formatMonth, todayIso } from '#/lib/shared/format'
import { monthOf } from '#/lib/transactions/transaction-list'
import { useLocale } from '#/hooks/app/use-locale'
import { cn } from '#/lib/utils'
import { focusRing } from '#/components/styles'
import type { PeriodChoice } from '#/lib/transactions/transaction-list'

// The year and month grids the period picker opens (spec 14).

const YEARS_SHOWN = 12

// Nothing to list after today: neither grid goes past this year, or this month.
const thisYear = () => new Date().getFullYear()

/**
 * A header that steps (‹ 2026 ›) over a grid of three columns; the chosen cell tinted.
 * `byColumn` fills each column top to bottom, so years follow one another down it.
 */
function PickerGrid({
  heading,
  previous,
  next,
  cells,
  byColumn = false,
}: {
  heading: string
  byColumn?: boolean
  previous: { label: string; onClick: () => void }
  next: { label: string; onClick: () => void; disabled: boolean }
  cells: Array<{
    key: string
    text: string
    label: string
    chosen: boolean
    disabled?: boolean
    onClick: () => void
  }>
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <IconButton icon="chevron-left" {...previous} />
        <span className="font-mono font-bold">{heading}</span>
        <IconButton icon="chevron-right" {...next} />
      </div>
      <div
        className={cn(
          'grid grid-cols-3 gap-1',
          byColumn && 'grid-flow-col grid-rows-4',
        )}
      >
        {cells.map((cell) => (
          <button
            key={cell.key}
            type="button"
            aria-pressed={cell.chosen}
            aria-label={cell.label}
            disabled={cell.disabled}
            onClick={cell.onClick}
            className={cn(
              'rounded-lg px-2 py-1.5 hover:bg-muted disabled:cursor-default disabled:text-muted-foreground/50 disabled:hover:bg-transparent',
              cell.chosen && 'bg-accent font-semibold text-accent-foreground',
              focusRing,
            )}
          >
            {cell.text}
          </button>
        ))}
      </div>
    </div>
  )
}

export function MonthGrid({
  choice,
  onChoose,
}: {
  choice: PeriodChoice
  onChoose: (month: string) => void
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const [year, setYear] = useState(
    Math.min(Number(choice.month.slice(0, 4)), thisYear()),
  )
  return (
    <PickerGrid
      heading={String(year)}
      previous={{
        label: t('transactions.list.previousYear'),
        onClick: () => setYear(year - 1),
      }}
      next={{
        label: t('transactions.list.nextYear'),
        onClick: () => setYear(year + 1),
        disabled: year >= thisYear(),
      }}
      cells={Array.from({ length: 12 }, (_, i) => {
        const month = `${year}-${String(i + 1).padStart(2, '0')}`
        return {
          key: month,
          text: formatMonth(month, locale, 'short'),
          label: formatMonth(month, locale),
          chosen: choice.period === 'month' && month === choice.month,
          disabled: month > monthOf(todayIso()),
          onClick: () => onChoose(month),
        }
      })}
    />
  )
}

export function YearGrid({
  choice,
  onChoose,
}: {
  choice: PeriodChoice
  onChoose: (year: string) => void
}) {
  const { t } = useTranslation()
  const [last, setLast] = useState(thisYear)
  const first = last - YEARS_SHOWN + 1
  return (
    <PickerGrid
      heading={`${first} – ${last}`}
      byColumn
      previous={{
        label: t('transactions.list.previousYears'),
        onClick: () => setLast(last - YEARS_SHOWN),
      }}
      next={{
        label: t('transactions.list.nextYears'),
        onClick: () => setLast(last + YEARS_SHOWN),
        disabled: last >= thisYear(),
      }}
      cells={Array.from({ length: YEARS_SHOWN }, (_, i) => {
        const year = String(first + i)
        return {
          key: year,
          text: year,
          label: year,
          chosen: choice.period === 'year' && year === choice.year,
          onClick: () => onChoose(year),
        }
      })}
    />
  )
}
