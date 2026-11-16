import { useState } from 'react'
import {
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
} from 'react-aria-components'
import {
  MonthYearHeader,
  MonthYearList,
} from '#/components/forms/calendar-month-year'
import type { CalendarMenu } from '#/components/forms/calendar-month-year'
import { cn } from '#/lib/utils'

/** The band behind a day in a range: from the middle of the first, to the middle of the last. */
function bandOf({
  isSelected,
  isSelectionStart,
  isSelectionEnd,
}: {
  isSelected: boolean
  isSelectionStart: boolean
  isSelectionEnd: boolean
}) {
  if (!isSelected || (isSelectionStart && isSelectionEnd)) return ''
  if (isSelectionStart)
    return 'bg-linear-to-r from-transparent from-50% to-accent to-50%'
  if (isSelectionEnd)
    return 'bg-linear-to-r from-accent from-50% to-transparent to-50%'
  return 'bg-accent'
}

/**
 * One day of the month grid. A range is one band across its days, with no gap between
 * them: the cell fills its column, the band starts at the middle of the first day and ends
 * at the middle of the last, and the days at both ends are round.
 */
function Day({
  date,
  range,
}: {
  date: React.ComponentProps<typeof CalendarCell>['date']
  range: boolean
}) {
  return (
    <CalendarCell
      date={date}
      className={(state) =>
        cn(
          'group grid h-10 w-full cursor-pointer place-items-center text-sm outline-none',
          state.isDisabled && 'pointer-events-none',
          range && bandOf(state),
        )
      }
    >
      {({
        formattedDate,
        isSelected,
        isSelectionStart,
        isSelectionEnd,
        isOutsideMonth,
        isDisabled,
        isFocusVisible,
      }) => (
        <span
          className={cn(
            'grid size-10 place-items-center rounded-full',
            !isSelected && 'group-hover:bg-secondary',
            (range ? isSelectionStart || isSelectionEnd : isSelected) &&
              'bg-primary text-primary-foreground',
            range &&
              isSelected &&
              !isSelectionStart &&
              !isSelectionEnd &&
              'text-accent-foreground',
            isOutsideMonth && !isSelected && 'text-muted-foreground/50',
            isDisabled && 'text-muted-foreground/40',
            isFocusVisible && 'outline-2 outline-offset-1 outline-ring',
          )}
        >
          {formattedDate}
        </span>
      )}
    </CalendarCell>
  )
}

/**
 * The month grid under its month and year (calendar-month-year.tsx), the grid giving way
 * to a list while one is open. Page Up and Down move by month, with Shift by year.
 */
export function CalendarMonthGrid({ range }: { range: boolean }) {
  const [menu, setMenu] = useState<CalendarMenu>(null)
  return (
    <>
      <MonthYearHeader menu={menu} onMenu={setMenu} />
      {menu ? (
        <MonthYearList menu={menu} onPicked={() => setMenu(null)} />
      ) : (
        <CalendarGrid className="w-full table-fixed border-separate border-spacing-0">
          <CalendarGridHeader>
            {(day) => (
              <CalendarHeaderCell className="pb-1 text-xs font-semibold text-muted-foreground">
                {day}
              </CalendarHeaderCell>
            )}
          </CalendarGridHeader>
          <CalendarGridBody>
            {(date) => <Day date={date} range={range} />}
          </CalendarGridBody>
        </CalendarGrid>
      )}
    </>
  )
}
