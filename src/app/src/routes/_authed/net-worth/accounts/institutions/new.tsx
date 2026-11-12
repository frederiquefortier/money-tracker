import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { InstitutionForm } from '#/components/accounts/institutions/institution-form'
import { RouteSheet } from '#/components/sheet/route-sheet'

export const Route = createFileRoute(
  '/_authed/net-worth/accounts/institutions/new',
)({
  staticData: { sheet: true },
  component: NewInstitution,
})

function NewInstitution() {
  const { t } = useTranslation()
  return (
    <RouteSheet to="/net-worth/accounts" title={t('institutions.newTitle')}>
      <InstitutionForm institution={null} />
    </RouteSheet>
  )
}
