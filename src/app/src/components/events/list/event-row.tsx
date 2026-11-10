import { useTranslation } from 'react-i18next'
import { EventBadge } from '#/components/events/event-badge'
import { EventActions } from '#/components/events/list/event-actions'
import { ListRow } from '#/components/lists/list-row'
import { AvatarStack } from '#/components/people/avatars'
import { useLocale } from '#/hooks/app/use-locale'
import { formatDate } from '#/lib/shared/format'
import type { EventItem, EventType } from '#/lib/events/event'
import type { Person } from '#/lib/people/person'

/** The dates of an event: none, one day, a range, or open at the start ("Jusqu'au …"). */
export function useDateRange(event: Pick<EventItem, 'startsOn' | 'endsOn'>) {
  const { t } = useTranslation()
  const locale = useLocale()
  const format = (date: string) => formatDate(date, locale, 'medium')
  if (!event.startsOn)
    return event.endsOn ? t('events.until', { date: format(event.endsOn) }) : ''
  if (!event.endsOn || event.endsOn === event.startsOn)
    return format(event.startsOn)
  return t('events.dayRange', {
    start: format(event.startsOn),
    end: format(event.endsOn),
  })
}

/** An event: its type's badge, the name, the dates, who was there, how many transactions. */
export function EventRow({
  event,
  type,
  people,
}: {
  event: EventItem
  type: EventType | undefined
  people: ReadonlyArray<Person>
}) {
  const { t } = useTranslation()
  const dates = useDateRange(event)
  const names = people
    .filter((p) => event.personIds.includes(p.id))
    .map((p) => ({ name: p.name, count: 1 }))
  return (
    <ListRow
      link={{ to: '/settings/events/$eventId', params: { eventId: event.id } }}
      actions={
        <EventActions
          kind="event"
          row={{
            id: event.id,
            name: event.name,
            count: event.transactionCount,
          }}
        />
      }
    >
      <EventBadge color={type?.color ?? null} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold">{event.name}</span>
        <span className="truncate text-sm text-muted-foreground">{dates}</span>
      </span>
      {names.length > 0 && <AvatarStack items={names} size="md" />}
      <span className="shrink-0 text-sm whitespace-nowrap text-muted-foreground">
        {t('events.transactionCount', { count: event.transactionCount })}
      </span>
    </ListRow>
  )
}

/** A type: its icon in its colour, the name, how many events have it. */
export function TypeRow({ type }: { type: EventType }) {
  const { t } = useTranslation()
  return (
    <ListRow
      link={{
        to: '/settings/events/types/$typeId',
        params: { typeId: type.id },
      }}
      actions={
        <EventActions
          kind="type"
          row={{ id: type.id, name: type.name, count: type.eventCount }}
        />
      }
    >
      <EventBadge color={type.color} />
      <span className="min-w-0 flex-1 truncate font-semibold">{type.name}</span>
      <span className="shrink-0 text-sm whitespace-nowrap text-muted-foreground">
        {t('events.eventCount', { count: type.eventCount })}
      </span>
    </ListRow>
  )
}
