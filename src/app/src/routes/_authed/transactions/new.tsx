import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { RouteSheet } from '#/components/route-sheet'
import { TransactionForm } from '#/components/transactions/transaction-form'
import { TransferForm } from '#/components/transactions/transfer-form'
import { SheetBody } from '#/components/ui/sheet'
import { todayIso } from '#/lib/format'
import { emptyDraft } from '#/lib/transaction-draft'
import type { Draft } from '#/lib/transaction-draft'
import { loadTransactionForm } from '#/lib/transaction-form-data'
import { emptyTransfer } from '#/lib/transfer-draft'
import type { TransferDraft } from '#/lib/transfer-draft'
import type { FormAccount, TransactionFormData } from '#/lib/transactions'
import { useStoredState } from '#/lib/use-stored-state'
import { getTransferFeeCategory } from '#/server/transfers'

export const Route = createFileRoute('/_authed/transactions/new')({
  loader: async () => {
    const [data, feeCategoryId] = await Promise.all([
      loadTransactionForm(),
      getTransferFeeCategory(),
    ])
    return { data, feeCategoryId }
  },
  staticData: { sheet: true },
  component: NewTransaction,
})

const parseId = (v: unknown) => (typeof v === 'string' ? v : undefined)

/** What the sheet shows: the transaction form, or the transfer form after its tab. */
type Entry =
  | { form: 'transaction'; initial: Draft }
  | {
      form: 'transfer'
      initial: TransferDraft
    }

function NewTransaction() {
  const { t } = useTranslation()
  const { data, feeCategoryId } = Route.useLoaderData()
  // The account last used, remembered per browser (spec 15).
  const [lastAccount, setLastAccount] = useStoredState(
    'transactions.account',
    '',
    parseId,
  )
  const choosable = data.accounts.filter((a) => !a.closedOn && !a.hiddenForNew)
  const account = choosable.find((a) => a.id === lastAccount) ?? choosable.at(0)
  const [form, setForm] = useState<Entry['form']>('transaction')

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
          feeCategoryId={feeCategoryId}
          onSaved={setLastAccount}
          onForm={setForm}
        />
      ) : (
        <SheetBody className="flex flex-col gap-2">
          <p>{t('transactions.noAccount')}</p>
          <Link to="/accounts" className="font-semibold text-primary">
            {t('nav.accounts')}
          </Link>
        </SheetBody>
      )}
    </RouteSheet>
  )
}

/**
 * The Transfert tab swaps the form, keeping the amount, account and date (spec 15);
 * Dépense or Revenu on the transfer form swaps it back with the same three.
 */
function NewEntry({
  account,
  data,
  feeCategoryId,
  onSaved,
  onForm,
}: {
  account: FormAccount
  data: TransactionFormData
  feeCategoryId: string | null
  onSaved: (accountId: string) => void
  /** For the sheet's title. */
  onForm: (form: Entry['form']) => void
}) {
  const { t } = useTranslation()
  const [entry, setEntry] = useState<Entry>(() => ({
    form: 'transaction',
    initial: emptyDraft(account, todayIso()),
  }))
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
