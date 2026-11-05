import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AccountActions } from '#/components/accounts/account-actions'
import { AccountForm } from '#/components/accounts/account-form'
import { RouteSheet } from '#/components/route-sheet'
import { amountForInput } from '#/lib/money'
import { useAccountsPage } from '#/lib/use-page-data'
import { useLocale } from '#/lib/use-locale'

export const Route = createFileRoute('/_authed/settings/accounts/$accountId')({
  staticData: { sheet: true },
  component: EditAccount,
})

function EditAccount() {
  const { t } = useTranslation()
  const { accounts, institutions, types } = useAccountsPage()
  const locale = useLocale()
  const { accountId } = Route.useParams()
  const account = accounts.find((a) => a.id === accountId)
  if (!account) return <Navigate to="/settings/accounts" resetScroll={false} />

  return (
    <RouteSheet
      to="/settings/accounts"
      title={t('accounts.editTitle')}
      actions={<AccountActions account={account} placement="sheet" />}
    >
      <AccountForm
        key={account.id}
        accountId={account.id}
        initial={{
          name: account.name,
          type: account.type,
          currency: account.currency,
          openingBalance: amountForInput(
            account.openingBalance,
            account.currency,
            locale,
          ),
          openedOn: account.openedOn,
          hiddenForNew: account.hiddenForNew,
        }}
        initialInstitutionId={account.institutionId}
        institutions={institutions}
        types={types}
        savedText={t('accounts.updated')}
      />
    </RouteSheet>
  )
}
