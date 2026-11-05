import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { MerchantForm } from '#/components/merchants/merchant-form'
import { RouteSheet } from '#/components/route-sheet'
import { useToast } from '#/components/toaster'
import { useMerchantsPage } from '#/lib/use-merchants-page'

export const Route = createFileRoute('/_authed/settings/merchants/new')({
  staticData: { sheet: true },
  component: NewMerchant,
})

function NewMerchant() {
  const { t } = useTranslation()
  const toast = useToast()
  const { categories } = useMerchantsPage()

  return (
    <RouteSheet to="/settings/merchants" title={t('merchants.newTitle')}>
      <MerchantForm
        merchant={null}
        categories={categories}
        onSaved={() => toast({ text: t('merchants.created') })}
      />
    </RouteSheet>
  )
}
