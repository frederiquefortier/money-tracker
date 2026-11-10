import { UNSAFE_PortalProvider } from 'react-aria'
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Dialog,
  Heading,
  I18nProvider,
  Label,
  Modal,
  ModalOverlay,
  RangeCalendar,
} from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { focusRing } from '#/components/styles'
import { useOverlayContainer } from '#/components/ui/overlay-container'
import { DATE_FIELD_LOCALE } from '#/i18n/locales'
import { useLocale } from '#/hooks/app/use-locale'
import { cn } from '#/lib/utils'

// The calendar every date field shares (ADR-027): up from the bottom over the sheet or
// dialog the field is in, with a dim backdrop. The fields are DatePickerField and DateRangeField.

export const roundButton = cn(
  'grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground',
  focusRing,
)

export const segmentClass = cn(
  'rounded-xs px-0.5 tabular-nums outline-none',
  'data-[focused]:bg-primary data-[focused]:text-primary-foreground data-[placeholder]:text-muted-foreground',
)

/** Dates in the user's full locale, and the calendar kept inside the open sheet or dialog. */
export function DateProviders({ children }: { children: React.ReactNode }) {
  const locale = useLocale()
  const container = useOverlayContainer()
  return (
    <I18nProvider locale={DATE_FIELD_LOCALE[locale]}>
      <UNSAFE_PortalProvider getContainer={container ? () => container : null}>
        {children}
      </UNSAFE_PortalProvider>
    </I18nProvider>
  )
}

/** A field's label, with its explanation (an InfoTooltip) pushed to the far end. */
export function FieldLabelRow({
  label,
  required = false,
  addon,
}: {
  label: string
  required?: boolean
  addon?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-sm leading-none font-medium">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-primary">
            *
          </span>
        )}
      </Label>
      {addon}
    </div>
  )
}

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

/** The month grid with its arrows: Page Up and Down move by month, with Shift by year. */
function MonthGrid({ range }: { range: boolean }) {
  return (
    <>
      <header className="flex items-center justify-between">
        <Button slot="previous" className={roundButton}>
          <Icon name="chevron-left" />
        </Button>
        <Heading className="font-semibold capitalize" />
        <Button slot="next" className={roundButton}>
          <Icon name="chevron-right" />
        </Button>
      </header>
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
    </>
  )
}

function Panel({
  label,
  range,
  close,
}: {
  label: string
  range: boolean
  close: () => void
}) {
  const { t } = useTranslation()
  const body =
    'mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col gap-2 overflow-y-auto px-4 py-3'
  return (
    <>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-mono text-sm font-bold tracking-wide uppercase">
          {label}
        </span>
        <Button
          slot={null}
          aria-label={t('common.close')}
          onPress={close}
          className={roundButton}
        >
          <Icon name="close" />
        </Button>
      </div>
      {range ? (
        <RangeCalendar aria-label={label} className={body}>
          <MonthGrid range />
        </RangeCalendar>
      ) : (
        <Calendar aria-label={label} className={body}>
          <MonthGrid range={false} />
        </Calendar>
      )}
    </>
  )
}

/**
 * The calendar, up from the bottom, full width of the sheet or dialog it opens from (the
 * page outside both), with a dim backdrop. In a sheet it is half the height; in the small
 * dialog it takes the height the month needs and rises above it.
 */
export function CalendarSheet({
  label,
  range,
}: {
  label: string
  range: boolean
}) {
  const container = useOverlayContainer()
  const inDialog = container?.dataset.slot === 'dialog-content'
  return (
    <ModalOverlay
      isDismissable
      className={cn(
        container ? 'absolute' : 'fixed',
        'inset-0 z-50 flex items-end justify-center overflow-visible bg-black/40',
        'data-[entering]:animate-in data-[entering]:fade-in-0 data-[exiting]:animate-out data-[exiting]:fade-out-0',
      )}
    >
      <Modal
        className={cn(
          'flex w-full flex-col rounded-t-2xl border-t bg-card text-card-foreground shadow-lg',
          inDialog ? 'h-96' : 'h-1/2 min-h-96',
          !container && 'max-w-[48rem]',
          'data-[entering]:animate-in data-[entering]:slide-in-from-bottom data-[exiting]:animate-out data-[exiting]:slide-out-to-bottom',
        )}
      >
        <Dialog
          className="flex min-h-0 flex-1 flex-col outline-none"
          aria-label={label}
        >
          {({ close }) => <Panel label={label} range={range} close={close} />}
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
