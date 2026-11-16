import { parseDate } from '@internationalized/date'
import { RangeCalendar } from 'react-aria-components'
import { CalendarMonthGrid } from '#/components/forms/calendar-month-grid'
import { DateProviders } from '#/components/forms/calendar-sheet'
import type { DateRange } from '#/lib/shared/date-range'

/**
 * The range calendar open in its panel (ADR-029), for a range chosen where the panel
 * already is. `onChange` fires once the second day is picked.
 */
export function InlineRangeCalendar({
  label,
  value,
  maxValue,
  onChange,
}: {
  label: string
  /** Null selects nothing. */
  value: DateRange | null
  /** The last day that can be chosen (an ISO date). */
  maxValue?: string
  onChange: (range: DateRange) => void
}) {
  return (
    <DateProviders>
      <RangeCalendar
        aria-label={label}
        value={
          value && {
            start: parseDate(value.start),
            end: parseDate(value.end),
          }
        }
        maxValue={maxValue ? parseDate(maxValue) : undefined}
        onChange={(range) =>
          onChange({ start: range.start.toString(), end: range.end.toString() })
        }
        className="flex flex-col gap-2"
      >
        <CalendarMonthGrid range />
      </RangeCalendar>
    </DateProviders>
  )
}
