import { Icon } from '#/components/icon'
import { iconHover } from '#/components/icon-button'
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
        'group flex min-w-0 items-center gap-1.5 rounded-lg',
        focusRing,
        className,
      )}
    >
      <span className={cn('shrink-0', iconHover.group)}>
        <Icon
          name="chevron-down"
          className={cn(
            'block size-5 transition-transform',
            !expanded && '-rotate-90',
          )}
        />
      </span>
      <span className="truncate">{children}</span>
    </button>
  )
}
