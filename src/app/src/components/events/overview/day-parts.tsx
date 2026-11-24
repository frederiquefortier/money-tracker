import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Figure } from '#/components/dashboard/dashboard-card'
import { AvatarStack } from '#/components/people/avatars'
import { focusRing } from '#/components/styles'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { daySearch } from '#/lib/dashboard/drill-down'
import type { DayTransaction } from '#/lib/dashboard/year-activity'
import type { ActivityNames } from '#/lib/dashboard/calendar-days'
import { absDecimal } from '#/lib/shared/money'
import { cn } from '#/lib/utils'

// What a day shows in the calendar's box and in the phone's list alike.

/** A transaction as its merchant (or category) and its amount; an income in green with +. */
export function TransactionLine({
  transaction,
  names,
  currency,
}: {
  transaction: DayTransaction
  names: ActivityNames
  currency: string
}) {
  const income = transaction.kind === 'income'
  const amount =
    transaction.amount === null ? null : absDecimal(transaction.amount)
  return (
    <span className="flex items-baseline justify-between gap-2">
      <span className="min-w-0 truncate">{names.label(transaction)}</span>
      <span
        className={cn(
          'shrink-0 tabular-nums',
          income ? 'text-income' : 'text-muted-foreground',
        )}
      >
        {income && '+'}
        <Figure amount={amount} currency={currency} />
      </span>
    </span>
  )
}

/** The first `shown` transactions, then "+N autres" opening the day in the list. */
export function DayTransactions({
  day,
  period,
  transactions,
  shown,
  names,
  currency,
}: {
  day: string
  period: DashboardPeriod
  transactions: ReadonlyArray<DayTransaction>
  shown: number
  names: ActivityNames
  currency: string
}) {
  const { t } = useTranslation()
  const more = transactions.length - shown
  return (
    <>
      {transactions.slice(0, shown).map((transaction) => (
        <TransactionLine
          key={transaction.id}
          transaction={transaction}
          names={names}
          currency={currency}
        />
      ))}
      {more > 0 && (
        <Link
          to="/transactions"
          search={daySearch(period, day)}
          className={cn(
            'self-start rounded text-muted-foreground hover:text-primary',
            focusRing,
          )}
        >
          {t('dashboard.events.more', { count: more })}
        </Link>
      )}
    </>
  )
}

/** The people on the day's expenses and incomes, once each. */
export function DayPeople({
  transactions,
  names,
}: {
  transactions: ReadonlyArray<DayTransaction>
  names: ActivityNames
}) {
  const people = [
    ...new Set(transactions.flatMap((transaction) => transaction.personIds)),
  ].flatMap((id) => {
    const name = names.person(id)
    return name ? [{ name, count: 1 }] : []
  })
  if (people.length === 0) return null
  return (
    <span title={people.map((p) => p.name).join(', ')}>
      <AvatarStack items={people} size="md" />
    </span>
  )
}
