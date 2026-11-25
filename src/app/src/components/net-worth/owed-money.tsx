import { Money } from '#/components/display/money'
import { absDecimal, compareDecimal } from '#/lib/shared/money'
import { cn } from '#/lib/utils'

/**
 * A debt as the amount owed: red when something is owed, plain at 0, and a card in
 * credit as "+50,00 $" in green, since that money is the user's.
 */
export function OwedMoney({
  owed,
  currency,
  converted,
  whole,
  className,
}: {
  /** Positive when owed, negative when in credit. */
  owed: string
  currency: string
  converted?: boolean
  whole?: boolean
  className?: string
}) {
  const sign = compareDecimal(owed, '0')
  return (
    <Money
      amount={absDecimal(owed)}
      currency={currency}
      converted={converted}
      whole={whole}
      signed={sign < 0}
      className={cn(
        className,
        sign > 0 && 'text-destructive',
        sign < 0 && 'text-income',
      )}
    />
  )
}
