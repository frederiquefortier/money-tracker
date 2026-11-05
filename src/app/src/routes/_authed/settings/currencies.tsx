import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  AddCurrencyButton,
  CurrencyManager,
} from '#/components/currencies/currency-manager'
import { ListPage } from '#/components/list-page'
import { getCurrencySettings } from '#/server/currencies'

export const Route = createFileRoute('/_authed/settings/currencies')({
  loader: () => getCurrencySettings(),
  component: Currencies,
})

function Currencies() {
  const { t } = useTranslation()
  const { ratesFrom, openAccounts } = Route.useLoaderData()

  return (
    <ListPage title={t('currencies.title')}>
      <CurrencyManager ratesFrom={ratesFrom} openAccounts={openAccounts} />
      <AddCurrencyButton />
      {/* Adding a currency opens here as a sheet (spec 10). */}
      <Outlet />
    </ListPage>
  )
}
