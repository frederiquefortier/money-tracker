import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { EventTypeForm } from '#/components/events/form/type-form'
import { RouteSheet } from '#/components/sheet/route-sheet'
import { DEFAULT_EVENT_COLOR } from '#/lib/events/event'

export const Route = createFileRoute('/_authed/settings/events/types/new')({
  staticData: { sheet: true },
  component: NewType,
})

function NewType() {
  const { t } = useTranslation()
  return (
    <RouteSheet to="/settings/events" title={t('events.newType')}>
      <EventTypeForm
        row={null}
        initial={{ name: '', color: DEFAULT_EVENT_COLOR }}
        savedText={t('events.typeCreated')}
      />
    </RouteSheet>
  )
}
