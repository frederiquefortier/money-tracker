import { Icon as Iconify, addCollection } from '@iconify/react/offline'
import { iconColor } from '#/lib/color'
import { cn } from '#/lib/utils'
import categoryIcons from '#/icons/category-coolicons.json'

// The picker's icons load with the category components only (ADR-020).
addCollection(categoryIcons)

const SIZES = {
  sm: 'size-7 [&_svg]:size-4',
  md: 'size-9 [&_svg]:size-5',
  lg: 'size-16 [&_svg]:size-8',
} as const

/** A category's icon in a filled circle of its colour; the icon stays readable (spec 12). */
export function CategoryBadge({
  icon,
  color,
  size = 'md',
  className,
}: {
  icon: string
  color: string
  size?: keyof typeof SIZES
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center rounded-full',
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: color, color: iconColor(color) }}
    >
      <Iconify icon={`coolicons:${icon}`} />
    </span>
  )
}
