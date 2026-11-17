import { Link } from '@tanstack/react-router'
import { Icon } from '#/components/display/icon'
import type { IconName } from '#/components/display/icon'
import { IconBubble } from '#/components/display/icon-bubble'
import { MissingRate, Money } from '#/components/display/money'
import { cardSurface, focusRing, rowHover } from '#/components/styles'
import { cn } from '#/lib/utils'

/** The amount at the foot of a card: a missing rate is an error, never a partial sum. */
export function Total({
  total,
  currency,
  converted,
  className,
}: {
  total: string | null
  currency: string
  converted: boolean
  className: string
}) {
  if (total === null) return <MissingRate />
  return (
    <Money
      amount={total}
      currency={currency}
      converted={converted}
      className={className}
    />
  )
}

/** A subpage's card on the hub: its own total, one quiet line, the whole card a link. */
export function HubCard({
  to,
  icon,
  title,
  detail,
  total,
  currency,
  converted,
}: {
  to: '/net-worth/accounts' | '/net-worth/holdings'
  icon: IconName
  title: string
  detail: React.ReactNode
  /** Undefined draws no amount: nothing in the subpage yet. */
  total: string | null | undefined
  currency: string
  converted: boolean
}) {
  return (
    <Link
      to={to}
      className={cn(
        cardSurface,
        rowHover,
        'flex items-center gap-3 px-4 py-4',
        focusRing,
      )}
    >
      <IconBubble icon={icon} tone="primary" />
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{title}</span>
        <span className="block text-sm text-muted-foreground">{detail}</span>
      </span>
      {total !== undefined && (
        <Total
          total={total}
          currency={currency}
          converted={converted}
          className="font-bold"
        />
      )}
      <Icon name="chevron-right" className="text-muted-foreground" />
    </Link>
  )
}
