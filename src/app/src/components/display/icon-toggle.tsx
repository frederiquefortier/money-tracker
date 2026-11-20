import { Icon } from '#/components/display/icon'
import type { IconName } from '#/components/display/icon'
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group'

/**
 * A short choice drawn as icons, like a list or grid view switch (author, 2026-11-20).
 * Each icon carries its name as its label and title.
 */
export function IconToggle<TValue extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: TValue
  options: ReadonlyArray<{ value: TValue; icon: IconName; label: string }>
  onChange: (value: TValue) => void
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        const option = options.find((o) => o.value === next)
        if (option) onChange(option.value)
      }}
      aria-label={label}
      className="gap-0.5"
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          aria-label={option.label}
          title={option.label}
          className="px-2"
        >
          <Icon name={option.icon} className="size-4" />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
