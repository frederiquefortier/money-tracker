import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  AddCurrencyButton,
  CurrencyManager,
} from '#/components/currencies/currency-manager'
import { SettingsPage } from '#/components/settings-page'
import { getCurrencySettings } from '#/server/currencies'

export const Route = createFileRoute('/_authed/settings/currencies')({
  loader: () => getCurrencySettings(),
  component: Currencies,
})

function Currencies() {
  const { t } = useTranslation()
  const { ratesFrom, openAccounts } = Route.useLoaderData()

  return (
    <SettingsPage title={t('currencies.title')} actions={<AddCurrencyButton />}>
      <CurrencyManager ratesFrom={ratesFrom} openAccounts={openAccounts} />
      {/* Adding a currency opens here as a sheet (spec 10). */}
      <Outlet />
    </SettingsPage>
  )
}
