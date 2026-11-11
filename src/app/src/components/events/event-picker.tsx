import { useTranslation } from 'react-i18next'
import { Combobox } from '#/components/combobox/combobox'
import { EventBadge } from '#/components/events/event-badge'
import { useFormatLocale } from '#/hooks/app/use-locale'
import { sortEvents } from '#/lib/events/event'
import type { EventItem, EventType } from '#/lib/events/event'

/**
 * EVT-03: the event of a transaction, newest first, past ones included since
 * transactions are linked after the occasion. While the value comes from the rule, the
 * field says so.
 */
export function EventPicker({
  events,
  types,
  value,
  auto,
  onChange,
}: {
  events: ReadonlyArray<EventItem>
  types: ReadonlyArray<EventType>
  value: string | null
  /** The value is the rule's, not a choice made by hand. */
  auto: boolean
  onChange: (eventId: string | null) => void
}) {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const options = sortEvents(events, 'dateDesc', locale).map((event) => {
    const type = types.find((x) => x.id === event.typeId)
    return {
      value: event.id,
      label: event.name,
      icon: <EventBadge color={type?.color ?? null} size="sm" />,
      tag: auto && event.id === value ? t('transactions.eventAuto') : undefined,
    }
  })
  return (
    <Combobox
      label={t('transactions.event')}
      options={options}
      value={value}
      onChange={onChange}
      clearLabel={t('transactions.clearEvent')}
    />
  )
}
