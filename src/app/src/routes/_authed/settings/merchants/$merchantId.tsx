import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { MerchantActions } from '#/components/merchants/merchant-actions'
import { MerchantForm } from '#/components/merchants/merchant-form'
import { RouteSheet } from '#/components/route-sheet'
import { useMerchantsPage } from '#/lib/use-page-data'

export const Route = createFileRoute('/_authed/settings/merchants/$merchantId')(
  {
    staticData: { sheet: true },
    component: EditMerchant,
  },
)

function EditMerchant() {
  const { t } = useTranslation()
  const { merchants, categories } = useMerchantsPage()
  const { merchantId } = Route.useParams()
  const merchant = merchants.find((m) => m.id === merchantId)
  if (!merchant)
    return <Navigate to="/settings/merchants" resetScroll={false} />

  return (
    <RouteSheet
      to="/settings/merchants"
      title={t('merchants.editTitle')}
      actions={
        <MerchantActions
          merchant={merchant}
          merchants={merchants}
          placement="sheet"
        />
      }
    >
      <MerchantForm
        key={merchant.id}
        merchant={merchant}
        categories={categories}
        savedText={t('merchants.updated')}
      />
    </RouteSheet>
  )
}
