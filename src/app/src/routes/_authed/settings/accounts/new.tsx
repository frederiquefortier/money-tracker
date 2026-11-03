import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AccountForm } from '#/components/accounts/account-form'
import { RouteSheet } from '#/components/route-sheet'
import { useToast } from '#/components/toaster'
import { DEFAULT_ACCOUNT_TYPE } from '#/lib/accounts'
import { todayIso } from '#/lib/format'
import { useAccountsPage } from '#/lib/use-accounts-page'
import { useMyCurrencies } from '#/lib/use-my-currencies'

export const Route = createFileRoute('/_authed/settings/accounts/new')({
  component: NewAccount,
})

function NewAccount() {
  const { t } = useTranslation()
  const toast = useToast()
  const { institutions, types } = useAccountsPage()
  const { defaultCurrency } = useMyCurrencies()
  const type = types.some((ty) => ty.code === DEFAULT_ACCOUNT_TYPE)
    ? DEFAULT_ACCOUNT_TYPE
    : (types[0]?.code ?? '')

  return (
    <RouteSheet to="/settings/accounts" title={t('accounts.newTitle')}>
      <AccountForm
        initial={{
          name: '',
          type,
          currency: defaultCurrency,
          openingBalance: '0',
          openedOn: todayIso(),
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
