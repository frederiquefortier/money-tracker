import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { RouteSheet } from '#/components/sheet/route-sheet'
import { TransactionActions } from '#/components/transactions/list/transaction-actions'
import { TransactionForm } from '#/components/transactions/form/transaction-form'
import { draftFromTransaction } from '#/lib/transactions/transaction-draft'
import { useTransactionFormData } from '#/hooks/app/use-page-data'
import { useLocale } from '#/hooks/app/use-locale'
import { getTransaction } from '#/server/transactions'
import { SHEET_PENDING } from '#/components/sheet/pending-sheet'

export const Route = createFileRoute(
  '/_authed/transactions/_form/$transactionId',
)({
  loader: async ({ params }) => {
    return {
      transaction: await getTransaction({ data: { id: params.transactionId } }),
    }
  },
  staticData: { sheet: true },
  ...SHEET_PENDING,
  component: EditTransaction,
})

function EditTransaction() {
  const { t } = useTranslation()
  const locale = useLocale()
  const { transaction } = Route.useLoaderData()
  const data = useTransactionFormData()
  const account = data.accounts.find((a) => a.id === transaction?.accountId)
  if (!transaction || !account)
    return <Navigate to="/transactions" resetScroll={false} />

  return (
    <RouteSheet
      to="/transactions"
      title={t('transactions.editTitle')}
      actions={
        <TransactionActions
          placement="sheet"
          summary={{
            id: transaction.id,
            occurredOn: transaction.occurredOn,
            amount: transaction.amount,
            currency: account.currency,
            merchant:
              data.merchants.find((m) => m.id === transaction.merchantId)
                ?.name ?? null,
            categories: transaction.splits.flatMap(
              (split) =>
                data.categories.find((c) => c.id === split.categoryId)?.name ??
                [],
            ),
            account: account,
          }}
        />
      }
    >
      <TransactionForm
        key={transaction.id}
        id={transaction.id}
        initial={draftFromTransaction(transaction, account.currency, locale)}
        data={data}
        savedText={t('transactions.updated')}
      />
    </RouteSheet>
  )
}
