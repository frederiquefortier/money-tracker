import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { Icon } from '#/components/icon'
import { cn, focusRing } from '#/lib/utils'

/** Top left of the page, outside the centred column. */
export function BackLink({
  label,
  ...link
}: { label: string } & Pick<LinkProps, 'to' | 'params' | 'search'>) {
  return (
    <Link
      {...link}
      className={cn(
        'flex items-center gap-1 self-start rounded-lg text-sm font-semibold text-primary',
        focusRing,
      )}
    >
      <Icon name="arrow-left" className="size-5 [&_path]:stroke-[2.5]" />
      {label}
    </Link>
  )
}
