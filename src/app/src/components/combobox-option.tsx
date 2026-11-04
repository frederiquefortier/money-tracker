import { Icon } from '#/components/icon'
import { TreeGuides } from '#/components/tree-guides'
import type { ComboboxOption } from '#/components/use-combobox'
import type { TreeGuide } from '#/lib/tree'

export function OptionContent({
  option,
  selected,
  guide,
}: {
  option: ComboboxOption
  selected: boolean
  guide: TreeGuide | undefined
}) {
  // The check sits first, in a slot every option keeps, as in the dropdown menus.
  return (
    <>
      <span className="flex size-4 shrink-0 items-center justify-center">
        {selected && <Icon name="check" className="size-4" />}
      </span>
      {guide && <TreeGuides guide={guide} className="-my-2" />}
      {option.icon}
      <span className="flex-1 truncate">{option.short ?? option.label}</span>
    </>
  )
}

export function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <li
      role="presentation"
      className="px-2 pt-3 pb-1 font-mono text-xs font-bold tracking-wide text-muted-foreground uppercase first:pt-1"
    >
      {children}
    </li>
  )
}
