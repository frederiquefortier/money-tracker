import { Link } from '@tanstack/react-router'
import { IconActions } from '#/components/display/icon-button'
import { AdjustmentActions } from '#/components/transactions/entry/adjustment-actions'
import { TransactionActions } from '#/components/transactions/list/transaction-actions'
import { TransferActions } from '#/components/transactions/entry/transfer-actions'
import type { ListedTransaction } from '#/lib/transactions/transaction-list'

// What a list row opens and deletes, by kind.

/**
 * Where a tap goes: the transaction's form, the transfer's for a leg or its fee, or the
 * adjustment's. Not preloaded on hover: each sheet loads the data of every picker, and
 * sweeping the mouse down a list started one such load per row.
 */
export function RowLink({
  row,
  className,
  children,
}: {
  row: ListedTransaction
  className: string
  children: React.ReactNode
}) {
  if (row.transferId)
    return (
      <Link
        preload={false}
        to="/transactions/transfers/$transferId"
        params={{ transferId: row.transferId }}
        className={className}
      >
        {children}
      </Link>
    )
  if (row.kind === 'adjustment')
    return (
      <Link
        preload={false}
        to="/transactions/adjustments/$adjustmentId"
        params={{ adjustmentId: row.id }}
        className={className}
      >
        {children}
      </Link>
    )
  return (
    <Link
      preload={false}
      to="/transactions/$transactionId"
      params={{ transactionId: row.id }}
      className={className}
    >
      {children}
    </Link>
  )
}

/** Delete on the row: an expense, income or adjustment, or a transfer from its leg (not its fee). */
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
  if (row.kind === 'adjustment')
    return (
      <AdjustmentActions
        summary={{
          id: row.id,
          occurredOn: row.occurredOn,
          amount: row.amount,
          currency: row.currency,
          account: row.account,
        }}
      />
    )
  if (row.transferId) return <IconActions slots={1} />
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
