import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { IconActions } from '#/components/icon-button'
import { useToast } from '#/components/toaster'
import { TransactionActions } from '#/components/transactions/transaction-actions'
import { TransferActions } from '#/components/transactions/transfer-actions'
import type { ListedTransaction } from '#/lib/transaction-list'

// What a list row (spec 14) opens and deletes, by kind.

/** Where a tap goes: the transaction's form, or the transfer's for a leg or its fee. */
export function RowLink({
  row,
  className,
  children,
}: {
  row: ListedTransaction
  className: string
  children: React.ReactNode
}) {
  const { t } = useTranslation()
  const toast = useToast()
  if (row.transferId)
    return (
      <Link
        to="/transactions/transfers/$transferId"
        params={{ transferId: row.transferId }}
        className={className}
      >
        {children}
      </Link>
    )
  if (row.kind === 'adjustment')
    return (
      <button
        type="button"
        onClick={() => toast({ text: t('transactions.list.adjustSoon') })}
        className={className}
      >
        {children}
      </button>
    )
  return (
    <Link
      to="/transactions/$transactionId"
      params={{ transactionId: row.id }}
      className={className}
    >
      {children}
    </Link>
  )
}

/** Delete on the row: an expense or income, or a transfer from its leg (not its fee). */
export function RowActions({ row }: { row: ListedTransaction }) {
  if (row.transfer && row.transferId)
    return (
      <TransferActions
        summary={{
          transferId: row.transferId,
          occurredOn: row.occurredOn,
          amount: row.amount,
          currency: row.currency,
          from: row.transfer.from,
          to: row.transfer.to,
          hasFee: null,
        }}
      />
    )
  if (row.transferId || row.kind === 'adjustment')
    return <IconActions slots={1} />
  return (
    <TransactionActions
      summary={{
        id: row.id,
        occurredOn: row.occurredOn,
        amount: row.amount,
        currency: row.currency,
        merchant: row.merchant,
        categories: row.categories.map((c) => c.name),
        account: row.account,
      }}
    />
  )
}
