import { useState } from 'react'
import { Link, createFileRoute, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { RouteSheet } from '#/components/sheet/route-sheet'
import { TransactionForm } from '#/components/transactions/form/transaction-form'
import { TransferForm } from '#/components/transactions/entry/transfer-form'
import { SheetBody } from '#/components/ui/sheet'
import { todayIso } from '#/lib/shared/format'
import { emptyDraft } from '#/lib/transactions/transaction-draft'
import { withFilters } from '#/lib/transactions/transaction-defaults'
import { idFilters } from '#/lib/transactions/transaction-filters'
import type { FilterValues } from '#/lib/transactions/transaction-filters'
import { emptyTransfer } from '#/lib/transfers/transfer-draft'
import type { TransferDraft } from '#/lib/transfers/transfer-draft'
import type {
  FormAccount,
  TransactionFormData,
} from '#/lib/transactions/transaction'
import { useTransactionFormData } from '#/hooks/app/use-page-data'
import { useStoredState } from '#/hooks/app/use-stored-state'
import { getTransferFeeCategory } from '#/server/transfers'
import type { TransactionDraft } from '#/lib/transactions/transaction-draft-types'
import { SHEET_PENDING } from '#/components/sheet/pending-sheet'

export const Route = createFileRoute('/_authed/transactions/_form/new')({
  loader: async () => {
    return { feeCategoryId: await getTransferFeeCategory() }
  },
  staticData: { sheet: true },
  ...SHEET_PENDING,
  component: NewTransaction,
})

const parseId = (v: unknown) => (typeof v === 'string' ? v : undefined)

/** What the sheet shows: the transaction form, or the transfer form after its tab. */
type Entry =
  | { form: 'transaction'; initial: TransactionDraft }
  | {
      form: 'transfer'
      initial: TransferDraft
    }

function NewTransaction() {
  const { t } = useTranslation()
  const { feeCategoryId } = Route.useLoaderData()
  const data = useTransactionFormData()
  // The account last used, remembered per browser.
  const [lastAccount, setLastAccount] = useStoredState(
    'transactions.account',
    '',
    parseId,
  )
  // The list's filters: one account, kind, category... ticked is the new one's default.
  const filters = useSearch({
    from: '/_authed/transactions',
    select: idFilters,
  })
  const choosable = data.accounts.filter((a) => !a.closedOn && !a.hiddenForNew)
  const account =
    (filters.accountIds.length === 1 &&
      choosable.find((a) => a.id === filters.accountIds[0])) ||
    choosable.find((a) => a.id === lastAccount) ||
    choosable.at(0)
  const transfer = filters.kinds.length === 1 && filters.kinds[0] === 'transfer'
  const [form, setForm] = useState<Entry['form']>(
    transfer ? 'transfer' : 'transaction',
  )

  return (
    <RouteSheet
      to="/transactions"
      title={t(
        form === 'transfer'
          ? 'transactions.transfer.newTitle'
          : 'transactions.newTitle',
      )}
    >
      {account ? (
        <NewEntry
          // The stored account arrives after mount; the form starts again with it.
          key={account.id}
          account={account}
          data={data}
          filters={filters}
          transfer={transfer}
          feeCategoryId={feeCategoryId}
          onSaved={setLastAccount}
          onForm={setForm}
        />
      ) : (
        <SheetBody className="flex flex-col gap-2">
          <p>{t('transactions.noAccount')}</p>
          <Link to="/net-worth/accounts" className="font-semibold text-primary">
            {t('nav.accounts')}
          </Link>
        </SheetBody>
      )}
    </RouteSheet>
  )
}

/**
 * The Transfert tab swaps the form, keeping the amount, account and date;
 * Dépense or Revenu on the transfer form swaps it back with the same three.
 */
function NewEntry({
  account,
  data,
  filters,
  transfer,
  feeCategoryId,
  onSaved,
  onForm,
}: {
  account: FormAccount
  data: TransactionFormData
  filters: FilterValues
  /** The list shows only transfers: the transfer form comes first. */
  transfer: boolean
  feeCategoryId: string | null
  onSaved: (accountId: string) => void
  /** For the sheet's title. */
  onForm: (form: Entry['form']) => void
}) {
  const { t } = useTranslation()
  const [entry, setEntry] = useState<Entry>(() => {
    const draft = emptyDraft(account, todayIso())
    return transfer
      ? { form: 'transfer', initial: emptyTransfer(draft) }
      : { form: 'transaction', initial: withFilters(draft, filters, data) }
  })
  // Each swap starts the other form afresh.
  const [swaps, setSwaps] = useState(0)
  function swap(next: Entry) {
    setEntry(next)
    setSwaps((n) => n + 1)
    onForm(next.form)
  }

  if (entry.form === 'transfer')
    return (
      <TransferForm
        key={swaps}
        initial={entry.initial}
        data={data}
        feeCategoryId={feeCategoryId}
        savedText={t('transactions.transfer.created')}
        onSaved={onSaved}
        onKind={(kind, draft) => {
          const from = data.accounts.find((a) => a.id === draft.fromId)
          swap({
            form: 'transaction',
            initial: {
              ...emptyDraft(from ?? account, draft.occurredOn),
              kind,
              amount: draft.amount,
            },
          })
        }}
      />
    )
  return (
    <TransactionForm
      key={swaps}
      initial={entry.initial}
      data={data}
      savedText={t('transactions.created')}
      onSaved={onSaved}
      onTransfer={(draft) =>
        swap({
          form: 'transfer',
          initial: emptyTransfer(draft),
        })
      }
    />
  )
}
