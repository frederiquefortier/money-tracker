import { CollapseToggle } from '#/components/lists/collapse-toggle'

/**
 * The header inside a group's card, as the accounts and holdings pages had it: the bold
 * name folds the rows, `after` sits beside the name (an institution's website), and the
 * total sits at the far right. `color` puts a dot before the name, for a group drawn in a
 * chart.
 */
export function DrawerHeader({
  name,
  color,
  collapsed,
  onToggle,
  after,
  total,
}: {
  name: string
  color?: string
  collapsed: boolean
  onToggle: () => void
  after?: React.ReactNode
  total: React.ReactNode
}) {
  return (
    <header className="flex min-h-12 items-center gap-2 py-1.5 pr-4 pl-3">
      <CollapseToggle
        expanded={!collapsed}
        onToggle={onToggle}
        className="font-bold"
      >
        <span className="flex min-w-0 items-center gap-2">
          {color && (
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: color }}
            />
          )}
          <span className="truncate">{name}</span>
        </span>
      </CollapseToggle>
      {after}
      <span className="ml-auto shrink-0">{total}</span>
    </header>
  )
}
