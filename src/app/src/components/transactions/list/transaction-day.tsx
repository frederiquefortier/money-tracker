import { memo } from 'react'
import { ListCard } from '#/components/lists/list-card'
import { MissingRate, Money } from '#/components/display/money'
import { TransactionRow } from '#/components/transactions/list/transaction-row'
import { formatDay } from '#/lib/shared/format'
import type {
  ListedCategory,
  TransactionDay,
} from '#/lib/transactions/transaction-list'
import { useLocale } from '#/hooks/app/use-locale'

/**
 * A day's header with its net, then its transactions in one card. Memoized: typing in
 * the search re-renders the list, and a day's object keeps its identity until it reloads.
 */
export const TransactionDayGroup = memo(function TransactionDayGroup({
  day,
  displayCurrency,
  filtered,
  feeCategory,
}: {
  day: TransactionDay
  displayCurrency: string
  filtered: boolean
  feeCategory: ListedCategory | null
}) {
  const locale = useLocale()
  return (
    // Days off screen skip style and layout: opening a sheet recomputed both for the
    // whole list, about 300 ms with 150 rows.
    <section className="flex flex-col gap-2 [contain-intrinsic-size:auto_320px] [content-visibility:auto]">
      <h2 className="flex items-center justify-between gap-3 px-1 font-mono text-sm font-bold tracking-wide text-muted-foreground uppercase">
        <span className="truncate">{formatDay(day.date, locale)}</span>
        {/* Incomes minus expenses: a minus when the day spent more, no other mark. */}
        {day.net === null ? (
          <MissingRate />
        ) : (
          <Money amount={day.net} currency={displayCurrency} />
        )}
      </h2>
      <ListCard>
        {day.rows.map((row) => (
          <TransactionRow
            key={row.id}
            row={row}
            displayCurrency={displayCurrency}
            filtered={filtered}
            feeCategory={feeCategory}
          />
        ))}
      </ListCard>
    </section>
  )
})
