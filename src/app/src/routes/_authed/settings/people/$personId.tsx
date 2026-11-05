import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PeopleActions } from '#/components/people/people-actions'
import { PeopleForm } from '#/components/people/people-form'
import { RouteSheet } from '#/components/route-sheet'
import { takenNames, withMemberNames } from '#/lib/people'
import { usePeoplePage } from '#/lib/use-page-data'
import { useFormatLocale } from '#/lib/use-locale'

export const Route = createFileRoute('/_authed/settings/people/$personId')({
  staticData: { sheet: true },
  component: EditPerson,
})

function EditPerson() {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const { people, groups } = usePeoplePage()
  const { personId } = Route.useParams()
  const person = people.find((p) => p.id === personId)
  if (!person) return <Navigate to="/settings/people" resetScroll={false} />

  return (
    <RouteSheet
      to="/settings/people"
      title={t('people.editPerson')}
      actions={<PeopleActions kind="person" row={person} placement="sheet" />}
    >
      <PeopleForm
        key={person.id}
        kind="person"
        row={person}
        linkedIds={person.groupIds}
        others={withMemberNames(groups, people, locale)}
        aliases={person.aliases}
        taken={takenNames(people, person.id)}
        savedText={t('people.personUpdated')}
      />
    </RouteSheet>
  )
}
