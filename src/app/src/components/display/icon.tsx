import { Icon as Iconify, addCollection } from '@iconify/react/offline'
import { cn } from '#/lib/utils'
import uiIcons from '#/icons/ui-icons.json'

// Offline: icons come only from the vendored file, never the Iconify API.
addCollection(uiIcons)

export type IconName = keyof typeof uiIcons.icons

/** Decorative unless `label` is set. */
export function Icon({
  name,
  label,
  className,
}: {
  name: IconName
  label?: string
  className?: string
}) {
  return (
    <Iconify
      icon={`coolicons:${name}`}
      className={cn('size-5 shrink-0', className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
    />
  )
}
