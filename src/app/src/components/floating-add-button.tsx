import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { Icon } from '#/components/icon'
import { cn, focusRing } from '#/lib/utils'

/** The round add button, bottom right, above the tab bar on phones (spec 15). */
export function FloatingAddButton({
  label,
  ...link
}: { label: string } & Pick<LinkProps, 'to' | 'search'>) {
  return (
    <Link
      {...link}
      aria-label={label}
      title={label}
      className={cn(
        'fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-10 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 md:right-6 md:bottom-6',
        focusRing,
      )}
    >
      <Icon name="plus" className="size-6" />
    </Link>
  )
}
