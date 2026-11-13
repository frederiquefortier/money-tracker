import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  AddCurrencyButton,
  CurrencyManager,
} from '#/components/currencies/currency-manager'
import { ListPage } from '#/components/layout/list-page'
import { getCurrencySettings } from '#/server/currencies'
import { listPagePending } from '#/components/layout/page-pending'

export const Route = createFileRoute('/_authed/settings/currencies')({
  ...listPagePending((t) => t('currencies.title')),
  loader: () => getCurrencySettings(),
  component: Currencies,
})

function Currencies() {
  const { t } = useTranslation()
  const { ratesFrom, openAccounts, openHoldings } = Route.useLoaderData()

  return (
    <ListPage title={t('currencies.title')}>
      <CurrencyManager
        ratesFrom={ratesFrom}
        openAccounts={openAccounts}
        openHoldings={openHoldings}
      />
      <AddCurrencyButton />
      {/* Adding a currency opens here as a sheet. */}
      <Outlet />
    </ListPage>
  )
}
