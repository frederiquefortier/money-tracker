import { Link } from '@tanstack/react-router'
import {
  focusRing,
  receiptSlip,
  rowHover,
  slipLabel,
  slipLine,
  slipRuleLine,
} from '#/components/styles'
import type { TransactionsSearch } from '#/lib/dashboard/drill-down'
import { cn } from '#/lib/utils'

// The year in review's highlights as the transaction form's receipt slip (author,
// 2026-11-23): a title in capitals, a dashed rule, then one line per row.

const lineLink = cn(
  '-mx-2 flex flex-col rounded-md px-2 py-1.5',
  rowHover,
  focusRing,
)

/** A highlight as a slip in the cards' colour, torn along the bottom. */
export function HighlightSlip({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className={cn(receiptSlip, 'gap-2 bg-card')}>
      <h2 className="text-sm font-semibold tracking-wide uppercase">{title}</h2>
      <hr className={slipRuleLine} />
      {children}
    </section>
  )
}

/** A slip's lines, a pulse while the period's transactions load, or why there are none. */
export function HighlightRows({
  complete,
  empty,
  children,
}: {
  complete: boolean
  /** The note in place of the lines, or null when there are some. */
  empty: string | null
  children: React.ReactNode
}) {
  if (!complete)
    return (
      <div className="flex flex-col gap-2" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-6 animate-pulse rounded bg-muted" />
        ))}
      </div>
    )
  if (empty !== null)
    return <p className="text-sm text-muted-foreground">{empty}</p>
  return <ul className="flex flex-col text-sm">{children}</ul>
}

/**
 * One line of a slip opening the transactions behind it: the label in capitals and the
 * figure, then a muted detail under them.
 */
export function SlipRow({
  search,
  label,
  figure,
  detail,
}: {
  search: TransactionsSearch
  label: React.ReactNode
  figure: React.ReactNode
  detail?: React.ReactNode
}) {
  return (
    <li>
      <Link to="/transactions" search={search} className={lineLink}>
        <span className={slipLine}>
          <span className={slipLabel}>{label}</span>
          <span className="whitespace-nowrap tabular-nums">{figure}</span>
        </span>
        {detail && (
          <span className="truncate text-xs text-muted-foreground">
            {detail}
          </span>
        )}
      </Link>
    </li>
  )
}
