import { Icon } from '#/components/icon'
import { cn } from '#/lib/utils'

// Scaled to the circle: lg for the 64px icon, sm for 48px, xs for 36px.
const SIZES = {
  xs: 'size-4 [&_svg]:size-2.5',
  sm: 'size-5 [&_svg]:size-3',
  lg: 'size-7 [&_svg]:size-4',
} as const

/**
 * A small badge in the corner of a round button that opens a picker: a pencil on a
 * category icon, shown on hover and focus (always on touch screens, which have no
 * hover); a plus on an empty dashed circle, always. The button carries `group`, the
 * circle's wrapper `relative`.
 */
export function EditHint({
  size = 'lg',
  icon = 'pencil',
}: {
  size?: keyof typeof SIZES
  /** A plus marks an empty circle and always shows: it is the circle's only sign. */
  icon?: 'pencil' | 'plus'
}) {
  return (
    <span
      className={cn(
        'absolute -right-1 -bottom-1 grid place-items-center rounded-full border bg-card text-primary transition-opacity',
        icon === 'pencil' &&
          'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100',
        SIZES[size],
      )}
    >
      <Icon name={icon} />
    </span>
  )
}
