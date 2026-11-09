import { Icon } from '#/components/display/icon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import type { Currency } from '#/lib/currencies/currency'
import { cn } from '#/lib/utils'
import { focusRing } from '#/components/styles'

const chip =
  'inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 font-mono text-sm font-semibold text-secondary-foreground'

/** A currency the field cannot change, drawn like the chip (a transfer's, spec 16). */
export function FixedCurrency({ value }: { value: string }) {
  return <span className={chip}>{value}</span>
}

/** A currency code as a chip opening the user's currencies, by code (CUR-03). */
export function CurrencyChip({
  value,
  label,
  currencies,
  onChange,
}: {
  value: string
  /** The accessible name, with the current code. */
  label: string
  currencies: ReadonlyArray<Currency>
  onChange: (code: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={label} className={cn(chip, focusRing)}>
        {value}
        <Icon name="chevron-down" className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {currencies.map((currency) => (
            <DropdownMenuRadioItem
              key={currency.code}
              value={currency.code}
              className="font-mono font-semibold"
            >
              {currency.code}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
