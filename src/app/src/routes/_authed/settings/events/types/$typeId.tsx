import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { EventActions } from '#/components/events/list/event-actions'
import { EventTypeForm } from '#/components/events/form/type-form'
import { RouteSheet } from '#/components/sheet/route-sheet'
import { useEventsPage } from '#/hooks/app/use-page-data'

export const Route = createFileRoute('/_authed/settings/events/types/$typeId')({
  staticData: { sheet: true },
  component: EditType,
})

function EditType() {
  const { t } = useTranslation()
  const { types } = useEventsPage()
  const { typeId } = Route.useParams()
  const type = types.find((x) => x.id === typeId)
  if (!type) return <Navigate to="/settings/events" resetScroll={false} />

  return (
    <RouteSheet
      to="/settings/events"
      title={t('events.editType')}
      actions={
        <EventActions
          kind="type"
          row={{ id: type.id, name: type.name, count: type.eventCount }}
          placement="sheet"
        />
      }
    >
      <EventTypeForm
        key={type.id}
        row={type}
        initial={type}
        savedText={t('events.typeUpdated')}
      />
    </RouteSheet>
  )
}
