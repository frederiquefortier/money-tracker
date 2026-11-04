import { Icon } from '#/components/icon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { pickerOrder } from '#/lib/currencies'
import type { UserCurrency } from '#/lib/currencies'
import { cn, focusRing } from '#/lib/utils'

/** A currency code as a chip opening the user's currencies, favourites first (CUR-03). */
export function CurrencyChip({
  value,
  label,
  currencies,
  onChange,
}: {
  value: string
  /** The accessible name, with the current code. */
  label: string
  currencies: ReadonlyArray<UserCurrency>
  onChange: (code: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={label}
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 font-mono text-sm font-semibold text-secondary-foreground',
          focusRing,
        )}
      >
        {value}
        <Icon name="chevron-down" className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {pickerOrder(currencies).map((currency) => (
            <DropdownMenuRadioItem key={currency.code} value={currency.code}>
              <span className="font-mono font-semibold">{currency.code}</span>
              {currency.isFavourite && (
                <Icon name="star-fill" className="size-3.5 text-primary" />
              )}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
