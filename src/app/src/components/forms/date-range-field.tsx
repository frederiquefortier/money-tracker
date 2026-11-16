import { parseDate } from '@internationalized/date'
import {
  Button,
  DateInput,
  DateRangePicker,
  DateSegment,
  Group,
} from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import {
  CalendarSheet,
  DateProviders,
  FieldLabelRow,
  literalClass,
  segmentClass,
} from '#/components/forms/calendar-sheet'
import { Icon } from '#/components/display/icon'
import { FieldMessage } from '#/components/forms/form-field'
import { fieldControl } from '#/components/ui/field'
import type { DateRange } from '#/lib/shared/date-range'
import { roundButton } from '#/components/styles'
import { cn } from '#/lib/utils'

/** The typed segments, a ✕ to empty them and the button that opens the calendar. */
function RangeInput({
  clearable,
  calendar,
  onClear,
}: {
  clearable: boolean
  calendar: boolean
  onClear: () => void
}) {
  const { t } = useTranslation()
  return (
    <Group
      className={cn(
        fieldControl,
        'flex items-center gap-0.5 pr-1',
        'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
      )}
    >
      <DateInput slot="start" className="flex">
        {(part) => (
          <DateSegment
            segment={part}
            className={part.type === 'literal' ? literalClass : segmentClass}
          />
        )}
      </DateInput>
      <span aria-hidden="true" className="px-1 text-muted-foreground">
        -
      </span>
      <DateInput slot="end" className="flex flex-1">
        {(part) => (
          <DateSegment
            segment={part}
            className={part.type === 'literal' ? literalClass : segmentClass}
          />
        )}
      </DateInput>
      {clearable && (
        <Button
          slot={null}
          aria-label={t('common.clear')}
          onPress={onClear}
          className={roundButton}
        >
          <Icon name="close" />
        </Button>
      )}
      {calendar && (
        <Button aria-label={t('common.chooseDates')} className={roundButton}>
          <Icon name="calendar" />
        </Button>
      )}
    </Group>
  )
}

/**
 * ADR-027: dates as one range, typed in segments (the month and the year are
 * entered directly) or picked in a calendar (CalendarSheet). A range closes it. One day is
 * the same day twice. `labelAddon` sits at the far end of the label row (the explanation
 * of the automatic link).
 */
export function DateRangeField({
  label,
  labelAddon,
  value,
  onChange,
  maxValue,
  clearable = false,
  calendar = true,
  error,
}: {
  label: string
  labelAddon?: React.ReactNode
  value: DateRange | null
  onChange: (range: DateRange | null) => void
  /** The last day that can be chosen (an ISO date). */
  maxValue?: string
  /** A ✕ empties the field: no dates. */
  clearable?: boolean
  /** False when a calendar sits beside the field (ADR-029): no button and no sheet. */
  calendar?: boolean
  error?: string
}) {
  return (
    <DateProviders>
      <DateRangePicker
        value={
          value && {
            start: parseDate(value.start),
            end: parseDate(value.end),
          }
        }
        maxValue={maxValue ? parseDate(maxValue) : undefined}
        onChange={(range) =>
          onChange(
            range && {
              start: range.start.toString(),
              end: range.end.toString(),
            },
          )
        }
        isInvalid={error ? true : undefined}
        className="flex flex-col gap-2"
      >
        <FieldLabelRow label={label} addon={labelAddon} />
        <RangeInput
          clearable={clearable && value !== null}
          calendar={calendar}
          onClear={() => onChange(null)}
        />
        {error && <FieldMessage>{error}</FieldMessage>}
        {calendar && <CalendarSheet label={label} range />}
      </DateRangePicker>
    </DateProviders>
  )
}
