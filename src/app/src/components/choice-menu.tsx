import { Icon } from '#/components/icon'
import type { IconName } from '#/components/icon'
import { Button } from '#/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'

/**
 * An outline button with a chevron, like a select: the icon and the current choice, with
 * `label` ("Trier: Nom") as its accessible name.
 */
export function ChoiceMenu<TValue extends string>({
  icon,
  label,
  value,
  options,
  labelOf,
  onChange,
}: {
  icon: IconName
  label: string
  value: TValue
  options: ReadonlyArray<TValue>
  labelOf: (value: TValue) => string
  onChange: (value: TValue) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" aria-label={label} title={label}>
          <Icon name={icon} className="size-4" />
          {labelOf(value)}
          <Icon name="chevron-down" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => {
            const option = options.find((o) => o === next)
            if (option) onChange(option)
          }}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {labelOf(option)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
