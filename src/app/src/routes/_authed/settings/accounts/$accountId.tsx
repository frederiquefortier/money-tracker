import {
  Navigate,
  createFileRoute,
  useLoaderData,
} from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AccountForm } from '#/components/accounts/account-form'
import { RouteSheet } from '#/components/route-sheet'
import { useToast } from '#/components/toaster'
import { amountForInput } from '#/lib/accounts'

export const Route = createFileRoute('/_authed/settings/accounts/$accountId')({
  component: EditAccount,
})

function EditAccount() {
  const { t } = useTranslation()
  const toast = useToast()
  const { accounts, institutions, types } = useLoaderData({
    from: '/_authed/settings/accounts',
  })
  const { session } = Route.useRouteContext()
  const { accountId } = Route.useParams()
  const account = accounts.find((a) => a.id === accountId)
  if (!account) return <Navigate to="/settings/accounts" />

  return (
    <RouteSheet to="/settings/accounts" title={t('accounts.editTitle')}>
      <AccountForm
        key={account.id}
        accountId={account.id}
        initial={{
          name: account.name,
          type: account.type,
          currency: account.currency,
          openingBalance: amountForInput(
            account.openingBalance,
            session.locale,
          ),
          openedOn: account.openedOn,
          hiddenForNew: account.hiddenForNew,
        }}
        initialInstitutionId={account.institutionId}
        institutions={institutions}
        types={types}
        onSaved={() => toast({ text: t('accounts.updated') })}
      />
    </RouteSheet>
  )
}
