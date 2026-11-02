import { Icon as Iconify, addCollection } from '@iconify/react/offline'
import { cn } from '#/lib/utils'
import coolicons from '#/icons/coolicons.json'

// Offline: icons come only from the vendored file, never the Iconify API.
addCollection(coolicons)

export type IconName = keyof typeof coolicons.icons

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
