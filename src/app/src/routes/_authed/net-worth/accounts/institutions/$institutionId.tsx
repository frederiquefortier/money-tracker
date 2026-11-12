import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { InstitutionActions } from '#/components/accounts/institutions/institution-actions'
import { InstitutionForm } from '#/components/accounts/institutions/institution-form'
import { RouteSheet } from '#/components/sheet/route-sheet'
import { useAccountsPage } from '#/hooks/app/use-page-data'

export const Route = createFileRoute(
  '/_authed/net-worth/accounts/institutions/$institutionId',
)({
  staticData: { sheet: true },
  component: EditInstitution,
})

function EditInstitution() {
  const { t } = useTranslation()
  const { accounts, institutions } = useAccountsPage()
  const { institutionId } = Route.useParams()
  const institution = institutions.find((i) => i.id === institutionId)
  if (!institution)
    return <Navigate to="/net-worth/accounts" resetScroll={false} />

  return (
    <RouteSheet
      to="/net-worth/accounts"
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
