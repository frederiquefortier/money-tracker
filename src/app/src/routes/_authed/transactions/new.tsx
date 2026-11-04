import { Link, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { RouteSheet } from '#/components/route-sheet'
import { useToast } from '#/components/toaster'
import { TransactionForm } from '#/components/transactions/transaction-form'
import { SheetBody } from '#/components/ui/sheet'
import { todayIso } from '#/lib/format'
import { emptyDraft } from '#/lib/transaction-draft'
import { loadTransactionForm } from '#/lib/transaction-form-data'
import { useStoredState } from '#/lib/use-stored-state'

export const Route = createFileRoute('/_authed/transactions/new')({
  loader: () => loadTransactionForm(),
  component: NewTransaction,
})

const parseId = (v: unknown) => (typeof v === 'string' ? v : undefined)

function NewTransaction() {
  const { t } = useTranslation()
  const toast = useToast()
  const data = Route.useLoaderData()
  // The account last used, remembered per browser (spec 15).
  const [lastAccount, setLastAccount] = useStoredState(
    'transactions.account',
    '',
    parseId,
  )
  const choosable = data.accounts.filter((a) => !a.closedOn && !a.hiddenForNew)
  const account = choosable.find((a) => a.id === lastAccount) ?? choosable.at(0)

  return (
    <RouteSheet to="/transactions" title={t('transactions.newTitle')}>
      {account ? (
        <TransactionForm
          // The stored account arrives after mount; the form starts again with it.
          key={account.id}
          initial={emptyDraft(account, todayIso())}
          data={data}
          onSaved={(accountId) => {
            setLastAccount(accountId)
            toast({ text: t('transactions.created') })
          }}
        />
      ) : (
        <SheetBody className="flex flex-col gap-2">
          <p>{t('transactions.noAccount')}</p>
          <Link to="/settings/accounts" className="font-semibold text-primary">
            {t('settings.accounts')}
          </Link>
        </SheetBody>
      )}
    </RouteSheet>
  )
}
