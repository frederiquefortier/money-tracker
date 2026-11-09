import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { Icon } from '#/components/display/icon'
import type { IconName } from '#/components/display/icon'
import { cn } from '#/lib/utils'
import { iconAction } from '#/components/styles'

/**
 * `muted` looks disabled but still answers a tap, so the reason can be shown;
 * `disabled` is for a moment only, as while the next month loads.
 */
export function IconButton({
  icon,
  label,
  pressed,
  muted = false,
  disabled = false,
  onClick,
}: {
  icon: IconName
  label: string
  pressed?: boolean
  muted?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      aria-disabled={muted || undefined}
      disabled={disabled}
      onClick={onClick}
      className={iconAction(muted || disabled)}
    >
      <Icon name={icon} />
    </button>
  )
}

/** An icon action that goes to another screen. */
export function IconLink({
  icon,
  label,
  ...link
}: { icon: IconName; label: string; onClick?: () => void } & Pick<
  LinkProps,
  'to' | 'params' | 'search'
>) {
  return (
    <Link {...link} title={label} className={iconAction()}>
      <Icon name={icon} label={label} />
    </Link>
  )
}

/** An icon action that opens an outside site in a new tab. */
export function IconAnchor({
  icon,
  label,
  href,
}: {
  icon: IconName
  label: string
  href: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className={iconAction()}
    >
      <Icon name={icon} label={label} />
    </a>
  )
}

// Width of 1 to 4 icon actions plus the 12px gap before them, so the amounts in one
// list line up whatever actions each row has.
const SLOT_WIDTH = { 1: 'w-11', 2: 'w-19', 3: 'w-27', 4: 'w-35' } as const

export type ActionPlacement = 'row' | 'sheet' | 'always'

/**
 * An item's icon actions. On a `row` they sit right-aligned in a slot of fixed width from
 * `md` up; on phones they are in the item's sheet header instead (`sheet`). A row whose
 * item has no sheet keeps them at every width (`always`).
 */
export function IconActions({
  slots,
  placement = 'row',
  className,
  children,
}: {
  slots: keyof typeof SLOT_WIDTH
  placement?: ActionPlacement
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'items-center',
        placement === 'sheet'
          ? 'flex'
          : ['shrink-0 justify-end pl-3', SLOT_WIDTH[slots]],
        placement === 'row' && 'hidden md:flex',
        placement === 'always' && 'flex',
        className,
      )}
    >
      {children}
    </div>
  )
}
