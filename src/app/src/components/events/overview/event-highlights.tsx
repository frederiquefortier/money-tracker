import { useTranslation } from 'react-i18next'
import { Figure } from '#/components/dashboard/dashboard-card'
import {
  HighlightRows,
  HighlightSlip,
  SlipRow,
} from '#/components/events/overview/highlight-rows'
import { TopDaysCard } from '#/components/events/overview/top-days-card'
import { useLocale } from '#/hooks/app/use-locale'
import type { DaySpent } from '#/lib/dashboard/daily-spending'
import type { DashboardPeriod } from '#/lib/dashboard/dashboard-period'
import { periodSearch } from '#/lib/dashboard/drill-down'
import type { TransactionsSearch } from '#/lib/dashboard/drill-down'
import { eventsWith, spentWith } from '#/lib/dashboard/year-activity'
import type { DayTransaction } from '#/lib/dashboard/year-activity'
import type { ActivityNames } from '#/lib/dashboard/calendar-days'
import type { EventSummary } from '#/lib/events/event-calendar'
import type { Balance } from '#/lib/people/owed'
import { formatMoney } from '#/lib/shared/format'

/** Rows whose person has a name, with it; a deleted person drops out. */
function named<T extends { personId: string }>(
  rows: ReadonlyArray<T>,
  names: ActivityNames,
): Array<T & { name: string }> {
  return rows.flatMap((row) => {
    const name = names.person(row.personId)
    return name ? [{ ...row, name }] : []
  })
}

/**
 * YR-04: the person I spent the most with and the one I spent the least with, counting
 * everyone on an expense whatever their role (author, 2026-11-23).
 */
function SpentWithCard({
  transactions,
  complete,
  names,
  search,
  currency,
}: {
  transactions: ReadonlyArray<DayTransaction>
  complete: boolean
  names: ActivityNames
  search: TransactionsSearch
  currency: string
}) {
  const { t } = useTranslation()
  const spent = named(spentWith(transactions), names)
  const most = spent.at(0)
  const least = spent.length > 1 ? spent.at(-1) : undefined
  const ends = [
    most && { ...most, note: t('dashboard.events.highlights.most') },
    least && { ...least, note: t('dashboard.events.highlights.least') },
  ].filter((row) => row !== undefined)
  return (
    <HighlightSlip title={t('dashboard.events.highlights.spentWith')}>
      <HighlightRows
        complete={complete}
        empty={ends.length ? null : t('dashboard.events.highlights.noPeople')}
      >
        {ends.map((row) => (
          <SlipRow
            key={row.note}
            search={{ ...search, person: [row.personId] }}
            label={`${row.note} · ${row.name}`}
            figure={<Figure amount={row.spent} currency={currency} />}
            detail={t('dashboard.events.highlights.shared', {
              count: row.count,
            })}
          />
        ))}
      </HighlightRows>
    </HighlightSlip>
  )
}

/** YR-04: the three people on the most events of the period. */
function EventsWithCard({
  summaries,
  names,
  search,
}: {
  summaries: ReadonlyArray<EventSummary>
  names: ActivityNames
  search: TransactionsSearch
}) {
  const { t } = useTranslation()
  const rows = named(eventsWith(summaries), names).slice(0, 3)
  return (
    <HighlightSlip title={t('dashboard.events.highlights.mostEvents')}>
      <HighlightRows
        complete
        empty={
          rows.length ? null : t('dashboard.events.highlights.noEventPeople')
        }
      >
        {rows.map((row, i) => (
          <SlipRow
            key={row.personId}
            search={{ ...search, person: [row.personId] }}
            label={`${i + 1}. ${row.name}`}
            figure={row.count}
          />
        ))}
      </HighlightRows>
    </HighlightSlip>
  )
}

/** YR-05, PPL-05: who owes me today, whatever the period; a line opens what they owe. */
function OwedCard({
  balances,
  names,
}: {
  balances: Record<string, Balance>
  names: ActivityNames
}) {
  const { t } = useTranslation()
  const locale = useLocale()
  const rows = named(
    Object.entries(balances)
      .filter(([, b]) => b.amounts.length > 0 || b.unknown > 0)
      .map(([personId, balance]) => ({ personId, balance })),
    names,
  ).sort((a, b) => a.name.localeCompare(b.name))
  const owed = ({ amounts, unknown }: Balance) => {
    const known = amounts
      .map((a) => formatMoney(a.amount, a.currency, locale))
      .join(' · ')
    if (!known) return t('transactions.people.unknownShort')
    return unknown ? `${known} ${t('people.plusUnknown')}` : known
  }
  return (
    <HighlightSlip title={t('dashboard.events.highlights.owed')}>
      <HighlightRows
        complete
        empty={rows.length ? null : t('dashboard.events.highlights.noneOwed')}
      >
        {rows.map((row) => (
          <SlipRow
            key={row.personId}
            search={{ period: 'all', owed: true, person: [row.personId] }}
            label={row.name}
            figure={owed(row.balance)}
          />
        ))}
      </HighlightRows>
    </HighlightSlip>
  )
}

/**
 * The year in review's highlights (YR-03, YR-04, YR-05) as receipt slips, over the period:
 * the costliest days, who I spent the most and the least with, who was on the most
 * events, and who owes me today.
 */
export function EventHighlights({
  period,
  days,
  transactions,
  summaries,
  shownSummaries,
  complete,
  balances,
  names,
  currency,
}: {
  period: DashboardPeriod
  days: ReadonlyArray<DaySpent>
  transactions: ReadonlyArray<DayTransaction>
  /** Every event of the period, for who shared the most. */
  summaries: ReadonlyArray<EventSummary>
  /** Those of the types shown, for what drove a day. */
  shownSummaries: ReadonlyArray<EventSummary>
  /** False while a year of the period is loading or failed: no ranking on part of it. */
  complete: boolean
  balances: Record<string, Balance>
  names: ActivityNames
  currency: string
}) {
  const search = periodSearch(period)
  return (
    <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <TopDaysCard
        period={period}
        days={days}
        transactions={transactions}
        summaries={shownSummaries}
        complete={complete}
        names={names}
        currency={currency}
      />
      <SpentWithCard
        transactions={transactions}
        complete={complete}
        names={names}
        search={search}
        currency={currency}
      />
      <EventsWithCard summaries={summaries} names={names} search={search} />
      <OwedCard balances={balances} names={names} />
    </div>
  )
}
