import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useMyCurrencies } from '#/lib/use-my-currencies'
import { AccountForm } from '#/components/accounts/account-form'
import { RouteSheet } from '#/components/route-sheet'
import { useToast } from '#/components/toaster'

export const Route = createFileRoute('/_authed/settings/accounts/new')({
  component: NewAccount,
})

function NewAccount() {
  const { t } = useTranslation()
  const toast = useToast()
  const { institutions, types } = useLoaderData({
    from: '/_authed/settings/accounts',
  })
  const currencies = useMyCurrencies()

  return (
    <RouteSheet to="/settings/accounts" title={t('accounts.newTitle')}>
      <AccountForm
        initial={{
          name: '',
          type: types[0]?.code ?? 'checking',
          currency: currencies.defaultCurrency,
          openingBalance: '0',
          openedOn: new Date().toISOString().slice(0, 10),
          hiddenForNew: false,
        }}
        initialInstitutionId={null}
        institutions={institutions}
        types={types}
        onSaved={() => toast({ text: t('accounts.created') })}
      />
    </RouteSheet>
  )
}
