import { createContext, useContext } from 'react'
import { Link } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import { Icon } from '#/components/display/icon'
import type { IconName } from '#/components/display/icon'
import { cn } from '#/lib/utils'
import { iconAction } from '#/components/styles'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'

/** Inside a `menu` placement, the actions draw as menu items with their icon and text. */
const InMenu = createContext(false)

/**
 * `muted` looks disabled but still answers a tap, so the reason can be shown;
 * `disabled` is for a moment only, as while the next month loads.
 */
export function IconButton({
  icon,
  label,
  text,
  pressed,
  muted = false,
  disabled = false,
  onClick,
}: {
  icon: IconName
  label: string
  /** The words in a menu ("Archiver"), when shorter than `label`. */
  text?: string
  pressed?: boolean
  muted?: boolean
  disabled?: boolean
  onClick?: () => void
}) {
  if (useContext(InMenu))
    return (
      <DropdownMenuItem
        aria-disabled={muted || undefined}
        disabled={disabled}
        onSelect={onClick}
        className={cn(muted && 'text-muted-foreground')}
      >
        <Icon name={icon} className="size-4" />
        {text ?? label}
      </DropdownMenuItem>
    )
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
  text,
  ...link
}: {
  icon: IconName
  label: string
  /** The words in a menu, when shorter than `label`. */
  text?: string
  onClick?: () => void
} & Pick<LinkProps, 'to' | 'params' | 'search'>) {
  if (useContext(InMenu))
    return (
      <DropdownMenuItem asChild>
        <Link {...link}>
          <Icon name={icon} className="size-4" />
          {text ?? label}
        </Link>
      </DropdownMenuItem>
    )
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

// Width of 1 to 5 icon actions plus the 12px gap before them, so the amounts in one
// list line up whatever actions each row has.
const SLOT_WIDTH = {
  1: 'w-11',
  2: 'w-19',
  3: 'w-27',
  4: 'w-35',
  5: 'w-43',
} as const

export type ActionPlacement = 'row' | 'sheet' | 'always' | 'menu'

/** One ⋮ that opens the actions as a menu, at every width. */
function ActionsMenu({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div className={cn('flex shrink-0 items-center pl-1', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title={label}
            aria-label={label}
            className={cn(iconAction(), 'text-muted-foreground')}
          >
            <Icon name="more-vertical" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <InMenu.Provider value>{children}</InMenu.Provider>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

/**
 * An item's icon actions. On a `row` they sit right-aligned in a slot of fixed width from
 * `md` up; on phones they are in the item's sheet header instead (`sheet`). A row whose
 * item has no sheet keeps them at every width (`always`). In a `menu` they are behind one
 * ⋮, for a row with many actions (`menuLabel` names it); dialogs go outside it.
 */
export function IconActions({
  slots,
  placement = 'row',
  menuLabel = '',
  className,
  children,
}: {
  slots: keyof typeof SLOT_WIDTH
  placement?: ActionPlacement
  menuLabel?: string
  className?: string
  children?: React.ReactNode
}) {
  if (placement === 'menu')
    return (
      <ActionsMenu label={menuLabel} className={className}>
        {children}
      </ActionsMenu>
    )
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
