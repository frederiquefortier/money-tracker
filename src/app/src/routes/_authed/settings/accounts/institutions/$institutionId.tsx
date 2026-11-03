import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { InstitutionForm } from '#/components/accounts/institution-form'
import { RouteSheet } from '#/components/route-sheet'
import { useAccountsPage } from '#/lib/use-accounts-page'

export const Route = createFileRoute(
  '/_authed/settings/accounts/institutions/$institutionId',
)({
  component: EditInstitution,
})

function EditInstitution() {
  const { t } = useTranslation()
  const { institutions } = useAccountsPage()
  const { institutionId } = Route.useParams()
  const institution = institutions.find((i) => i.id === institutionId)
  if (!institution) return <Navigate to="/settings/accounts" />

  return (
    <RouteSheet to="/settings/accounts" title={t('institutions.editTitle')}>
      <InstitutionForm key={institution.id} institution={institution} />
    </RouteSheet>
  )
}
