import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { RouteSheet } from '#/components/sheet/route-sheet'
import { TransferActions } from '#/components/transactions/entry/transfer-actions'
import { TransferForm } from '#/components/transactions/entry/transfer-form'
import { draftFromTransfer } from '#/lib/transfers/transfer-draft'
import { loadTransactionForm } from '#/server/transaction-form'
import { useLocale } from '#/hooks/app/use-locale'
import { getTransfer, getTransferFeeCategory } from '#/server/transfers'

export const Route = createFileRoute(
  '/_authed/transactions/transfers/$transferId',
)({
  loader: async ({ params }) => {
    const [data, transfer, feeCategoryId] = await Promise.all([
      loadTransactionForm(),
      getTransfer({ data: { id: params.transferId } }),
      getTransferFeeCategory(),
    ])
    return { data, transfer, feeCategoryId }
  },
  staticData: { sheet: true },
  component: EditTransfer,
})

function EditTransfer() {
  const { t } = useTranslation()
  const locale = useLocale()
  const { data, transfer, feeCategoryId } = Route.useLoaderData()
  const from = data.accounts.find((a) => a.id === transfer?.fromAccountId)
  const to = data.accounts.find((a) => a.id === transfer?.toAccountId)
  if (!transfer || !from || !to)
    return <Navigate to="/transactions" resetScroll={false} />

  return (
    <RouteSheet
      to="/transactions"
      title={t('transactions.transfer.editTitle')}
      actions={
        <TransferActions
          placement="sheet"
          summary={{
            transferId: transfer.id,
            occurredOn: transfer.occurredOn,
            amount: transfer.amount,
            currency: from.currency,
            from,
            to,
            hasFee: transfer.fee !== null,
          }}
        />
      }
    >
      <TransferForm
        key={transfer.id}
        id={transfer.id}
        initial={draftFromTransfer(
          transfer,
          { from: from.currency, to: to.currency },
          locale,
        )}
        data={data}
        feeCategoryId={feeCategoryId}
        savedText={t('transactions.transfer.updated')}
      />
    </RouteSheet>
  )
}
