import { ListCard } from '#/components/list-card'
import { MissingRate, Money } from '#/components/money'
import { TransactionRow } from '#/components/transactions/transaction-row'
import { formatDay } from '#/lib/format'
import type { ListedCategory, TransactionDay } from '#/lib/transaction-list'
import { useLocale } from '#/lib/use-locale'

/** A day's header with its net, then its transactions in one card (spec 14). */
export function TransactionDayGroup({
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
    <section className="flex flex-col gap-2">
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
}
