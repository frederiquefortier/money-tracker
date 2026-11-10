import { parseDate } from '@internationalized/date'
import {
  Button,
  DateInput,
  DatePicker,
  DateSegment,
  Group,
} from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import {
  CalendarSheet,
  DateProviders,
  FieldLabelRow,
  roundButton,
  segmentClass,
} from '#/components/forms/calendar-sheet'
import { Icon } from '#/components/display/icon'
import { fieldControl } from '#/components/ui/field'
import { cn } from '#/lib/utils'

const toDate = (iso: string | null | undefined) => (iso ? parseDate(iso) : null)

/**
 * One date, typed in segments or picked in the shared calendar (ADR-027, which replaces
 * ADR-024's native field). Controlled with `value` and `onChange` ('' for no date), or
 * left to a form with `name` and `defaultValue`: a hidden input then carries the ISO date.
 */
export function DatePickerField({
  label,
  name,
  value,
  defaultValue,
  onChange,
  minValue,
  maxValue,
  required = false,
  clearable = false,
  error,
}: {
  label: string
  name?: string
  value?: string
  defaultValue?: string
  onChange?: (date: string) => void
  /** The first and last days that can be chosen (ISO dates). */
  minValue?: string
  maxValue?: string
  required?: boolean
  /** A ✕ empties the field, for an optional date. */
  clearable?: boolean
  error?: string
}) {
  const { t } = useTranslation()
  const controlled = value !== undefined
  return (
    <DateProviders>
      <DatePicker
        name={name}
        {...(controlled
          ? { value: toDate(value) }
          : { defaultValue: toDate(defaultValue) })}
        minValue={toDate(minValue)}
        maxValue={toDate(maxValue)}
        isRequired={required}
        isInvalid={error ? true : undefined}
        onChange={(date) => onChange?.(date?.toString() ?? '')}
        className="flex flex-col gap-2"
      >
        <FieldLabelRow label={label} required={required} />
        <Group
          className={cn(
            fieldControl,
            'flex items-center gap-1 pr-1',
            'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
          )}
        >
          <DateInput className="flex flex-1">
            {(part) => <DateSegment segment={part} className={segmentClass} />}
          </DateInput>
          {clearable && controlled && value && (
            <Button
              slot={null}
              aria-label={t('common.clear')}
              onPress={() => onChange?.('')}
              className={roundButton}
            >
              <Icon name="close" />
            </Button>
          )}
          <Button aria-label={t('common.chooseDates')} className={roundButton}>
            <Icon name="calendar" />
          </Button>
        </Group>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <CalendarSheet label={label} range={false} />
      </DatePicker>
    </DateProviders>
  )
}
