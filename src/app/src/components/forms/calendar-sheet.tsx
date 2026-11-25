import { UNSAFE_PortalProvider } from 'react-aria'
import {
  Button,
  Calendar,
  Dialog,
  I18nProvider,
  Label,
  Modal,
  ModalOverlay,
  RangeCalendar,
} from 'react-aria-components'
import { useTranslation } from 'react-i18next'
import { Icon } from '#/components/display/icon'
import { CalendarMonthGrid } from '#/components/forms/calendar-month-grid'
import { pageWidth, roundButton } from '#/components/styles'
import { useOverlayContainer } from '#/hooks/app/use-overlay-container'
import { DATE_FIELD_LOCALE } from '#/i18n/locales'
import { useLocale } from '#/hooks/app/use-locale'
import { cn } from '#/lib/utils'

// The calendar every date field shares (ADR-027): up from the bottom over the sheet or
// dialog the field is in, with a dim backdrop. The fields are DatePickerField and DateRangeField.

/** The "/" between a date's numbers has no padding, so it reads 12/11/2026. */
export const literalClass = 'px-0'

export const segmentClass = cn(
  'rounded-field px-0.5 tabular-nums outline-none',
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
          <CalendarMonthGrid range />
        </RangeCalendar>
      ) : (
        <Calendar aria-label={label} className={body}>
          <CalendarMonthGrid range={false} />
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
          !container && pageWidth,
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
