import { Icon } from '#/components/display/icon'
import type { IconName } from '#/components/display/icon'
import { chipSurface } from '#/components/styles'
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
  renderOption,
  onChange,
}: {
  icon: IconName
  label: string
  value: TValue
  options: ReadonlyArray<TValue>
  labelOf: (value: TValue) => string
  /** What a choice shows in the menu, when more than its label. */
  renderOption?: (value: TValue, index: number) => React.ReactNode
  onChange: (value: TValue) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={chipSurface}
          aria-label={label}
          title={label}
        >
          <Icon name={icon} className="size-4" />
          {labelOf(value)}
          <Icon name="chevron-down" className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => {
            const option = options.find((o) => o === next)
            if (option) onChange(option)
          }}
        >
          {options.map((option, i) => (
            <DropdownMenuRadioItem key={option} value={option}>
              {renderOption ? renderOption(option, i) : labelOf(option)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
