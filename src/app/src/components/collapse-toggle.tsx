import { Icon } from '#/components/icon'
import { cn, focusRing } from '#/lib/utils'

/** Shows or hides the section below; the visible text names it, aria-expanded says which. */
export function CollapseToggle({
  expanded,
  onToggle,
  className,
  children,
}: {
  expanded: boolean
  onToggle: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className={cn(
        'flex min-w-0 items-center gap-1.5 rounded-lg',
        focusRing,
        className,
      )}
    >
      <Icon
        name="chevron-down"
        className={cn('size-5 transition-transform', !expanded && '-rotate-90')}
      />
      <span className="truncate">{children}</span>
    </button>
  )
}
