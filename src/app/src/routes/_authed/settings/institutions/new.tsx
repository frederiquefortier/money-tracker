import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { InstitutionForm } from '#/components/institutions/form/institution-form'
import { RouteSheet } from '#/components/sheet/route-sheet'

export const Route = createFileRoute('/_authed/settings/institutions/new')({
  staticData: { sheet: true },
  component: NewInstitution,
})

function NewInstitution() {
  const { t } = useTranslation()
  return (
    <RouteSheet to="/settings/institutions" title={t('institutions.newTitle')}>
      <InstitutionForm
        institution={null}
        savedText={t('institutions.created')}
      />
    </RouteSheet>
  )
}
