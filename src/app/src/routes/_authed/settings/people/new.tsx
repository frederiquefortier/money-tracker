import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { PeopleForm } from '#/components/people/people-form'
import { RouteSheet } from '#/components/route-sheet'
import { takenNames, withMemberNames } from '#/lib/people'
import { usePeoplePage } from '#/lib/use-page-data'
import { useFormatLocale } from '#/lib/use-locale'

export const Route = createFileRoute('/_authed/settings/people/new')({
  staticData: { sheet: true },
  component: NewPerson,
})

function NewPerson() {
  const { t } = useTranslation()
  const locale = useFormatLocale()
  const { people, groups } = usePeoplePage()

  return (
    <RouteSheet to="/settings/people" title={t('people.newPerson')}>
      <PeopleForm
        kind="person"
        row={null}
        linkedIds={[]}
        others={withMemberNames(groups, people, locale)}
        taken={takenNames(people, undefined)}
        savedText={t('people.personCreated')}
      />
    </RouteSheet>
  )
}
