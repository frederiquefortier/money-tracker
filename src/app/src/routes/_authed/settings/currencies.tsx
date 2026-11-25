import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import {
  AddCurrencyButton,
  CurrencyManager,
} from '#/components/currencies/list/currency-manager'
import { ListPage } from '#/components/layout/list-page'
import { useMyCurrencies } from '#/hooks/currencies/use-my-currencies'
import { getCurrencySettings } from '#/server/currencies'
import { listPagePending } from '#/components/layout/page-pending'
import { CurrenciesSkeleton } from '#/components/currencies/list/currencies-skeleton'

export const Route = createFileRoute('/_authed/settings/currencies')({
  ...listPagePending((t) => t('currencies.title'), {
    body: CurrenciesSkeleton,
  }),
  loader: () => getCurrencySettings(),
  component: Currencies,
})

function Currencies() {
  const { t } = useTranslation()
  const { ratesFrom, openAccounts, openHoldings } = Route.useLoaderData()
  const { currencies } = useMyCurrencies()

  return (
    <ListPage title={t('currencies.title')} count={currencies.length}>
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
