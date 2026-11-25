import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { InstitutionActions } from '#/components/institutions/list/institution-actions'
import { InstitutionForm } from '#/components/institutions/form/institution-form'
import { RouteSheet } from '#/components/sheet/route-sheet'
import { useInstitutionsPage } from '#/hooks/app/use-page-data'

export const Route = createFileRoute(
  '/_authed/settings/institutions/$institutionId',
)({
  staticData: { sheet: true },
  component: EditInstitution,
})

function EditInstitution() {
  const { t } = useTranslation()
  const institutions = useInstitutionsPage()
  const { institutionId } = Route.useParams()
  const institution = institutions.find((i) => i.id === institutionId)
  if (!institution)
    return <Navigate to="/settings/institutions" resetScroll={false} />

  return (
    <RouteSheet
      to="/settings/institutions"
      title={t('institutions.editTitle')}
      actions={
        <InstitutionActions institution={institution} placement="sheet" />
      }
    >
      <InstitutionForm
        key={institution.id}
        institution={institution}
        savedText={t('institutions.updated')}
      />
    </RouteSheet>
  )
}
