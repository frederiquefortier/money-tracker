import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { RouteSheet } from '#/components/sheet/route-sheet'
import { AdjustmentForm } from '#/components/transactions/entry/adjustment-form'
import { todayIso } from '#/lib/shared/format'
import type { FormAccount } from '#/lib/transactions/transaction'
import { useAccountsPage } from '#/hooks/app/use-page-data'

export const Route = createFileRoute('/_authed/accounts/adjust')({
  staticData: { sheet: true },
  component: AdjustBalance,
})

/** TRX-03, from the + of Comptes; the account is chosen in the sheet (spec 16). */
function AdjustBalance() {
  const { t } = useTranslation()
  const { accounts, institutions } = useAccountsPage()
  const names = new Map(institutions.map((i) => [i.id, i.name]))
  const choosable: Array<FormAccount> = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    currency: a.currency,
    institution: (a.institutionId && names.get(a.institutionId)) ?? null,
    closedOn: a.closedOn,
    hiddenForNew: a.hiddenForNew,
  }))
  const open = choosable.filter((a) => !a.closedOn && !a.hiddenForNew)

  return (
    <RouteSheet to="/accounts" title={t('transactions.adjustment.newTitle')}>
      <AdjustmentForm
        accounts={choosable}
        initial={{
          accountId: open.length === 1 ? (open[0]?.id ?? '') : '',
          occurredOn: todayIso(),
          realBalance: '',
          note: '',
        }}
        savedText={t('transactions.adjustment.created')}
      />
    </RouteSheet>
  )
}
