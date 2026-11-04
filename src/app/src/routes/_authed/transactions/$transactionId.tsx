import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { RouteSheet } from '#/components/route-sheet'
import { useToast } from '#/components/toaster'
import { TransactionActions } from '#/components/transactions/transaction-actions'
import { TransactionForm } from '#/components/transactions/transaction-form'
import { draftFromTransaction } from '#/lib/transaction-draft'
import { loadTransactionForm } from '#/lib/transaction-form-data'
import { useLocale } from '#/lib/use-locale'
import { getTransaction } from '#/server/transactions'

export const Route = createFileRoute('/_authed/transactions/$transactionId')({
  loader: async ({ params }) => {
    const [data, transaction] = await Promise.all([
      loadTransactionForm(),
      getTransaction({ data: { id: params.transactionId } }),
    ])
    return { data, transaction }
  },
  component: EditTransaction,
})

function EditTransaction() {
  const { t } = useTranslation()
  const toast = useToast()
  const locale = useLocale()
  const { data, transaction } = Route.useLoaderData()
  const account = data.accounts.find((a) => a.id === transaction?.accountId)
  if (!transaction || !account) return <Navigate to="/transactions" />

  return (
    <RouteSheet
      to="/transactions"
      title={t('transactions.editTitle')}
      actions={
        <TransactionActions transactionId={transaction.id} placement="sheet" />
      }
    >
      <TransactionForm
        key={transaction.id}
        id={transaction.id}
        initial={draftFromTransaction(transaction, account.currency, locale)}
        data={data}
        onSaved={() => toast({ text: t('transactions.updated') })}
      />
    </RouteSheet>
  )
}
