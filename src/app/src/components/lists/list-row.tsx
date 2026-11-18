import { Link } from '@tanstack/react-router'
import type { LinkOptions } from '@tanstack/react-router'
import { focusRing, rowHover } from '#/components/styles'
import { cn } from '#/lib/utils'

/**
 * A list row: the whole row opens `link` (the entity's sheet), and `actions` stays
 * outside the link, on the right. `trailing` is a control of its own between the two (a
 * button cannot sit inside the link). With `stretched`, the link's area covers the whole
 * row, so `trailing` can hold read-only content around its control and still open it.
 */
export function ListRow({
  link,
  actions,
  trailing,
  stretched = false,
  alignTop = false,
  children,
}: {
  link: LinkOptions
  actions: React.ReactNode
  trailing?: React.ReactNode
  stretched?: boolean
  /** Sets the content and the actions level with the first line. */
  alignTop?: boolean
  children: React.ReactNode
}) {
  const align = alignTop ? 'items-start' : 'items-center'
  return (
    <li className={cn('flex pr-2', align, rowHover, stretched && 'relative')}>
      <Link
        {...link}
        className={cn(
          'flex min-w-0 flex-1 gap-3 py-3 pl-4',
          align,
          focusRing,
          stretched && 'after:absolute after:inset-0',
        )}
      >
        {children}
      </Link>
      {trailing}
      {stretched ? <div className="relative">{actions}</div> : actions}
    </li>
  )
}
