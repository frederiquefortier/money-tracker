import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PeopleActions } from '#/components/people/list/people-actions'
import { PeopleForm } from '#/components/people/form/people-form'
import { RouteSheet } from '#/components/sheet/route-sheet'
import { usePeoplePage } from '#/hooks/app/use-page-data'

export const Route = createFileRoute(
  '/_authed/settings/people/groups/$groupId',
)({
  staticData: { sheet: true },
  component: EditGroup,
})

function EditGroup() {
  const { t } = useTranslation()
  const { people, groups } = usePeoplePage()
  const { groupId } = Route.useParams()
  const group = groups.find((g) => g.id === groupId)
  if (!group) return <Navigate to="/settings/people" resetScroll={false} />

  return (
    <RouteSheet
      to="/settings/people"
      title={t('people.editGroup')}
      actions={<PeopleActions kind="group" row={group} placement="sheet" />}
    >
      <PeopleForm
        key={group.id}
        kind="group"
        row={group}
        linkedIds={group.memberIds}
        others={people}
        savedText={t('people.groupUpdated')}
      />
    </RouteSheet>
  )
}
