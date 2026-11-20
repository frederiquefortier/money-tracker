import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { Icon } from '#/components/display/icon'
import { focusRing } from '#/components/styles'
import { cn } from '#/lib/utils'

/** Above a page's title, when it was opened from another page: back to that page. */
export function BackLink({
  label,
  ...link
}: { label: string } & Pick<LinkProps, 'to' | 'search'>) {
  return (
    <Link
      {...link}
      className={cn(
        'inline-flex w-fit items-center gap-1 rounded-lg text-sm font-semibold text-muted-foreground hover:text-primary',
        focusRing,
      )}
    >
      <Icon name="arrow-left" className="size-4" />
      {label}
    </Link>
  )
}
