import { Navigate, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { RouteSheet } from '#/components/route-sheet'
import { AdjustmentActions } from '#/components/transactions/adjustment-actions'
import { AdjustmentForm } from '#/components/transactions/adjustment-form'
import { accountLabel } from '#/lib/accounts'
import { balanceWith } from '#/lib/adjustments'
import { amountForInput } from '#/lib/money'
import { useLocale } from '#/lib/use-locale'
import { getAdjustment, getAdjustmentBalance } from '#/server/adjustments'
import { getFormAccounts } from '#/server/transactions'

export const Route = createFileRoute(
  '/_authed/transactions/adjustments/$adjustmentId',
)({
  loader: async ({ params }) => {
    const [accounts, adjustment] = await Promise.all([
      getFormAccounts(),
      getAdjustment({ data: { id: params.adjustmentId } }),
    ])
    const base =
      adjustment &&
      (await getAdjustmentBalance({
        data: {
          accountId: adjustment.accountId,
          on: adjustment.occurredOn,
          adjustmentId: adjustment.id,
        },
      }))
    return { accounts, adjustment, base }
  },
  staticData: { sheet: true },
  component: EditAdjustment,
})

/** The stored gap opens as the real balance it made, against the balance without it. */
function EditAdjustment() {
  const { t } = useTranslation()
  const locale = useLocale()
  const { accounts, adjustment, base } = Route.useLoaderData()
  const account = accounts.find((a) => a.id === adjustment?.accountId)
  if (!adjustment || !base || !account)
    return <Navigate to="/transactions" resetScroll={false} />

  return (
    <RouteSheet
      to="/transactions"
      title={t('transactions.adjustment.editTitle', {
        name: accountLabel(account),
      })}
      actions={
        <AdjustmentActions
          placement="sheet"
          summary={{
            id: adjustment.id,
            occurredOn: adjustment.occurredOn,
            amount: adjustment.amount,
            currency: account.currency,
            account,
          }}
        />
      }
    >
      <AdjustmentForm
        key={adjustment.id}
        id={adjustment.id}
        accounts={accounts}
        initial={{
          accountId: account.id,
          occurredOn: adjustment.occurredOn,
          realBalance: amountForInput(
            balanceWith(base, adjustment.amount),
            account.currency,
            locale,
          ),
          note: adjustment.note ?? '',
        }}
        savedText={t('transactions.adjustment.updated')}
      />
    </RouteSheet>
  )
}
