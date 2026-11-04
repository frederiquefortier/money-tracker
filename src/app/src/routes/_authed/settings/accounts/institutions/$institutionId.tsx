import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { InstitutionActions } from '#/components/accounts/institution-actions'
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
  const { accounts, institutions } = useAccountsPage()
  const { institutionId } = Route.useParams()
  const institution = institutions.find((i) => i.id === institutionId)
  if (!institution) return <Navigate to="/settings/accounts" />

  return (
    <RouteSheet
      to="/settings/accounts"
      title={t('institutions.editTitle')}
      actions={
        <InstitutionActions
          institution={institution}
          inUse={accounts.some((a) => a.institutionId === institution.id)}
          placement="sheet"
        />
      }
    >
      <InstitutionForm key={institution.id} institution={institution} />
    </RouteSheet>
  )
}
