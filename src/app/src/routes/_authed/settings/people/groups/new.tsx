import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PeopleForm } from '#/components/people/people-form'
import { RouteSheet } from '#/components/route-sheet'
import { usePeoplePage } from '#/lib/use-page-data'

export const Route = createFileRoute('/_authed/settings/people/groups/new')({
  staticData: { sheet: true },
  component: NewGroup,
})

function NewGroup() {
  const { t } = useTranslation()
  const { people } = usePeoplePage()

  return (
    <RouteSheet to="/settings/people" title={t('people.newGroup')}>
      <PeopleForm
        kind="group"
        row={null}
        linkedIds={[]}
        others={people}
        savedText={t('people.groupCreated')}
      />
    </RouteSheet>
  )
}
