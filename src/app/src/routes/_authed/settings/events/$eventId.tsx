import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { EventActions } from '#/components/events/list/event-actions'
import { EventForm } from '#/components/events/form/event-form'
import { RouteSheet } from '#/components/sheet/route-sheet'
import { useEventsPage } from '#/hooks/app/use-page-data'

export const Route = createFileRoute('/_authed/settings/events/$eventId')({
  staticData: { sheet: true },
  component: EditEvent,
})

function EditEvent() {
  const { t } = useTranslation()
  const { events, types, people, groups, categories, defaultSkipIds } =
    useEventsPage()
  const { eventId } = Route.useParams()
  const event = events.find((e) => e.id === eventId)
  if (!event) return <Navigate to="/settings/events" resetScroll={false} />

  return (
    <RouteSheet
      to="/settings/events"
      title={t('events.editEvent')}
      actions={
        <EventActions
          kind="event"
          row={{
            id: event.id,
            name: event.name,
            count: event.transactionCount,
          }}
          placement="sheet"
        />
      }
    >
      <EventForm
        key={event.id}
        row={event}
        types={types}
        people={people}
        groups={groups}
        categories={categories}
        defaultSkipIds={defaultSkipIds}
        savedText={t('events.eventUpdated')}
      />
    </RouteSheet>
  )
}
