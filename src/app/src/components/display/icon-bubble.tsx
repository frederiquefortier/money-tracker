import { Icon } from '#/components/display/icon'
import type { IconName } from '#/components/display/icon'
import { cn } from '#/lib/utils'

/**
 * A neutral icon in a round tinted badge: a transfer or adjustment in the list, the kind of
 * file in the import. `className` sets the size.
 */
export function IconBubble({
  icon,
  className,
}: {
  icon: IconName
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground [&_svg]:size-6',
        className,
      )}
    >
      <Icon name={icon} />
    </span>
  )
}
