import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { EventForm } from '#/components/events/form/event-form'
import { RouteSheet } from '#/components/sheet/route-sheet'
import { useEventsPage } from '#/hooks/app/use-page-data'

export const Route = createFileRoute('/_authed/settings/events/new')({
  staticData: { sheet: true },
  component: NewEvent,
})

function NewEvent() {
  const { t } = useTranslation()
  const { types, people, groups, categories, defaultSkipIds } = useEventsPage()
  return (
    <RouteSheet to="/settings/events" title={t('events.newEvent')}>
      <EventForm
        row={null}
        types={types}
        people={people}
        groups={groups}
        categories={categories}
        defaultSkipIds={defaultSkipIds}
        savedText={t('events.eventCreated')}
      />
    </RouteSheet>
  )
}
