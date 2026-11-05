import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { Icon } from '#/components/icon'
import type { IconName } from '#/components/icon'
import { cn, focusRing } from '#/lib/utils'

// Every icon action in the app: one 32px target, one 20px icon, one hover.
export function iconAction(muted = false) {
  return cn(
    'inline-grid size-8 shrink-0 place-items-center rounded-lg',
    muted
      ? 'cursor-default text-muted-foreground/50'
      : 'text-primary hover:bg-secondary',
    focusRing,
  )
}

/**
 * The icon actions' 32px hover behind a smaller icon whose box must not grow (a tree's
 * chevron sets where its connectors meet). `group` variants light it from a wider
 * button, as a section header whose name toggles too.
 */
export const iconHover = {
  self: 'relative isolate before:absolute before:-inset-1.5 before:-z-10 before:rounded-lg hover:before:bg-secondary',
  group:
    'relative isolate before:absolute before:-inset-1.5 before:-z-10 before:rounded-lg group-hover:before:bg-secondary',
}

/** `muted` looks disabled but still answers a tap, so the reason can be shown. */
export function IconButton({
  icon,
  label,
  pressed,
  muted = false,
  onClick,
}: {
  icon: IconName
  label: string
  pressed?: boolean
  muted?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      aria-disabled={muted || undefined}
      onClick={onClick}
      className={iconAction(muted)}
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
