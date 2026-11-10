import { cn } from '#/lib/utils'

const SIZES = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-9',
} as const

/** A type's colour as a dot; an event without a type gets a neutral, empty one. */
export function EventBadge({
  color,
  size = 'md',
  className,
}: {
  color: string | null
  size?: keyof typeof SIZES
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'shrink-0 rounded-full',
        color ? '' : 'border-2 border-dashed border-border',
        SIZES[size],
        className,
      )}
      style={color ? { backgroundColor: color } : undefined}
    />
  )
}
