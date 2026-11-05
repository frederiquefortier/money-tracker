import { TreeGuides } from '#/components/tree-guides'
import type { ComboboxOption } from '#/components/use-combobox'
import type { TreeGuide } from '#/lib/tree'

export function OptionContent({
  option,
  guide,
}: {
  option: ComboboxOption
  guide: TreeGuide | undefined
}) {
  return (
    <>
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
