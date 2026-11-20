import { MissingRate, Money } from '#/components/display/money'
import { cardSurface } from '#/components/styles'
import { cn } from '#/lib/utils'

/** A dashboard section: its title, the controls that act on it, then its body. */
export function DashboardCard({
  title,
  actions,
  className,
  children,
}: {
  title: string
  actions?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      className={cn(
        cardSurface,
        'flex min-w-0 flex-col gap-4 px-4 py-4',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">{title}</h2>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
      {children}
    </section>
  )
}

/** A figure without its cents, or the missing-rate mark in its place. */
export function Figure({
  amount,
  currency,
  className,
}: {
  amount: string | null
  currency: string
  className?: string
}) {
  return amount === null ? (
    <MissingRate />
  ) : (
    <Money amount={amount} currency={currency} whole className={className} />
  )
}
