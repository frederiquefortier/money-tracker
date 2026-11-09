import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AccountActions } from '#/components/accounts/list/account-actions'
import { AccountForm } from '#/components/accounts/form/account-form'
import { RouteSheet } from '#/components/sheet/route-sheet'
import { amountForInput } from '#/lib/shared/money'
import { useAccountsPage } from '#/hooks/app/use-page-data'
import { useLocale } from '#/hooks/app/use-locale'

export const Route = createFileRoute('/_authed/accounts/$accountId')({
  staticData: { sheet: true },
  component: EditAccount,
})

function EditAccount() {
  const { t } = useTranslation()
  const { accounts, institutions, types } = useAccountsPage()
  const locale = useLocale()
  const { accountId } = Route.useParams()
  const account = accounts.find((a) => a.id === accountId)
  if (!account) return <Navigate to="/accounts" resetScroll={false} />

  return (
    <RouteSheet
      to="/accounts"
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
