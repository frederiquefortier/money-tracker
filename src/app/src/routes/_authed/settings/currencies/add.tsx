import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AddCurrencyForm } from '#/components/currencies/add-currency-form'
import { RouteSheet } from '#/components/route-sheet'
import { useMyCurrencies } from '#/lib/use-my-currencies'

export const Route = createFileRoute('/_authed/settings/currencies/add')({
  component: AddCurrency,
})

function AddCurrency() {
  const { t } = useTranslation()
  const { catalog } = useLoaderData({ from: '/_authed/settings/currencies' })
  const { currencies } = useMyCurrencies()

  return (
    <RouteSheet to="/settings/currencies" title={t('currencies.add')}>
      <AddCurrencyForm
        catalog={catalog}
        owned={new Set(currencies.map((c) => c.code))}
      />
    </RouteSheet>
  )
}
