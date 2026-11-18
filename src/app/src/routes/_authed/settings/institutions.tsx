import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { InstitutionRowView } from '#/components/institutions/institution-row'
import { FloatingAddLink } from '#/components/layout/floating-add-button'
import { ListPage } from '#/components/layout/list-page'
import { EmptyState, ListCard } from '#/components/lists/list-card'
import { getInstitutions } from '#/server/institutions'
import { listPagePending } from '#/components/layout/page-pending'
import { Revealed } from '#/components/lists/revealed'

export const Route = createFileRoute('/_authed/settings/institutions')({
  ...listPagePending((t) => t('settings.institutions')),
  loader: () => getInstitutions(),
  component: Institutions,
})

function Institutions() {
  const { t } = useTranslation()
  const institutions = Route.useLoaderData()

  return (
    <ListPage title={t('settings.institutions')} count={institutions.length}>
      {institutions.length === 0 ? (
        <EmptyState>{t('institutions.empty')}</EmptyState>
      ) : (
        <ListCard>
          <Revealed items={institutions}>
            {(shown) =>
              shown.map((institution) => (
                <InstitutionRowView
                  key={institution.id}
                  institution={institution}
                />
              ))
            }
          </Revealed>
        </ListCard>
      )}
      <FloatingAddLink
        to="/settings/institutions/new"
        label={t('institutions.add')}
      />
      {/* The institution form opens here as a sheet, over the list. */}
      <Outlet />
    </ListPage>
  )
}
