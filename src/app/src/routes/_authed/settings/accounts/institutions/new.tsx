import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { InstitutionForm } from '#/components/accounts/institution-form'
import { RouteSheet } from '#/components/route-sheet'

export const Route = createFileRoute(
  '/_authed/settings/accounts/institutions/new',
)({
  staticData: { sheet: true },
  component: NewInstitution,
})

function NewInstitution() {
  const { t } = useTranslation()
  return (
    <RouteSheet to="/settings/accounts" title={t('institutions.newTitle')}>
      <InstitutionForm institution={null} />
    </RouteSheet>
  )
}
