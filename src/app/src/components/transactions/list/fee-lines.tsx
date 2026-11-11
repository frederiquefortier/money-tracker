import { useTranslation } from 'react-i18next'
import { CategoryBadge } from '#/components/categories/category-badge'
import { Money } from '#/components/display/money'
import { compareDecimal } from '#/lib/shared/money'
import type {
  ListedCategory,
  ListedTransaction,
} from '#/lib/transactions/transaction-list'
import { cn } from '#/lib/utils'

export const feeLine = 'pointer-events-none absolute border-primary/30'

/** Whether the row has fee lines under it. */
export function hasFees(row: ListedTransaction): boolean {
  const cost = row.conversionCost
  return row.fee !== null || (cost !== null && compareDecimal(cost, '0') !== 0)
}

/** The conversion fee (CUR-08, TRX-11), then a transfer's transaction fee (TRX-04). */
function useFees(row: ListedTransaction) {
  const { t } = useTranslation()
  const fees: Array<{ label: string; amount: string }> = []
  const cost = row.conversionCost
  // Both are costs, so both read unsigned; a gain on the exchange, rare, as negative.
  if (cost !== null && compareDecimal(cost, '0') !== 0)
    fees.push({ label: t('transactions.conversionFee'), amount: cost })
  if (row.fee)
    fees.push({
      label: t('transactions.transactionFee'),
      amount: row.fee.amount,
    })
  return fees
}

/**
 * each fee as a tight line inside its row, joined to the row's icon by the
 * tree's elbow line, with the fee category's icon at a smaller size and the amount
 * under the row's own.
 */
export function FeeLines({
  row,
  feeCategory,
}: {
  row: ListedTransaction
  feeCategory: ListedCategory | null
}) {
  const fees = useFees(row)
  if (fees.length === 0) return null
  return (
    <ul className="flex flex-col">
      {fees.map((fee, i) => {
        const last = i === fees.length - 1
        return (
          <li
            key={fee.label}
            className="relative flex items-center gap-2 py-0.5 pl-9 text-sm"
          >
            {/* From the row icon's line (its centre at 21px) to the next fee. */}
            <span
              aria-hidden="true"
              className={cn(
                feeLine,
                'top-0 left-[21px] border-l-2',
                last ? 'h-1/2' : 'bottom-0',
              )}
            />
            <span
              aria-hidden="true"
              className={cn(
                feeLine,
                'top-1/2 left-[21px] -mt-px w-3 border-t-2',
              )}
            />
            {feeCategory ? (
              <CategoryBadge
                icon={feeCategory.icon}
                color={feeCategory.color}
                size="sm"
                className="size-6 [&_svg]:size-3.5"
              />
            ) : (
              <span className="size-6 shrink-0 rounded-full bg-secondary" />
            )}
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {fee.label}
            </span>
            <Money
              amount={fee.amount}
              currency={row.currency}
              className="shrink-0 font-mono md:pr-4"
            />
          </li>
        )
      })}
    </ul>
  )
}
