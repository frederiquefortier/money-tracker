import { Outlet, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { CurrencyManager } from '#/components/currencies/currency-manager'
import { BackLink } from '#/components/back-link'
import { getCurrencySettings } from '#/server/currencies'

export const Route = createFileRoute('/_authed/settings/currencies')({
  loader: () => getCurrencySettings(),
  component: Currencies,
})

function Currencies() {
  const { t } = useTranslation()
  const { ratesFrom, openAccounts } = Route.useLoaderData()

  return (
    <div className="flex flex-col gap-4">
      <BackLink to="/settings" label={t('settings.back')} />
      <div className="mx-auto w-full max-w-[40rem]">
        <CurrencyManager
          heading={
            <h1 className="font-mono text-xl font-bold tracking-wide uppercase">
              {t('currencies.title')}
            </h1>
          }
          ratesFrom={ratesFrom}
          openAccounts={openAccounts}
        />
      </div>
      {/* Adding a currency opens here as a sheet (spec 10). */}
      <Outlet />
    </div>
  )
}
